export class FileResponseDto {
  id: string;
  machineId: string;
  module: string;
  title: string | null;
  fileName: string;
  mimeType: string | null;
  sizeBytes: number | null;
  storageKey: string;
  uploadedBy: string | null;
  uploadedAt: Date;
  downloadUrl?: string;
  previewUrl?: string;
}
