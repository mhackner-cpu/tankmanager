import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';

export enum FileModule {
  MACHINE = 'MACHINE',
  MAINTENANCE = 'MAINTENANCE',
  UVV = 'UVV',
}

export class UploadFileDto {
  @IsUUID()
  machineId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(FileModule)
  module?: FileModule = FileModule.MACHINE;
}
