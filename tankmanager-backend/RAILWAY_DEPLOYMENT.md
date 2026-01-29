# 🚂 Railway Deployment - Step-by-Step Guide

## ✅ Voraussetzungen

- [x] GitHub Account
- [x] Railway Account (https://railway.app)
- [x] Backend-Code bereit (tankmanager-backend)

---

## 📋 Deployment-Schritte

### 1. GitHub Repository erstellen

```bash
cd C:\Users\Jun\tankmanager-backend

# Git initialisieren (falls noch nicht geschehen)
git init

# Alle Dateien hinzufügen
git add .

# Ersten Commit erstellen
git commit -m "Initial commit: TankManager Backend"

# GitHub Repository erstellen und verbinden
# Gehe zu: https://github.com/new
# Name: tankmanager-backend
# Public oder Private wählen

# Remote hinzufügen (ersetze YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/tankmanager-backend.git

# Code pushen
git branch -M main
git push -u origin main
```

### 2. Railway Projekt erstellen

1. **Gehe zu Railway**: https://railway.app
2. **Login** mit GitHub Account
3. **"New Project"** klicken
4. **"Deploy from GitHub repo"** wählen
5. **tankmanager-backend** Repository auswählen

### 3. PostgreSQL Datenbank hinzufügen

1. Im Railway-Projekt auf **"+ New"** klicken
2. **"Database" → "Add PostgreSQL"** wählen
3. Railway erstellt automatisch die Datenbank
4. `DATABASE_URL` wird automatisch als Environment Variable gesetzt

### 4. Environment Variables konfigurieren

Im Railway-Projekt unter **"Variables"**:

**WICHTIG: Diese MÜSSEN gesetzt werden!**

```bash
# JWT Secret (ÄNDERN! Min. 32 Zeichen)
JWT_SECRET=dein-super-sicheres-jwt-secret-mindestens-32-zeichen-lang-production

# Frontend URL (später Vercel-Domain)
FRONTEND_URL=http://localhost:3000

# Port (Railway setzt das automatisch, aber zur Sicherheit)
PORT=3005

# Storage Provider (für File-Uploads)
STORAGE_PROVIDER=local
UPLOAD_PATH=/app/uploads
```

**DATABASE_URL** wird automatisch gesetzt, wenn du PostgreSQL hinzugefügt hast!

### 5. Deployment starten

1. Railway startet automatisch den Build-Prozess
2. **Build-Schritte** (aus `nixpacks.toml`):
   - `npm ci --include=dev` - Dependencies installieren
   - `npx prisma generate` - Prisma Client generieren
   - `npm run build` - TypeScript kompilieren
3. **Start-Command**:
   - `npx prisma migrate deploy` - Datenbank-Migrationen ausführen
   - `npm run start:prod` - App starten

### 6. Deployment-Logs prüfen

1. Klicke auf den **Backend-Service** in Railway
2. Gehe zu **"Deployments"**
3. Prüfe die Logs auf Fehler:
   - ✅ "Prisma migrations deployed successfully"
   - ✅ "🚀 Backend running on http://0.0.0.0:3005"

### 7. Domain konfigurieren

1. Im Backend-Service auf **"Settings"** klicken
2. **"Generate Domain"** klicken
3. Railway generiert eine URL: `tankmanager-backend-production-xxxx.up.railway.app`
4. **Optional**: Custom Domain hinzufügen (später)

### 8. API testen

```bash
# Health-Check (ersetze RAILWAY_URL)
curl https://tankmanager-backend-production-xxxx.up.railway.app/health

# Sollte zurückgeben:
# {"status":"ok","database":"connected"}
```

---

## 🔧 Troubleshooting

### Problem: Build schlägt fehl

**Fehler:** `Script start.sh not found`
- ✅ **Lösung**: Stelle sicher, dass `railway.json` und `nixpacks.toml` vorhanden sind
- ✅ Pushe die Dateien zu GitHub: `git add . && git commit -m "Add Railway config" && git push`

**Fehler:** `Prisma generate failed`
- ✅ **Lösung**: Prüfe ob `prisma/schema.prisma` committed wurde
- ✅ Stelle sicher, dass `@prisma/client` in `dependencies` steht (nicht devDependencies)

**Fehler:** `Cannot find module 'dist/main'`
- ✅ **Lösung**: Build-Command fehlt in `nixpacks.toml`
- ✅ Stelle sicher, dass `npm run build` erfolgreich läuft

### Problem: Migrations schlagen fehl

**Fehler:** `P1001: Can't reach database server`
- ✅ **Lösung**: PostgreSQL-Service ist nicht verbunden
- ✅ Gehe zu Railway → Project → "Variables" → Prüfe ob `DATABASE_URL` gesetzt ist
- ✅ Wenn nicht: Füge PostgreSQL-Service hinzu

**Fehler:** `Migration XYZ failed`
- ✅ **Lösung**: Lösche die Datenbank und erstelle sie neu:
  - Railway → PostgreSQL → "Data" → "Delete All Data"
  - Redeploy Backend → Migrations laufen von Grund auf neu

### Problem: CORS-Fehler

**Fehler:** `Access-Control-Allow-Origin`
- ✅ **Lösung**: Frontend-URL in Environment Variables setzen:
  ```
  FRONTEND_URL=https://deine-vercel-app.vercel.app
  ```
- ✅ Redeploy Backend

### Problem: App läuft, aber Verbindung schlägt fehl

**Fehler:** `502 Bad Gateway`
- ✅ **Lösung**: Prüfe ob App auf `0.0.0.0` oder `process.env.PORT` hört
- ✅ `main.ts` sollte haben: `await app.listen(parseInt(process.env.PORT || '3005', 10));`

---

## 📊 Nach dem Deployment

### Backend-URL notieren

```bash
# Backend ist erreichbar unter:
https://tankmanager-backend-production-xxxx.up.railway.app

# Diese URL brauchst du für das Frontend:
NEXT_PUBLIC_API_URL=https://tankmanager-backend-production-xxxx.up.railway.app
```

### Frontend deployen (nächster Schritt)

Siehe `QUICK_START.md` für Vercel-Deployment des Frontends.

---

## 💰 Kosten

**Railway Pricing:**
- **Hobby Plan**: $5/Monat
  - $5 Credits inkludiert
  - Usage-based billing darüber hinaus
- **PostgreSQL**: ~$2-5/Monat (je nach Nutzung)
- **Backend**: ~$2-5/Monat (je nach Traffic)

**Gesamt: ~$5-15/Monat** (skaliert automatisch)

**Kostenlos testen:**
- Railway bietet Trial mit $5 Credits
- Reicht für 1-2 Monate Testing

---

## 🔄 Weitere Deployments / Updates

**Bei Code-Änderungen:**
```bash
# Änderungen committen
git add .
git commit -m "feat: neue Features"

# Pushen
git push

# Railway deployed automatisch! (kein manueller Schritt nötig)
```

**Monitoring:**
- Railway Dashboard → "Metrics" → CPU, RAM, Requests
- Logs in Echtzeit unter "Deployments"

---

## ✅ Deployment-Checkliste

- [ ] GitHub Repository erstellt und Code gepusht
- [ ] Railway Projekt erstellt
- [ ] PostgreSQL-Service hinzugefügt
- [ ] Environment Variables gesetzt (JWT_SECRET, FRONTEND_URL)
- [ ] Build erfolgreich (Logs geprüft)
- [ ] Migrations deployed (Logs: "Prisma migrations deployed")
- [ ] App läuft (Logs: "Backend running on...")
- [ ] Domain generiert und notiert
- [ ] Health-Check erfolgreich (`/health` endpoint)
- [ ] Backend-URL für Frontend notiert

---

## 📖 Nächste Schritte

1. ✅ **Backend deployed** (diese Anleitung)
2. ⏭️ **Frontend deployen** (siehe `QUICK_START.md`)
3. ⏭️ **Domain konfigurieren** (optional)
4. ⏭️ **First Login** testen

**Go-Live in 15-30 Minuten!** 🚀
