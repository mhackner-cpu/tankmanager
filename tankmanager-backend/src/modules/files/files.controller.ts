import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UploadFileDto } from './dto/upload-file.dto';
import { FileResponseDto } from './dto/file-response.dto';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /**
   * Upload a file
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: any,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return await this.filesService.uploadFile(
      file,
      dto.machineId,
      user.companyId,
      dto.title,
      dto.module,
      user.id,
    );
  }

  /**
   * Get all files for a machine
   */
  @Get('machines/:machineId')
  async getFilesByMachine(
    @Param('machineId') machineId: string,
    @CurrentUser() user: any,
  ): Promise<FileResponseDto[]> {
    return await this.filesService.getFilesByMachine(machineId, user.companyId);
  }

  /**
   * Get file metadata
   */
  @Get(':id')
  async getFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<FileResponseDto> {
    return await this.filesService.getFile(id, user.companyId);
  }

  /**
   * Download file
   */
  @Get(':id/download')
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, mimeType, fileName } = await this.filesService.downloadFile(
      id,
      user.companyId,
    );

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }

  /**
   * Get signed URL for preview (24h validity)
   */
  @Get(':id/preview')
  async getPreviewUrl(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ url: string }> {
    const url = await this.filesService.getSignedUrl(id, user.companyId);
    return { url };
  }

  /**
   * Delete a file
   */
  @Delete(':id')
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.filesService.deleteFile(id, user.companyId);
    return { message: 'File deleted successfully' };
  }
}
