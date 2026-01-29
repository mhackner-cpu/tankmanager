# 🔧 Railway Deployment - Troubleshooting Guide

## Häufige Fehler und Lösungen

### ❌ Fehler: "Cannot find module 'dist/main'"

**Symptome:**
```
Error: Cannot find module '/app/dist/main'
```

**Ursachen:**
1. Build-Command wurde nicht ausgeführt
2. TypeScript wurde nicht kompiliert
3. `dist/` Ordner fehlt

**Lösungen:**

**Option 1: Prüfe Build-Logs**
- Railway Dashboard → Deployments → Build-Logs durchsehen
- Suche nach: "nest build" oder "tsc"
- Falls nicht vorhanden: Build-Command fehlt

**Option 2: railway.toml verwenden**
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npx prisma generate && npm run build"

[deploy]
startCommand = "node dist/main"
```

**Option 3: Prüfe package.json**
```json
{
  "scripts": {
    "build": "nest build",
    "start:prod": "node dist/main"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

### ❌ Fehler: "Prisma Client not generated"

**Symptome:**
```
Error: @prisma/client did not initialize yet
Cannot find module '.prisma/client'
```

**Ursache:**
Prisma Client wurde vor dem Build nicht generiert

**Lösung:**

**1. Build-Command anpassen:**
```bash
npm install && npx prisma generate && npm run build
```

**2. In nixpacks.toml:**
```toml
[phases.install]
cmds = [
  "npm ci",
  "npx prisma generate"
]
```

**3. Postinstall-Script (optional):**
```json
{
  "scripts": {
    "postinstall": "npx prisma generate"
  }
}
```

---

### ❌ Fehler: "P1001: Can't reach database server"

**Symptome:**
```
Error: P1001: Can't reach database server at `postgres://...`
```

**Ursachen:**
1. PostgreSQL-Service nicht verbunden
2. `DATABASE_URL` Environment Variable fehlt
3. Falsche Connection String

**Lösungen:**

**1. PostgreSQL hinzufügen:**
- Railway Dashboard → "+ New" → "Database" → "PostgreSQL"
- Railway verbindet automatisch die Services

**2. DATABASE_URL prüfen:**
- Variables Tab → Suche "DATABASE_URL"
- Sollte automatisch gesetzt sein durch PostgreSQL-Plugin
- Format: `postgresql://user:pass@host:5432/database`

**3. Service-Verbindung prüfen:**
- Backend-Service → Settings → "Service Variables"
- `DATABASE_URL` sollte "${{Postgres.DATABASE_URL}}" sein

**4. Manually setzen (falls nötig):**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

---

### ❌ Fehler: "Migrations failed"

**Symptome:**
```
Error: P3009: migrate found failed migrations
Migration `20260126123009_init` failed
```

**Ursachen:**
1. Alte/korrupte Migrations in Datenbank
2. Migration-Konflikte
3. Schema-Inkonsistenzen

**Lösungen:**

**Option 1: Datenbank zurücksetzen (Development)**
- PostgreSQL-Service → Data Tab
- "Delete All Data" klicken
- Redeploy Backend → Migrations laufen neu

**Option 2: Migrations reparieren**
```bash
# Lokal ausführen (mit Railway-DB-URL):
DATABASE_URL="<railway-url>" npx prisma migrate resolve --applied "<migration-name>"
```

**Option 3: Shadow-Database aktivieren**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
}
```

---

### ❌ Fehler: "CORS Policy Error"

**Symptome:**
```
Access to fetch at 'https://backend.railway.app' from origin 'https://frontend.vercel.app' 
has been blocked by CORS policy
```

**Ursache:**
Frontend-URL nicht in CORS-Origin erlaubt

**Lösung:**

**1. Environment Variable setzen:**
```bash
FRONTEND_URL=https://your-frontend.vercel.app
```

**2. main.ts prüfen:**
```typescript
app.enableCors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000', // für Development
  ],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

**3. Wildcard (nur für Testing!):**
```typescript
app.enableCors({
  origin: '*', // ⚠️ NICHT für Production!
});
```

---

### ❌ Fehler: "502 Bad Gateway"

**Symptome:**
- App deployed erfolgreich
- Aber: 502 Error beim Zugriff

**Ursachen:**
1. App hört nicht auf richtigen Port
2. App crashed nach Start
3. Health-Check schlägt fehl

**Lösungen:**

**1. Port-Binding prüfen (main.ts):**
```typescript
const port = parseInt(process.env.PORT || '3005', 10);
await app.listen(port, '0.0.0.0'); // ← wichtig: '0.0.0.0'
```

**2. Deployment-Logs prüfen:**
- Suche nach: "Backend running on..."
- Falls App crashed: Stack-Trace ansehen

**3. Health-Check Endpoint testen:**
```bash
curl https://your-backend.railway.app/health
```

---

### ❌ Fehler: "Out of Memory"

**Symptome:**
```
ERROR: JavaScript heap out of memory
FATAL ERROR: Reached heap limit
```

**Ursachen:**
1. Zu viele Dependencies
2. Memory Leak
3. Railway-Plan zu klein

**Lösungen:**

**1. Node Memory erhöhen (temporär):**
```json
{
  "scripts": {
    "build": "node --max-old-space-size=4096 node_modules/.bin/nest build"
  }
}
```

**2. Production-Dependencies optimieren:**
```bash
npm ci --omit=dev
```

**3. Railway-Plan upgraden:**
- Hobby Plan: 512MB RAM (default)
- Pro Plan: Mehr RAM verfügbar

---

### ❌ Fehler: "Module not found: @nestjs/core"

**Symptome:**
```
Error: Cannot find module '@nestjs/core'
```

**Ursache:**
Dependencies nicht installiert oder falsche Node-Version

**Lösungen:**

**1. package.json engines prüfen:**
```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

**2. Dependencies vollständig installieren:**
```bash
npm install
```

**3. nixpacks.toml anpassen:**
```toml
[phases.install]
cmds = [
  "npm ci --include=dev",
  "npx prisma generate"
]
```

---

## 🔍 Debug-Strategien

### 1. Build-Logs analysieren

**Railway Dashboard:**
1. Klick auf Backend-Service
2. Deployments Tab
3. Jüngste Deployment anklicken
4. Logs durchsehen

**Wichtige Log-Abschnitte:**
```
✓ Installing dependencies...     ← Hier sollte npm install laufen
✓ Generating Prisma Client...    ← Prisma generate
✓ Building application...        ← nest build / tsc
✓ Starting application...        ← node dist/main
```

### 2. Environment Variables prüfen

**Railway Dashboard:**
1. Backend-Service → Variables Tab
2. Prüfe folgende Variablen:

**MUSS gesetzt sein:**
- `DATABASE_URL` - Von PostgreSQL-Plugin
- `JWT_SECRET` - Manuell setzen (min. 32 Zeichen)

**Optional aber empfohlen:**
- `FRONTEND_URL` - Für CORS
- `PORT` - Automatisch von Railway gesetzt
- `NODE_ENV=production` - Automatisch gesetzt

### 3. Lokalen Build testen

**Vor dem Deployment:**
```bash
cd tankmanager-backend

# Dependencies installieren
npm install

# Prisma Client generieren
npx prisma generate

# TypeScript kompilieren
npm run build

# Prüfe ob dist/ existiert
ls dist/

# Start testen
npm run start:prod
```

**Sollte ausgeben:**
```
🚀 Backend running on http://localhost:3005
```

### 4. Database Connection testen

**Railway PostgreSQL URL kopieren:**
```bash
# Railway → PostgreSQL → Connect → Connection String kopieren
DATABASE_URL="postgresql://user:pass@host/db" npx prisma migrate status
```

**Sollte zeigen:**
```
Database schema is up to date!
```

---

## 📋 Deployment-Checkliste (Debugging)

Wenn Deployment fehlschlägt, arbeite diese Liste ab:

- [ ] **Code auf GitHub gepusht?**
  ```bash
  git status
  git push
  ```

- [ ] **railway.toml vorhanden?**
  ```bash
  ls railway.toml
  ```

- [ ] **package.json engines gesetzt?**
  ```json
  "engines": { "node": ">=20.0.0" }
  ```

- [ ] **Prisma Schema vorhanden?**
  ```bash
  ls prisma/schema.prisma
  ```

- [ ] **PostgreSQL verbunden?**
  - Railway → Backend-Service → Variables → DATABASE_URL exists?

- [ ] **JWT_SECRET gesetzt?**
  - Railway → Variables → JWT_SECRET exists?

- [ ] **Build-Logs prüfen?**
  - Railway → Deployments → Logs durchlesen

- [ ] **Start-Logs prüfen?**
  - Suche nach "Backend running" oder Errors

- [ ] **Health-Check testen?**
  ```bash
  curl https://your-backend.railway.app/health
  ```

---

## 🆘 Wenn gar nichts hilft...

### Option 1: Neu starten

**Kompletter Reset:**
1. Railway → Backend-Service löschen
2. PostgreSQL-Service löschen (⚠️ Daten weg!)
3. Neues Projekt erstellen
4. Von vorne beginnen (siehe RAILWAY_DEPLOYMENT.md)

### Option 2: Alternative Deployment-Methode

**Dockerfile verwenden statt Nixpacks:**
1. Railway → Settings → Builder: "Dockerfile"
2. Verwendet `Dockerfile` im Repo
3. Manchmal stabiler

### Option 3: Lokales Deployment (Temporary Fix)

**ngrok verwenden:**
```bash
# Backend lokal starten
npm run start:dev

# ngrok in anderem Terminal
ngrok http 3005
```

**Frontend mit ngrok-URL verbinden:**
```bash
NEXT_PUBLIC_API_URL=https://xyz.ngrok.io
```

---

## 📞 Support

**Railway Community:**
- Discord: https://discord.gg/railway
- Forum: https://help.railway.app

**TankManager GitHub:**
- Issues: https://github.com/YOUR_USERNAME/tankmanager-backend/issues

**Häufigste Fragen:**
1. Logs vollständig kopieren (von Anfang bis Ende)
2. Environment Variables zeigen (ohne Secrets!)
3. package.json zeigen
4. railway.toml / railway.json zeigen
