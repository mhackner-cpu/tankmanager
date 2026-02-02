import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  storageConfig,
  sanitizeFileName,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from './files.config';
import { FileResponseDto } from './dto/file-response.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class FilesService {
  private s3Client: S3Client | null = null;

  constructor(private prisma: PrismaService) {
    if (storageConfig.provider === 'r2' && storageConfig.r2) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${storageConfig.r2.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: storageConfig.r2.accessKeyId,
          secretAccessKey: storageConfig.r2.secretAccessKey,
        },
      });
    }
  }

  /**
   * Upload a file to storage (R2 or local)
   */
  async uploadFile(
    file: Express.Multer.File,
    machineId: string,
    companyId: string,
    title?: string,
    module: string = 'MACHINE',
    uploadedBy?: string,
  ): Promise<FileResponseDto> {

    // Logging Storage-Konfiguration
    console.log('Storage Provider:', storageConfig.provider);
    console.log('R2 Bucket:', storageConfig.r2?.bucketName);
    console.log('R2 Account ID:', storageConfig.r2?.accountId);
    console.log('R2 Endpoint:', storageConfig.r2?.publicUrl || `https://${storageConfig.r2?.accountId}.r2.cloudflarestorage.com`);

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed`,
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Verify machine belongs to company
    const machine = await this.prisma.machine.findFirst({
      where: { id: machineId, companyId },
    });

    if (!machine) {
      throw new ForbiddenException('Machine not found or access denied');
    }

    // Generate storage key
    const fileId = this.generateId();
    const sanitized = sanitizeFileName(file.originalname);
    const ext = path.extname(sanitized);
    const storageKey = `companies/${companyId}/machines/${machineId}/files/${fileId}${ext}`;

    // Upload to storage
    if (storageConfig.provider === 'r2' && this.s3Client) {
      await this.uploadToR2(storageKey, file.buffer, file.mimetype);
    } else {
      await this.uploadToLocal(storageKey, file.buffer);
    }

    // Save metadata to database
    const fileRecord = await this.prisma.file.create({
      data: {
        id: fileId,
        machineId,
        module: module as any,
        title: title || file.originalname,
        fileName: sanitized,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey,
        uploadedBy,
        uploadedAt: new Date(),
      },
    });

    return this.toResponseDto(fileRecord);
  }

  /**
   * Get all files for a machine
   */
  async getFilesByMachine(
    machineId: string,
    companyId: string,
  ): Promise<FileResponseDto[]> {
    // Verify machine belongs to company
    const machine = await this.prisma.machine.findFirst({
      where: { id: machineId, companyId },
    });

    if (!machine) {
      throw new ForbiddenException('Machine not found or access denied');
    }

    const files = await this.prisma.file.findMany({
      where: { machineId },
      orderBy: { uploadedAt: 'desc' },
    });

    return Promise.all(files.map((file) => this.toResponseDto(file)));
  }

  /**
   * Get a single file
   */
  async getFile(fileId: string, companyId: string): Promise<FileResponseDto> {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
      include: { machine: true },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (file.machine.companyId !== companyId) {
      throw new ForbiddenException('Access denied');
    }

    return this.toResponseDto(file);
  }

  /**
   * Download file content
   */
  async downloadFile(
    fileId: string,
    companyId: string,
  ): Promise<{ buffer: Buffer; mimeType: string; fileName: string }> {
    const file = await this.getFile(fileId, companyId);

    let buffer: Buffer;
    if (storageConfig.provider === 'r2' && this.s3Client) {
      buffer = await this.downloadFromR2(file.storageKey);
    } else {
      buffer = await this.downloadFromLocal(file.storageKey);
    }

    return {
      buffer,
      mimeType: file.mimeType || 'application/octet-stream',
      fileName: file.fileName,
    };
  }

  /**
   * Generate a signed URL for preview/download (24h validity)
   */
  async getSignedUrl(
    fileId: string,
    companyId: string,
    expiresIn: number = 86400,
  ): Promise<string> {
    const file = await this.getFile(fileId, companyId);

    if (storageConfig.provider === 'r2' && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: storageConfig.r2!.bucketName,
        Key: file.storageKey,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } else {
      // For local storage, return API endpoint
      return `/api/files/${fileId}/download`;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string, companyId: string): Promise<void> {
    const file = await this.getFile(fileId, companyId);

    // Delete from storage
    if (storageConfig.provider === 'r2' && this.s3Client) {
      await this.deleteFromR2(file.storageKey);
    } else {
      await this.deleteFromLocal(file.storageKey);
    }

    // Delete from database
    await this.prisma.file.delete({
      where: { id: fileId },
    });
  }

  /**
   * Delete all files for a machine (when machine is deleted)
   */
  async deleteFilesByMachine(
    machineId: string,
    companyId: string,
  ): Promise<void> {
    const files = await this.getFilesByMachine(machineId, companyId);

    for (const file of files) {
      await this.deleteFile(file.id, companyId);
    }
  }

  // ===== PRIVATE METHODS =====

  private async uploadToR2(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    if (!this.s3Client) {
      throw new Error('R2 client not initialized');
    }

    const command = new PutObjectCommand({
      Bucket: storageConfig.r2!.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
  }

  private async uploadToLocal(key: string, buffer: Buffer): Promise<void> {
    const fullPath = path.join(storageConfig.local!.uploadPath, key);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
  }

  private async downloadFromR2(key: string): Promise<Buffer> {
    if (!this.s3Client) {
      throw new Error('R2 client not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: storageConfig.r2!.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const chunks: Uint8Array[] = [];

    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  private async downloadFromLocal(key: string): Promise<Buffer> {
    const fullPath = path.join(storageConfig.local!.uploadPath, key);
    return await fs.readFile(fullPath);
  }

  private async deleteFromR2(key: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('R2 client not initialized');
    }

    const command = new DeleteObjectCommand({
      Bucket: storageConfig.r2!.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  private async deleteFromLocal(key: string): Promise<void> {
    const fullPath = path.join(storageConfig.local!.uploadPath, key);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // File might not exist, ignore
    }
  }

  private async toResponseDto(file: any): Promise<FileResponseDto> {
    return {
      id: file.id,
      machineId: file.machineId,
      module: file.module,
      title: file.title,
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      storageKey: file.storageKey,
      uploadedBy: file.uploadedBy,
      uploadedAt: file.uploadedAt,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
