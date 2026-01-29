# 📂 File Upload System - Benutzeranleitung

## ✅ Installation Complete

Das File-Upload-System ist vollständig implementiert und einsatzbereit.

## 🚀 Lokales Testen

### 1. Backend starten
```bash
cd tankmanager-backend
npm run start:dev
```
Backend läuft auf: `http://localhost:3005`

### 2. Frontend starten
```bash
cd tankmanager-frontend
npm run dev
```
Frontend läuft auf: `http://localhost:3000`

### 3. Testen
1. Im Browser: `http://localhost:3000`
2. Einloggen mit bestehendem Account
3. Zu "Maschinen & Geräte" navigieren
4. Eine Maschine auswählen
5. Nach unten scrollen zum Abschnitt "📄 Dateien & Dokumente"

## 📋 Funktionen

### ✅ Datei hochladen
- **Drag & Drop**: Datei ins Upload-Feld ziehen
- **Click to Upload**: Auf "Datei auswählen" klicken
- **Progress Bar**: Zeigt Upload-Fortschritt an
- **Validierung**: 
  - Max. 50MB pro Datei
  - Erlaubte Formate: Bilder (jpg, png, gif, webp), PDFs, Office-Dokumente (doc, docx, xls, xlsx)

### ✅ Dateien anzeigen
- Liste aller hochgeladenen Dateien
- Icons für verschiedene Dateitypen
- Dateigröße und Upload-Datum
- Sortiert nach Upload-Datum (neueste zuerst)

### ✅ Datei herunterladen
- Download-Button (⬇️) neben jeder Datei
- Original-Dateiname wird beibehalten

### ✅ Datei löschen
- Löschen-Button (🗑️) neben jeder Datei
- Bestätigungsdialog vor dem Löschen

## 🔒 Sicherheit

### Multi-Tenancy
- Jede Firma sieht nur eigene Dateien
- Automatische Isolation durch JWT-Token
- Keine manuellen Company-ID-Checks notwendig

### File-Validierung
- MIME-Type Whitelist (keine Executables)
- Max. Dateigröße: 50MB
- UUID-basierte Dateinamen (keine Original-Namen im Storage)
- Sanitization von Dateinamen

### Authentication
- Bearer Token required für alle Endpoints
- JWT mit 7 Tage Gültigkeit
- Automatische Token-Verwaltung im Frontend

## 📁 Storage-Struktur

### Lokal (Entwicklung)
```
tankmanager-backend/uploads/
  companies/
    1/                           # Company ID
      machines/
        5/                       # Machine ID
          files/
            550e8400-e29b-41d4-a716-446655440000.pdf
            7c9e6679-7425-40de-944b-e07fc1f90ae7.jpg
```

### Production (Cloudflare R2)
```
r2://tankmanager-files/
  companies/
    1/
      machines/
        5/
          files/
            ...
```

## 🎨 UI-Komponenten

### FileUpload
**Location**: `components/FileUpload.tsx`

**Props**:
- `machineId: string` - ID der Maschine
- `onUploadSuccess: () => void` - Callback nach erfolgreichem Upload

**Features**:
- Drag & Drop mit visuellem Feedback (grüner Border)
- Click to Upload Alternative
- Progress Bar (0-100%)
- Error-Handling mit rotem Alert
- Success-Message mit grünem Alert
- Automatische Validierung

### FileList
**Location**: `components/FileList.tsx`

**Props**:
- `machineId: string` - ID der Maschine
- `refreshTrigger: number` - Trigger für Reload (nach Upload)

**Features**:
- Responsive Grid-Layout
- File-Type Icons (📄, 📊, 📝, 🖼️)
- Formatierte Dateigrößen (KB, MB)
- Deutsche Datums-Formatierung
- Loading & Empty States
- Error-Handling

## 🌐 API Endpoints

### POST /files/upload
Upload einer neuen Datei.

**Body**: `multipart/form-data`
- `file`: File
- `machineId`: string
- `description`: string (optional)

**Response**: `FileResponseDto`

### GET /files/machines/:machineId
Alle Dateien einer Maschine abrufen.

**Response**: `FileResponseDto[]`

### GET /files/:id
Metadaten einer Datei abrufen.

**Response**: `FileResponseDto`

### GET /files/:id/download
Datei herunterladen (Blob).

**Response**: File Blob

### GET /files/:id/preview
Preview-URL generieren (Signed URL für R2).

**Response**: `{ url: string }`

### DELETE /files/:id
Datei löschen.

**Response**: `{ success: true }`

## 🔧 Konfiguration

### Environment Variables (`.env`)

**Lokal (Entwicklung)**:
```env
STORAGE_PROVIDER="local"
UPLOAD_PATH="./uploads"
```

**Production (Cloudflare R2)**:
```env
STORAGE_PROVIDER="r2"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="tankmanager-files"
```

### Cloudflare R2 Setup

1. **Cloudflare Dashboard** → **R2**
2. **Create Bucket**: `tankmanager-files`
3. **API Tokens** → **Create API Token**
4. Permissions: Object Read & Write
5. Credentials in `.env` eintragen
6. `STORAGE_PROVIDER="r2"` setzen

## 💰 Kosten (Production)

### Cloudflare R2
- **Free Tier**: 10GB Storage, 1M Class A operations
- **Nach Free Tier**: $0.015/GB/Monat
- **Egress**: $0 (keine Download-Gebühren!)

**Beispiel**:
- 100GB Storage = $1.50/Monat
- 1TB Storage = $15/Monat

### Vergleich AWS S3:
- 100GB Storage + 100GB Egress = $47.30/Monat
- **Ersparnis: 97%** durch Cloudflare R2

## 📊 Limits

### File-Größen
- **Max. File Size**: 50MB
- **Frontend Validierung**: Ja
- **Backend Validierung**: Ja

### Erlaubte MIME-Types
- **Bilder**: image/jpeg, image/png, image/gif, image/webp
- **PDFs**: application/pdf
- **Office**: 
  - application/msword (.doc)
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)
  - application/vnd.ms-excel (.xls)
  - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (.xlsx)

## 🐛 Troubleshooting

### "Upload failed: 401"
- JWT Token abgelaufen oder ungültig
- Lösung: Neu einloggen

### "File too large"
- Datei > 50MB
- Lösung: Kleinere Datei verwenden oder MAX_FILE_SIZE erhöhen

### "Invalid file type"
- MIME-Type nicht erlaubt
- Lösung: Erlaubte Formate prüfen

### "Error loading files"
- Backend nicht erreichbar
- Lösung: Backend starten (`npm run start:dev`)

### Keine Dateien sichtbar
- Multi-Tenancy: Nur eigene Company-Dateien sichtbar
- Lösung: Mit richtigem Account einloggen

## 🎯 Next Steps

### Production Deployment
1. Cloudflare R2 Bucket erstellen
2. API Credentials generieren
3. Environment Variables setzen
4. Backend auf Railway deployen
5. Frontend auf Vercel deployen
6. Testen mit echten Dateien

### Weitere Features (Optional)
- Image Preview (Thumbnails)
- PDF Viewer (eingebettet)
- Batch Upload (mehrere Dateien gleichzeitig)
- File Sharing (Links generieren)
- File Versioning (History)
- Compression (für große Bilder)

## 📝 Integration in andere Seiten

Um File-Upload in andere Seiten zu integrieren:

```tsx
import FileUpload from '@/components/FileUpload';
import FileList from '@/components/FileList';
import { useState } from 'react';

export default function MeinePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const machineId = '123'; // Deine Machine ID

  return (
    <div>
      <h2>Dateien</h2>
      <FileUpload 
        machineId={machineId} 
        onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)} 
      />
      <FileList 
        machineId={machineId} 
        refreshTrigger={refreshTrigger} 
      />
    </div>
  );
}
```

## ✅ Checkliste

- ✅ Backend Files-Module implementiert
- ✅ Frontend Components erstellt
- ✅ Integration in Machine-Detail-Page
- ✅ Multi-Tenancy enforced
- ✅ Local Storage konfiguriert
- ✅ TypeScript Errors behoben
- ✅ Dokumentation erstellt
- ⏳ Lokales Testing
- ⏳ Production Deployment

---

**Erstellt am**: 29.01.2026  
**Status**: Ready for Testing  
**Version**: 1.0.0
