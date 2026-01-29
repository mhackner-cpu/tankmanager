# Cloud-Deployment & Backup-Strategie für TankManager

## Aktuelle Situation
- **Datenbank:** PostgreSQL lokal auf localhost:5432
- **Backend:** NestJS auf Port 3005
- **Frontend:** Next.js auf Port 3000
- **Zugriff:** Nur lokal verfügbar
- **Geplant:** 100-1000 Maschinen mit Dateien (Bilder, PDFs, Bedienungsanleitungen)
- **Storage-Bedarf:** 10-500 GB (je nach Dateimenge)

## ⚠️ Wichtig: File Storage bei Skalierung

### Storage-Anforderungen (REALISTISCH)
```
Pro Maschine - Stammdaten:
- 2-5 Bilder (Fahrzeugschein, Fotos): 2-10 MB
- 1-3 PDFs (Bedienungsanleitung): 5-20 MB
- Kaufvertrag, Unterlagen: 2-5 MB
Stammdaten: ~15-35 MB

Pro Wartung (mit Unterschrift, PDF-Ausschnitte):
- Wartungsprotokoll PDF: 1-3 MB
- Fotos (Zustand, Schäden): 2-8 MB
- PDF-Ausschnitt Bedienungsanleitung: 2-5 MB
Pro Wartung: ~5-15 MB

Über 5-10 Jahre (10-40 Wartungen): 50-600 MB

Durchschnitt: ~100 MB pro Maschine

Bei 100 Maschinen:   ~10 GB
Bei 500 Maschinen:   ~50 GB  
Bei 1000 Maschinen:  ~100 GB
```

### ❌ NICHT empfohlen: Lokaler File-Storage
- Backup-Größe explodiert (Datenbank + alle Dateien)
- Langsame Uploads bei Cloud-Deployment
- Keine CDN-Unterstützung
- Teurer bei Hoster-Storage

### ✅ EMPFOHLEN: Cloud Object Storage

#### Option 1: Cloudflare R2 (Beste Preis-Leistung)
**Vorteile:**
- ✅ **KEINE Egress-Gebühren** (Download kostenlos!)
- ✅ S3-kompatible API
- ✅ Automatisches CDN
- ✅ 10 GB Speicher kostenlos/Monat
- ✅ $0.015/GB darüber hinaus

**Kosten-Beispiel:**
```
100 Maschinen (10 GB):      Kostenlos (unter 10 GB)
500 Maschinen (50 GB):      $0.60/Monat
1000 Maschinen (100 GB):    $1.35/Monat (über 10 GB Freibetrag)
```

#### Option 2: AWS S3 (Standard, aber teuer)
- ⚠️ Egress-Gebühren: $0.09/GB Download
- ⚠️ Bei 100 Downloads/Monat von 10 MB: ~$10/Monat
- ✅ Sehr zuverlässig, integriert mit AWS-Ökosystem

#### Option 3: Backblaze B2 (Günstig)
- ✅ $0.005/GB Speicher
- ✅ Erste 10 GB Download/Tag kostenlos
- ✅ S3-kompatible API

### Empfohlene Architektur mit Storage

### Empfohlene Architektur mit Storage

```
┌─────────────────────────────────────────────────────┐
│                   BENUTZER                          │
│              (Browser / Mobile)                     │
└─────────────────┬───────────────────────────────────┘
                  │
         ┌────────┴─────────┐
         │                  │
    ┌────▼─────┐      ┌────▼──────────┐
    │ Frontend │      │ Cloudflare R2 │
    │ (Vercel) │      │  File Storage │
    └────┬─────┘      └───────────────┘
         │                  ▲
    ┌────▼─────┐           │
    │ Backend  │───────────┘
    │(Railway) │      Upload/Download
    └────┬─────┘
         │
    ┌────▼─────┐
    │PostgreSQL│
    │(Railway) │
    └──────────┘
         │
    ┌────▼─────────┐
    │ Tägliches    │
    │ Backup zu    │
    │Ihrem Server  │
    └──────────────┘
```

## Empfohlene Cloud-Lösung (AKTUALISIERT)

### 🏆 Beste Lösung: Railway + Cloudflare R2

**Stack:**
- **Frontend:** Vercel (kostenlos)
- **Backend + DB:** Railway.app (~15-20€/Monat)
- **File Storage:** Cloudflare R2 ($0.015/GB über 10 GB Freibetrag)

**Gesamtkosten für 1000 Maschinen mit Dateien:**
```
Railway (Backend + DB):     15-20€/Monat
Cloudflare R2 (100 GB):     $1.35/Monat (≈1.30€)
Vercel (Frontend):          Kostenlos
────────────────────────────────────
Gesamt:                     ~16-21€/Monat
```

**Bei 5000 Maschinen (500 GB):**
```
Railway (Backend + DB):     20€/Monat
Cloudflare R2 (500 GB):     $7.35/Monat (≈7€)
Vercel (Frontend):          Kostenlos
────────────────────────────────────
Gesamt:                     ~27€/Monat
```

#### Setup-Schritte:

**1. Cloudflare R2 einrichten:**

```bash
# 1. Cloudflare Account erstellen: https://dash.cloudflare.com
# 2. R2 aktivieren (Navigation → R2)
# 3. Bucket erstellen: "tankmanager-files"
# 4. API Token erstellen mit R2 Rechten
# 5. Notieren:
#    - Account ID
#    - Access Key ID
#    - Secret Access Key
#    - Bucket Name
```

**2. Railway Backend deployen:**

#### Vorteile:
- ✅ Einfaches Setup (< 30 Minuten)
- ✅ PostgreSQL inklusive mit automatischen Backups
- ✅ SSL/TLS verschlüsselt
- ✅ Umgebungsvariablen einfach konfigurierbar
- ✅ ~15€/Monat für Backend + Datenbank
- ✅ Mobiler Zugriff von überall

#### Setup-Schritte:

1. **Railway Account erstellen:** https://railway.app
2. **Neues Projekt erstellen:**
   - Backend deployen (GitHub-Repository verbinden)
   - PostgreSQL-Datenbank hinzufügen
   - Umgebungsvariablen setzen:
     ```
     DATABASE_URL=<wird automatisch gesetzt>
     PORT=3005
     NODE_ENV=production
     ```

3. **Frontend auf Vercel deployen:**
   - Vercel Account: https://vercel.com
   - GitHub-Repository verbinden
   - Umgebungsvariable setzen:
     ```
     NEXT_PUBLIC_API_BASE_URL=https://ihr-backend.railway.app
     ```

### Option 2: Hetzner Cloud VPS (Für mehr Kontrolle)

#### Vorteile:
- ✅ Deutsche Server (DSGVO-konform)
- ✅ Sehr günstig (~4-10€/Monat)
- ✅ Volle Kontrolle
- ✅ Eigene Backup-Strategie

#### Server-Anforderungen:
- **CPX11:** 2 vCPU, 2 GB RAM, 40 GB SSD - 4,15€/Monat
- **CPX21:** 3 vCPU, 4 GB RAM, 80 GB SSD - 7,50€/Monat (empfohlen)

#### Setup mit Docker:

```bash
# 1. Server erstellen bei Hetzner Cloud
# 2. SSH verbinden und Docker installieren

# 3. docker-compose.yml erstellen
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tankmanager
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: <IHR_SICHERES_PASSWORT>
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: always

  backend:
    build: ./tankmanager-backend
    environment:
      DATABASE_URL: postgresql://postgres:<PASSWORT>@postgres:5432/tankmanager
      PORT: 3005
      NODE_ENV: production
    ports:
      - "3005:3005"
    depends_on:
      - postgres
    restart: always

  frontend:
    build: ./tankmanager-frontend
    environment:
      NEXT_PUBLIC_API_BASE_URL: https://ihr-domain.de/api
    ports:
      - "3000:3000"
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: always

volumes:
  postgres-data:
```

## Backup-Strategie

### 1. Automatisches tägliches Backup

Das erstellte Script `scripts/backup-database.ts` führt folgendes aus:
- Erstellt PostgreSQL Dump
- Speichert lokal im `backups/` Verzeichnis
- Kopiert zu Netzlaufwerk (wenn konfiguriert)
- Löscht Backups älter als 30 Tage

#### Verwendung:

```bash
# Einmaliges Backup
npm run backup

# Tägliches Backup einrichten (Windows Task Scheduler)
# 1. Task Scheduler öffnen
# 2. Neue Aufgabe erstellen
# 3. Trigger: Täglich um 2:00 Uhr
# 4. Aktion: 
#    Programm: cmd.exe
#    Argumente: /c "cd C:\Users\Jun\tankmanager-backend && npm run backup"
```

#### Linux Cron Job (für VPS):

```bash
# Crontab bearbeiten
crontab -e

# Tägliches Backup um 2:00 Uhr
0 2 * * * cd /opt/tankmanager-backend && npm run backup

# Wöchentliches Backup zu Netzlaufwerk um 3:00 Uhr Sonntags
0 3 * * 0 cd /opt/tankmanager-backend && npm run backup
```

### 2. Netzlaufwerk-Backup konfigurieren

Erstelle eine `.env`-Datei im Backend:

```env
# Datenbank-Verbindung (Cloud)
DATABASE_URL="postgresql://user:password@host:5432/tankmanager"

# Backup-Konfiguration
BACKUP_DIR="./backups"
NETWORK_BACKUP_DIR="\\\\SERVERNAME\\Backups\\TankManager"

# Optional: Wenn Cloud-Datenbank verwendet wird
DB_HOST="your-db-host.railway.app"
DB_PORT="5432"
DB_NAME="tankmanager"
DB_USER="postgres"
DB_PASSWORD="<ihr-passwort>"
```

### 3. Backup wiederherstellen

```bash
# Lokal
psql -U postgres -d tankmanager -f backups/tankmanager_backup_2026-01-28.sql

# Remote (Cloud)
psql -h <cloud-host> -U postgres -d tankmanager -f backups/tankmanager_backup_2026-01-28.sql
```

## Migrations-Workflow für Cloud

### 1. Erste Einrichtung (einmalig):

```bash
# Auf dem Cloud-Server oder lokal mit Cloud-DB-Verbindung
cd tankmanager-backend

# DATABASE_URL in .env auf Cloud-Datenbank setzen
export DATABASE_URL="postgresql://user:pass@cloud-host:5432/tankmanager"

# Prisma Client generieren
npx prisma generate

# Migrations ausführen
npx prisma migrate deploy

# Optional: Seed-Daten einfügen
npm run seed
```

### 2. Bei Schema-Änderungen:

```bash
# Lokal entwickeln
npx prisma migrate dev --name beschreibung_der_aenderung

# Auf Cloud deployen
git push origin main

# Nach Deployment: Migration ausführen
npx prisma migrate deploy
```

## Sicherheits-Empfehlungen

### 1. Umgebungsvariablen schützen
- ❌ Niemals `.env` in Git committen
- ✅ `.env` in `.gitignore` eintragen
- ✅ Umgebungsvariablen in Cloud-Platform setzen

### 2. Datenbank-Zugriff
- ✅ Starke Passwörter verwenden (min. 16 Zeichen)
- ✅ Nur verschlüsselte Verbindungen (SSL/TLS)
- ✅ Firewall: Nur notwendige Ports öffnen

### 3. Backup-Verschlüsselung (optional)
```bash
# Backup mit GPG verschlüsseln
gpg --encrypt --recipient ihre@email.de backups/tankmanager_backup_2026-01-28.sql

# Entschlüsseln
gpg --decrypt backups/tankmanager_backup_2026-01-28.sql.gpg > restored.sql
```

## Kosten-Übersicht

### Railway.app
- Backend (2 GB RAM): ~10€/Monat
- PostgreSQL (1 GB): ~5€/Monat
- **Gesamt: ~15€/Monat**
- Frontend auf Vercel: **Kostenlos**

### Hetzner Cloud
- VPS CPX21: 7,50€/Monat
- Backup Space 100 GB: 3,81€/Monat
- **Gesamt: ~11€/Monat**

### Vergleich lokaler Server
- Stromkosten 24/7: ~15-30€/Monat
- Hardware-Wartung: variabel
- Internetzugang: bereits vorhanden
- ⚠️ Keine Redundanz, Single Point of Failure

## Support & Monitoring

### Health-Check Endpoint
```typescript
// src/app.controller.ts
@Get('health')
health() {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected' // kann erweitert werden
  };
}
```

### Monitoring-Dienste (optional)
- **UptimeRobot:** Kostenlose Verfügbarkeits-Überwachung
- **Sentry:** Error-Tracking
- **LogRocket:** User-Session-Recording

## Nächste Schritte

1. ☐ Cloud-Platform auswählen (Railway empfohlen für Start)
2. ☐ Backend auf Cloud deployen
3. ☐ Frontend auf Vercel deployen
4. ☐ Backup-Script lokal testen: `npm run backup`
5. ☐ Windows Task Scheduler für tägliches Backup einrichten
6. ☐ Netzlaufwerk-Pfad in `.env` konfigurieren
7. ☐ Mobile App / Browser testen mit Cloud-URL
8. ☐ Dokumentation für Team erstellen

## Fragen?

Bei Problemen oder Fragen zum Deployment:
- Railway Dokumentation: https://docs.railway.app
- Hetzner Tutorials: https://community.hetzner.com
- PostgreSQL Backup Guide: https://www.postgresql.org/docs/current/backup.html
