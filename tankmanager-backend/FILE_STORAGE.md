# File Storage Integration für TankManager

## Übersicht

Für 100-1000 Maschinen mit Bildern und PDFs wird ein skalierbares File-Storage-System benötigt.

### Geplante Dateitypen:
- **Fahrzeugscheine:** Bilder/PDFs für StVZO-zugelassene Fahrzeuge
- **Bedienungsanleitungen:** PDF-Dokumente
- **Wartungsdokumente:** PDFs, Bilder
- **Maschinenfotos:** JPEG/PNG
- **Weitere Dokumente:** Kaufverträge, Rechnungen, etc.

### Storage-Anforderungen (REALISTISCH)

```
Pro Maschine - Stammdaten:
- 2-5 Bilder (Fahrzeugschein, Fotos): 2-10 MB
- 1-3 PDFs (Bedienungsanleitung): 5-20 MB
- Kaufvertrag, Unterlagen: 2-5 MB
Stammdaten Gesamt: ~15-35 MB

Pro Wartung:
- Wartungsprotokoll PDF mit Unterschrift: 1-3 MB
- Fotos (Zustand, Schäden): 2-8 MB
- PDF-Ausschnitt Bedienungsanleitung: 2-5 MB
- Optional: Videos (kurz): 10-50 MB
Pro Wartung Gesamt: ~5-15 MB

Wartungshistorie über 5-10 Jahre:
- 2-4 Wartungen pro Jahr
- 10-40 Wartungen gesamt
- 50-600 MB an Wartungsdokumenten

──────────────────────────────────────────
REALISTISCHE SCHÄTZUNG PRO MASCHINE:
  Minimum (wenig Wartung): ~50 MB
  Durchschnitt: ~100 MB
  Maximum (viel Wartung): ~200 MB
──────────────────────────────────────────

Skalierung (Durchschnitt 100 MB/Maschine):
├─ 100 Maschinen:    ~10 GB
├─ 500 Maschinen:    ~50 GB  
├─ 1000 Maschinen:   ~100 GB
└─ 5000 Maschinen:   ~500 GB

Backup-Größe (DB + Files):
├─ DB allein: ~50-200 MB
└─ Mit Files: 10 - 500 GB+
```

## Empfohlene Lösung: Cloudflare R2

### ✅ Vorteile:
- **Kostenlos bis 10 GB** Speicher pro Monat
- **KEINE Egress-Gebühren** (Downloads kostenlos!)
- **S3-kompatibel** (Standard-Libraries verwendbar)
- **Automatisches CDN** (schnell weltweit)
- **Sehr günstig:** $0.015/GB über Freigrenze

### 💰 Kosten-Vergleich (AKTUALISIERT)

| Storage-Option | 100 GB Speicher | 500 GB Download/Monat | Gesamt/Monat |
|----------------|-----------------|----------------------|--------------|
| Cloudflare R2  | $1.50           | $0 (kostenlos!)      | **$1.50** |
| AWS S3         | $2.30           | $45.00               | **$47.30** |
| Backblaze B2   | $0.50           | $0 (erste 10GB/Tag)  | **$0.50** |
| Hetzner Storage Box 1TB | - | - | **€3.81** |
| Railway Disk   | Nicht skalierbar für diese Größe | - | ❌ |

### Alternative: Hetzner Storage Box

Für sehr große Datenmengen (>100 GB) kann auch eine **Hetzner Storage Box** sinnvoll sein:

**Vorteile:**
- ✅ Festpreis (keine Überraschungen)
- ✅ 1 TB: 3,81€/Monat
- ✅ 5 TB: 11,90€/Monat
- ✅ Zugriff via SFTP, SMB, WebDAV
- ✅ Automatische Snapshots

**Nachteile:**
- ⚠️ Kein CDN (langsamere Zugriffe)
- ⚠️ Mehr eigene Implementation

### 🏆 Empfehlung für TankManager:

**Bis ~200 GB:** Cloudflare R2 (~$3/Monat)
**Ab 200 GB:** Hetzner Storage Box 1TB (€3.81/Monat) + R2 für häufig genutzte Files

## Implementation

### 1. Dependencies installieren

```bash
cd tankmanager-backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
```

### 2. Environment-Variablen (.env)

```env
# Cloudflare R2 Configuration
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key-id"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="tankmanager-files"
R2_PUBLIC_URL="https://pub-xxxxx.r2.dev"

# Optional: Custom Domain für R2
# R2_PUBLIC_URL="https://files.ihr-domain.de"
```

### 3. Storage Service erstellen

**Datei:** `src/core/storage/storage.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID');
    const accessKeyId = this.configService.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('R2_SECRET_ACCESS_KEY');
    
    this.bucketName = this.configService.get<string>('R2_BUCKET_NAME')!;
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL')!;

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }

  /**
   * Upload Datei zu R2
   */
  async uploadFile(
    file: Express.Multer.File,
    folder: string, // z.B. 'machines', 'documents'
  ): Promise<{ key: string; url: string }> {
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      key: fileName,
      url: `${this.publicUrl}/${fileName}`,
    };
  }

  /**
   * Download-URL generieren (signiert, läuft nach 1 Stunde ab)
   */
  async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Datei löschen
   */
  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  /**
   * Öffentliche URL für Datei
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
```

### 4. File Upload Controller

**Datei:** `src/modules/files/files.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload/:machineId')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('machineId') machineId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('title') title?: string,
    @Body('module') module?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Keine Datei hochgeladen');
    }

    // Validierung
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      throw new BadRequestException('Datei zu groß (max. 50 MB)');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];
    
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Dateityp nicht erlaubt');
    }

    return this.filesService.uploadFile(machineId, file, title, module);
  }

  @Get('machine/:machineId')
  async getFilesForMachine(@Param('machineId') machineId: string) {
    return this.filesService.getFilesForMachine(machineId);
  }

  @Get(':id/download-url')
  async getDownloadUrl(@Param('id') id: string) {
    return this.filesService.getDownloadUrl(id);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return this.filesService.deleteFile(id);
  }
}
```

### 5. File Service

**Datei:** `src/modules/files/files.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StorageService } from '../../core/storage/storage.service';
import { FileModule } from '@prisma/client';

@Injectable()
export class FilesService {
  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async uploadFile(
    machineId: string,
    file: Express.Multer.File,
    title?: string,
    module: string = 'MACHINE',
  ) {
    // Machine existiert?
    const machine = await this.prisma.machine.findUnique({
      where: { id: machineId },
    });
    
    if (!machine) {
      throw new NotFoundException('Maschine nicht gefunden');
    }

    // Upload zu R2
    const { key, url } = await this.storage.uploadFile(file, 'machines');

    // In DB speichern
    const fileRecord = await this.prisma.file.create({
      data: {
        machineId,
        module: module as FileModule,
        title: title || file.originalname,
        fileName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: key,
      },
    });

    return {
      ...fileRecord,
      url,
    };
  }

  async getFilesForMachine(machineId: string) {
    const files = await this.prisma.file.findMany({
      where: { machineId },
      orderBy: { uploadedAt: 'desc' },
    });

    return files.map((file) => ({
      ...file,
      url: this.storage.getPublicUrl(file.storageKey),
    }));
  }

  async getDownloadUrl(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('Datei nicht gefunden');
    }

    const signedUrl = await this.storage.getSignedDownloadUrl(file.storageKey);

    return { url: signedUrl };
  }

  async deleteFile(id: string) {
    const file = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('Datei nicht gefunden');
    }

    // Aus R2 löschen
    await this.storage.deleteFile(file.storageKey);

    // Aus DB löschen
    await this.prisma.file.delete({
      where: { id },
    });

    return { success: true };
  }
}
```

### 6. Frontend Integration

**File Upload Component:**

```typescript
// components/FileUpload.tsx
'use client';

import { useState } from 'react';
import Button from './Button';

type FileUploadProps = {
  machineId: string;
  onUploadComplete?: () => void;
};

export default function FileUpload({ machineId, onUploadComplete }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');

  async function handleUpload() {
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/files/upload/${machineId}`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload fehlgeschlagen');

      alert('Datei erfolgreich hochgeladen!');
      setFile(null);
      setTitle('');
      onUploadComplete?.();
    } catch (error) {
      alert('Fehler beim Upload: ' + error);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Datei hochladen</h3>
      
      <input
        type="text"
        placeholder="Titel (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
      />

      <input
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ marginBottom: '10px' }}
      />

      <Button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? '⏳ Lädt hoch...' : '📤 Hochladen'}
      </Button>
    </div>
  );
}
```

## Backup-Strategie für Files

### Ergänzung zum Backup-Script

**Datei:** `scripts/backup-files.ts`

```typescript
/**
 * Backup von R2 Files auf lokalen Server
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

async function backupFiles() {
  console.log('🔄 Starte File-Backup von R2...');
  
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bucketName = process.env.R2_BUCKET_NAME!;
  const backupDir = process.env.NETWORK_BACKUP_DIR || './backups/files';
  const timestamp = new Date().toISOString().split('T')[0];
  const targetDir = path.join(backupDir, `files_${timestamp}`);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Liste alle Objekte
  const listCommand = new ListObjectsV2Command({
    Bucket: bucketName,
  });

  const { Contents } = await s3Client.send(listCommand);
  
  if (!Contents || Contents.length === 0) {
    console.log('⚠️  Keine Dateien in R2 gefunden');
    return;
  }

  console.log(`📦 Lade ${Contents.length} Dateien herunter...`);

  for (const object of Contents) {
    const key = object.Key!;
    const getCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const { Body } = await s3Client.send(getCommand);
    const targetPath = path.join(targetDir, key);
    const targetFolder = path.dirname(targetPath);

    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Stream zu Datei
    const writeStream = fs.createWriteStream(targetPath);
    const bodyStream = Body as Readable;
    bodyStream.pipe(writeStream);

    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    console.log(`✅ ${key}`);
  }

  console.log(`\n✅ File-Backup abgeschlossen: ${targetDir}`);
}

backupFiles();
```

**package.json Script:**
```json
{
  "scripts": {
    "backup": "ts-node scripts/backup-database.ts",
    "backup:files": "ts-node scripts/backup-files.ts",
    "backup:all": "npm run backup && npm run backup:files"
  }
}
```

## Sicherheits-Best-Practices

### 1. Datei-Validierung
- ✅ Dateigröße begrenzen (z.B. 50 MB)
- ✅ Dateityp prüfen (nur JPEG, PNG, PDF)
- ✅ Dateinamen sanitizen
- ✅ Virus-Scan bei kritischen Anwendungen

### 2. Zugriffskontrolle
- ✅ Signierte URLs mit Ablaufzeit
- ✅ Berechtigungsprüfung (Nutzer → Maschine → Datei)
- ✅ Audit-Log für Downloads

### 3. Performance
- ✅ CDN-Caching für Bilder
- ✅ Thumbnail-Generierung für große Bilder
- ✅ Progressive Loading im Frontend

## Monitoring & Wartung

### Storage-Nutzung überwachen

```typescript
// In backend: GET /files/stats
async getStorageStats() {
  const totalFiles = await this.prisma.file.count();
  const totalSize = await this.prisma.file.aggregate({
    _sum: { sizeBytes: true },
  });

  return {
    totalFiles,
    totalSizeGB: (totalSize._sum.sizeBytes || 0) / (1024 * 1024 * 1024),
  };
}
```

## Kosten-Übersicht (REALISTISCH: 1000 Maschinen mit Wartung)

### Szenario 1: Cloudflare R2 (bis 200 GB)

| Komponente | Spezifikation | Kosten/Monat |
|------------|---------------|--------------|
| Railway Backend | 2 GB RAM | 10€ |
| Railway PostgreSQL | 2 GB | 10€ |
| Cloudflare R2 | 100 GB Storage | $1.50 (≈1.38€) |
| Cloudflare R2 | Downloads | 0€ (kostenlos) |
| Vercel Frontend | Hosting | 0€ |
| **GESAMT** | | **~21€/Monat** |

### Szenario 2: Hybrid (über 200 GB)

| Komponente | Spezifikation | Kosten/Monat |
|------------|---------------|--------------|
| Railway Backend + DB | 4 GB RAM gesamt | 20€ |
| Hetzner Storage Box | 1 TB | 3.81€ |
| Cloudflare R2 | 20 GB (Cache) | $0.30 (≈0.28€) |
| Vercel Frontend | Hosting | 0€ |
| **GESAMT** | | **~24€/Monat** |

### Szenario 3: Alles bei Hetzner (Maximale Kontrolle)

| Komponente | Spezifikation | Kosten/Monat |
|------------|---------------|--------------|
| Hetzner VPS CPX31 | 4 vCPU, 8 GB RAM | 14,28€ |
| Hetzner Storage Box | 1 TB | 3,81€ |
| Hetzner Backup Space | 100 GB (DB Backups) | 3,81€ |
| Vercel Frontend | Hosting | 0€ |
| **GESAMT** | | **~22€/Monat** |

## Empfehlung nach Wachstumsphasen

### Phase 1: Start (1-100 Maschinen, ~10 GB)
- **Cloudflare R2 + Railway**
- Kosten: ~15€/Monat
- Einfachstes Setup

### Phase 2: Wachstum (100-500 Maschinen, ~50 GB)
- **Cloudflare R2 + Railway**
- Kosten: ~16-18€/Monat
- Noch sehr günstig mit R2

### Phase 3: Etabliert (500-1000 Maschinen, ~100 GB)
- **Cloudflare R2 + Railway** ODER
- **Hetzner Storage Box + Railway**
- Kosten: ~21-24€/Monat
- Je nach Präferenz

### Phase 4: Groß (1000+ Maschinen, >200 GB)
- **Hetzner Storage Box 1TB + Railway** ODER
- **Komplett bei Hetzner VPS**
- Kosten: ~22-25€/Monat
- Festpreise, keine Überraschungen

## Zusammenfassung

✅ **Cloudflare R2 ist die beste Wahl für TankManager**
- Extrem günstig (~kostenlos für Ihre Größe)
- Keine Download-Gebühren
- S3-kompatibel (Standard-Code)
- Automatisches globales CDN

✅ **Implementation einfach:**
1. R2 Bucket erstellen
2. Storage Service einbauen
3. Upload-Endpoints hinzufügen
4. Frontend File-Upload-Component
5. Tägliches Backup-Script erweitern

✅ **Skalierbar bis 10.000+ Maschinen** ohne Kosten-Explosion
