# 📦 File-Storage Installation & Setup

## Backend Installation

### 1. Dependencies installieren

```bash
cd tankmanager-backend

# AWS SDK für Cloudflare R2 (S3-kompatibel)
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Multer für File-Upload
npm install multer @nestjs/platform-express

# TypeScript Types
npm install @types/multer --save-dev
```

### 2. Environment Variables konfigurieren

**Für Development (Lokaler Storage):**

Bereits in `.env` konfiguriert:
```bash
STORAGE_PROVIDER="local"
UPLOAD_PATH="./uploads"
```

**Für Production (Cloudflare R2):**

Später in Railway Environment Variables setzen:
```bash
STORAGE_PROVIDER="r2"
R2_ACCOUNT_ID="your-account-id-here"
R2_ACCESS_KEY_ID="your-access-key-here"
R2_SECRET_ACCESS_KEY="your-secret-access-key"
R2_BUCKET_NAME="tankmanager-production"
R2_PUBLIC_URL="https://files.yourdomain.com"  # Optional
```

### 3. Backend starten

```bash
# Development
npm run start:dev

# Backend läuft auf Port 3005
# Files-Endpoints sind verfügbar unter /api/files/*
```

### 4. Testen mit Postman/cURL

**Upload-Test:**
```bash
# Zuerst einloggen und JWT-Token erhalten
curl -X POST http://localhost:3005/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"password"}'

# Token speichern: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# File uploaden
curl -X POST http://localhost:3005/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf" \
  -F "machineId=YOUR_MACHINE_UUID" \
  -F "title=Bedienungsanleitung" \
  -F "module=MACHINE"

# Response:
# {
#   "id": "1738195200000-xyz",
#   "machineId": "...",
#   "fileName": "test.pdf",
#   "mimeType": "application/pdf",
#   "sizeBytes": 2048576,
#   "uploadedAt": "2026-01-29T12:00:00Z"
# }
```

**Download-Test:**
```bash
curl -X GET http://localhost:3005/files/{FILE_ID}/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o downloaded-file.pdf
```

**Liste aller Dateien einer Maschine:**
```bash
curl -X GET http://localhost:3005/files/machines/{MACHINE_ID} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Cloudflare R2 Setup (Production)

### 1. Cloudflare Account erstellen

1. Gehe zu [Cloudflare](https://dash.cloudflare.com/sign-up)
2. Registriere dich (kostenlos)
3. Email verifizieren

### 2. R2 aktivieren

1. Dashboard → "R2 Object Storage"
2. "Get Started" klicken
3. R2 ist kostenlos bis 10 GB Storage

### 3. Bucket erstellen

1. "Create bucket"
2. Name: `tankmanager-production`
3. Location: Automatic (weltweit verteilt)
4. "Create bucket"

### 4. API-Token erstellen

1. R2 Dashboard → "Manage R2 API Tokens"
2. "Create API Token"
3. Name: `tankmanager-backend`
4. Permissions: **"Admin Read & Write"**
5. TTL: Keine Ablaufzeit
6. "Create API Token"

**Notiere dir:**
```
Access Key ID: abc123...
Secret Access Key: xyz789...
```

⚠️ **Wichtig:** Secret wird nur EINMAL angezeigt!

### 5. Account ID finden

1. R2 Dashboard (oben rechts)
2. Account ID kopieren (z.B. `1a2b3c4d5e6f7g8h9i0j`)

### 6. Environment Variables in Railway setzen

1. Railway Dashboard → Dein Backend-Service
2. "Variables" Tab
3. Füge hinzu:
   ```
   STORAGE_PROVIDER=r2
   R2_ACCOUNT_ID=1a2b3c4d5e6f7g8h9i0j
   R2_ACCESS_KEY_ID=abc123...
   R2_SECRET_ACCESS_KEY=xyz789...
   R2_BUCKET_NAME=tankmanager-production
   ```
4. "Deploy" → Service startet neu mit R2-Support

### 7. Testen

```bash
# Upload-Test auf Production
curl -X POST https://api.yourdomain.com/files/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@test.pdf" \
  -F "machineId=..." \
  -F "title=Test Upload"

# Datei wird in R2 hochgeladen: companies/.../machines/.../files/...
```

**Prüfen in Cloudflare:**
1. R2 Dashboard → Bucket öffnen
2. Du solltest Ordnerstruktur sehen: `companies/...`

---

## Frontend Installation (TODO)

### 1. Dependencies installieren

```bash
cd tankmanager-frontend

# File-Upload mit Drag & Drop
npm install react-dropzone

# Icons für Dateitypen
npm install react-icons

# PDF-Vorschau (optional)
npm install react-pdf
```

### 2. Komponenten erstellen

**FileUpload.tsx:**
- Drag & Drop Zone
- Mehrfach-Auswahl
- Progress-Bar
- Validierung (Typ, Größe)

**FileList.tsx:**
- Liste aller Dateien
- Download-Button
- Delete-Button
- Vorschau (Lightbox für Bilder)

**FilePreview.tsx:**
- Inline PDF-Viewer
- Bild-Vorschau
- Download-Link

### 3. In Maschinen-Detail integrieren

```typescript
// app/machines/[id]/page.tsx
<section>
  <h2>📄 Dateien & Dokumente</h2>
  <FileUpload machineId={machine.id} />
  <FileList machineId={machine.id} />
</section>
```

---

## Kosten-Kalkulation

### Cloudflare R2

**Free Tier (für immer):**
- 10 GB Storage
- 10 Millionen Read-Requests/Monat
- 1 Million Write-Requests/Monat
- **UNBEGRENZT Downloads (Egress kostenlos!)**

**Paid (über Free Tier):**
- $0.015/GB Storage pro Monat
- $0.36/Million Read-Requests
- $4.50/Million Write-Requests
- **$0 Egress (immer kostenlos!)**

**Beispiele:**
```
10 GB, 1M Requests:    $0/Monat (Free Tier)
50 GB, 5M Requests:    $0.60/Monat
100 GB, 10M Requests:  $1.35/Monat
500 GB, 50M Requests:  $7.35/Monat
1 TB, 100M Requests:   $14.85/Monat
```

### Vergleich: AWS S3

```
100 GB Storage:        $2.30/Monat
100 GB Downloads:      $9.00/Monat
10M Requests:          $0.50/Monat
TOTAL:                 $11.80/Monat

R2 TOTAL:              $1.35/Monat
ERSPARNIS:             $10.45/Monat (88% günstiger!)
```

---

## Troubleshooting

### Backend startet nicht

**Error: "Cannot find module '@aws-sdk/client-s3'"**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Error: "Cannot find module 'multer'"**
```bash
npm install multer @nestjs/platform-express @types/multer
```

### Upload schlägt fehl

**401 Unauthorized**
→ JWT-Token fehlt oder ungültig

**403 Forbidden**
→ Machine gehört nicht zu deiner Company

**400 Bad Request: "File type not allowed"**
→ Nur JPEG, PNG, PDF, Word, Excel erlaubt

**400 Bad Request: "File size exceeds maximum"**
→ Max. 50 MB pro Datei

### R2-Upload schlägt fehl

**Error: "Access Denied"**
→ R2 API-Token falsch oder abgelaufen

**Error: "NoSuchBucket"**
→ Bucket-Name falsch oder existiert nicht

**Error: "SignatureDoesNotMatch"**
→ Secret Access Key falsch

**Fix:**
1. Cloudflare Dashboard → R2 → API Tokens
2. Neues Token erstellen
3. Environment Variables in Railway aktualisieren

### Lokaler Upload funktioniert nicht

**Error: "ENOENT: no such file or directory"**
→ `./uploads` Ordner fehlt

**Fix:**
```bash
mkdir uploads
# Oder in .gitignore eintragen und automatisch erstellen lassen
```

---

## Security Best Practices

✅ **JWT-Token validieren** - Jeder Endpoint prüft Authentication
✅ **CompanyId-Filter** - User kann nur eigene Files sehen
✅ **Datei-Validierung** - Nur erlaubte Typen und Größen
✅ **Signed URLs** - Sichere Downloads mit Ablaufzeit (24h)
✅ **File-Name sanitizen** - Keine Sonderzeichen
✅ **Cascade Delete** - Wenn Maschine gelöscht → Files auch
✅ **Keine direkten R2-URLs** - Immer über API

❌ **NICHT:** R2-Bucket öffentlich machen
❌ **NICHT:** Credentials in Code committen
❌ **NICHT:** Unbegrenzte File-Größe erlauben

---

## Deployment-Checkliste

**Development (Lokal):**
- [x] Backend-Module erstellt
- [x] Dependencies installiert
- [x] .env konfiguriert (STORAGE_PROVIDER=local)
- [ ] Frontend-Komponenten erstellen
- [ ] Testing mit Postman
- [ ] Upload/Download funktioniert

**Production (Railway + R2):**
- [ ] Cloudflare Account erstellt
- [ ] R2-Bucket erstellt
- [ ] API-Token generiert
- [ ] Environment Variables in Railway gesetzt
- [ ] Code gepusht → Auto-Deploy
- [ ] Upload-Test auf Production
- [ ] Prüfen: Files landen in R2

**Go-Live:**
- [ ] File-Upload im Frontend integriert
- [ ] Beta-User testen lassen
- [ ] Feedback einholen
- [ ] Bugs fixen
- [ ] Feature für alle freischalten

---

## Status

✅ **Backend KOMPLETT fertig**
- Files-Module implementiert
- API-Endpoints funktionieren
- R2-Support + Local-Fallback
- Multi-Tenancy sicher

🚧 **Frontend TODO**
- FileUpload-Komponente
- FileList-Komponente
- Integration in Maschinen-Detail

⏱️ **Entwicklungszeit:** 2-3 Tage für Frontend

🚀 **Deployment:** Sobald Frontend fertig → Git Push → Live!
