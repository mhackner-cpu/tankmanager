# 🚀 TankManager - Production Deployment Guide

## Quick Start (Empfohlener Weg: Vercel + Railway)

### 1. Domain vorbereiten
- Domain registrieren (z.B. Namecheap, GoDaddy, IONOS)
- Subdomains planen:
  - `app.deine-firma.de` → Frontend
  - `api.deine-firma.de` → Backend

---

### 2. Backend auf Railway deployen

#### A) Account erstellen
1. Gehe zu [railway.app](https://railway.app)
2. Sign up mit GitHub
3. Erstelle neues Projekt: "TankManager Backend"

#### B) Postgres hinzufügen
1. "New" → "Database" → "Add PostgreSQL"
2. Railway erstellt automatisch `DATABASE_URL`
3. Notiere die Connection-Details

#### C) Backend-Repo verbinden
1. "New" → "GitHub Repo" → tankmanager-backend auswählen
2. Railway erkennt automatisch NestJS
3. Root Directory: `/` (oder wo package.json liegt)

#### D) Environment Variables setzen
```bash
# In Railway Dashboard → Variables
DATABASE_URL=postgresql://... (automatisch gesetzt)
JWT_SECRET=dein-super-sicherer-32-zeichen-secret-key-hier
FRONTEND_URL=https://app.deine-firma.de
NODE_ENV=production
PORT=3005
```

**JWT_SECRET generieren (sicher):**
```bash
# In PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

#### E) Migrations ausführen
1. Railway → Service → "Settings" → "Build Command"
2. Setze: `npm install && npx prisma generate && npx prisma migrate deploy`
3. Trigger neuen Deploy

#### F) Custom Domain
1. Railway → Service → "Settings" → "Domains"
2. "Custom Domain" → `api.deine-firma.de`
3. Railway zeigt CNAME an
4. Gehe zu deinem Domain-Provider (DNS):
   ```
   Type: CNAME
   Name: api
   Value: <railway-cname>
   TTL: 3600
   ```
5. SSL-Zertifikat wird automatisch erstellt (Let's Encrypt)

#### G) Testen
```bash
# Health-Check
curl https://api.deine-firma.de/health
# Sollte: {"status":"ok"} zurückgeben
```

---

### 3. Frontend auf Vercel deployen

#### A) Account erstellen
1. Gehe zu [vercel.com](https://vercel.com)
2. Sign up mit GitHub
3. "Add New Project"

#### B) Repo importieren
1. "Import Git Repository" → tankmanager-frontend
2. Vercel erkennt automatisch Next.js
3. Root Directory: `/` (oder wo package.json liegt)

#### C) Environment Variables setzen
```bash
# In Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_API_URL=https://api.deine-firma.de
```

#### D) Deploy
1. "Deploy" klicken
2. Warten (ca. 2-3 Minuten)
3. Vercel gibt dir eine URL: `tankmanager-xyz.vercel.app`

#### E) Custom Domain
1. Vercel Dashboard → "Settings" → "Domains"
2. "Add" → `app.deine-firma.de`
3. Vercel zeigt DNS-Konfiguration:
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   TTL: 3600
   ```
4. Gehe zu deinem Domain-Provider und setze CNAME
5. SSL wird automatisch eingerichtet

#### F) QR-Code URL anpassen
1. Öffne `components/MachineLabel.tsx`
2. Ändere Zeile:
   ```typescript
   // Alt:
   const baseUrl = window.location.origin;
   
   // Neu:
   const baseUrl = 'https://app.deine-firma.de';
   ```
3. Commit + Push → Auto-Deploy

#### G) Testen
```bash
# Browser öffnen
https://app.deine-firma.de/auth/login
```

---

### 4. CORS im Backend konfigurieren

Damit Frontend mit Backend kommunizieren kann:

**Datei: `tankmanager-backend/src/main.ts`**
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS für Production
  app.enableCors({
    origin: [
      'https://app.deine-firma.de',  // Production Frontend
      'http://localhost:3000',        // Lokale Entwicklung (optional)
    ],
    credentials: true,
  });
  
  await app.listen(process.env.PORT || 3005);
}
```

Commit + Push → Railway deployed automatisch neu.

---

### 5. DNS-Konfiguration (Zusammenfassung)

**Bei deinem Domain-Provider (z.B. Namecheap):**

```
# Frontend
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 3600

# Backend
Type: CNAME
Name: api
Value: <dein-railway-service>.railway.app
TTL: 3600

# Optional: Redirect www zu app
Type: CNAME
Name: www
Value: app.deine-firma.de
TTL: 3600
```

**Propagation:** DNS-Änderungen dauern 5-60 Minuten.

---

### 6. Seed-Daten & Erste Registrierung

#### Option A: Via Registrierung (Empfohlen)
1. Öffne `https://app.deine-firma.de/auth/register`
2. Registriere dein erstes Unternehmen
3. System erstellt automatisch Admin-User

#### Option B: Via Seed-Script (für Test-Daten)
```bash
# Lokal: .env mit Production DATABASE_URL
npm run seed  # Falls seed-script vorhanden

# Oder in Railway CLI
railway run npm run seed
```

---

## Alternative: Hetzner VPS (Günstigere Option)

### Voraussetzungen
- SSH-Kenntnisse
- Docker-Grundlagen
- Nginx-Konfiguration

### Setup (Kurzversion)

1. **VPS mieten**
   - Hetzner CX22: €5.83/Monat
   - Ubuntu 22.04

2. **Server vorbereiten**
   ```bash
   # SSH verbinden
   ssh root@<server-ip>
   
   # Updates
   apt update && apt upgrade -y
   
   # Docker installieren
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Docker Compose
   apt install docker-compose -y
   ```

3. **Docker Compose Setup**
   - Erstelle `docker-compose.yml` auf Server
   - Frontend, Backend, Postgres als Services
   - Nginx als Reverse Proxy

4. **SSL mit Let's Encrypt**
   ```bash
   apt install certbot python3-certbot-nginx
   certbot --nginx -d app.deine-firma.de -d api.deine-firma.de
   ```

5. **DNS konfigurieren**
   ```
   Type: A Record
   Name: app
   Value: <server-ip>
   
   Type: A Record
   Name: api
   Value: <server-ip>
   ```

**Vorteil:** Günstiger, volle Kontrolle
**Nachteil:** Mehr Wartungsaufwand, kein Auto-Deploy

Detaillierte Anleitung auf Anfrage!

---

## Nach dem Deployment

### Monitoring einrichten

1. **Uptime-Monitoring**
   - [UptimeRobot](https://uptimerobot.com) (Kostenlos)
   - Prüfe: `https://api.deine-firma.de/health`
   - Email-Alert bei Ausfall

2. **Error-Tracking (Optional)**
   - [Sentry](https://sentry.io) für Frontend & Backend
   - Automatische Fehler-Benachrichtigung

3. **Database Backups**
   - Railway: Automatisch (mit Plan)
   - Hetzner: Manuell einrichten (pg_dump cronjob)

### Sicherheit

- [ ] Alle Secrets rotieren (JWT_SECRET, DB-Passwort)
- [ ] Firewall-Regeln prüfen
- [ ] Rate-Limiting aktivieren (gegen DDoS)
- [ ] Regelmäßige Updates (Dependencies)

### Legal

- [ ] Datenschutzerklärung auf Website
- [ ] Impressum
- [ ] AGB für SaaS
- [ ] Cookie-Consent (falls Analytics)

---

## Troubleshooting

### Frontend zeigt "API Connection Error"
- [ ] `NEXT_PUBLIC_API_URL` korrekt gesetzt?
- [ ] Backend erreichbar? `curl https://api.deine-firma.de/health`
- [ ] CORS richtig konfiguriert in `main.ts`?

### Backend wirft Prisma-Fehler
- [ ] Migrations gelaufen? `npx prisma migrate deploy`
- [ ] `DATABASE_URL` korrekt?
- [ ] Prisma Client generiert? `npx prisma generate`

### Domain nicht erreichbar
- [ ] DNS propagiert? (kann 1h dauern) → Check: `nslookup app.deine-firma.de`
- [ ] CNAME richtig gesetzt?
- [ ] SSL-Zertifikat aktiv?

### 502 Bad Gateway
- [ ] Backend läuft? Railway/VPS Service prüfen
- [ ] Port richtig? (3005)
- [ ] Environment Variables gesetzt?

---

## Kosten-Übersicht

### Vercel + Railway
```
Vercel Hobby (Free):
  - 100 GB Bandwidth/Monat
  - Unbegrenzte Builds
  - Automatisches SSL
  Kosten: €0

Railway Starter:
  - $5 Credit/Monat inklusive
  - Postgres inklusive
  - Auto-Scale
  Kosten: ~$5-10/Monat

Domain:
  - Namecheap .de Domain
  Kosten: ~€10/Jahr

TOTAL Jahr 1: ~€70-130
```

### Hetzner VPS
```
Hetzner CX22:
  - 2 vCPU, 4GB RAM, 40GB SSD
  - 20 TB Traffic
  Kosten: €5.83/Monat

Domain: €10/Jahr
Backup-Space: €3.24/Monat (optional)

TOTAL Jahr 1: ~€80
```

---

## Support & Hilfe

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **NestJS Deployment:** https://docs.nestjs.com/faq/deployment

Bei Fragen: Siehe PROJECT_LOG.md für Details zur Architektur!
