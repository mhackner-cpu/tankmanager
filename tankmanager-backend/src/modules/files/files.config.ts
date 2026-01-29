export interface StorageConfig {
  provider: 'r2' | 'local';
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl?: string;
  };
  local?: {
    uploadPath: string;
  };
}

export const storageConfig: StorageConfig = {
  provider: (process.env.STORAGE_PROVIDER as 'r2' | 'local') || 'local',
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'tankmanager-production',
    publicUrl: process.env.R2_PUBLIC_URL,
  },
  local: {
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },
};

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}
