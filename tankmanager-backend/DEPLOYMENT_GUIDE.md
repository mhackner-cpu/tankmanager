# TankManager Deployment Guide

## Übersicht
Dieser Guide führt Sie durch die Veröffentlichung der TankManager-Anwendung in die Cloud.

## Benötigte Services

### 1. Railway.app (Backend + Datenbank)
**Kosten:** ~$7-10/Monat
- Backend (Node.js/NestJS)
- PostgreSQL Datenbank

**Registrierung:**
1. Gehen Sie zu https://railway.app
2. Anmelden mit GitHub
3. Neues Projekt erstellen

### 2. Vercel (Frontend)
**Kosten:** Kostenlos
- Next.js Frontend Hosting

**Registrierung:**
1. Gehen Sie zu https://vercel.com
2. Anmelden mit GitHub
3. Bereit für Deployment

### 3. Cloudflare R2 (File Storage)
**Kosten:** ~$1-2/Monat (abhängig von Nutzung)
- Datei-Speicher (Bilder, PDFs, etc.)

**Registrierung:**
1. Gehen Sie zu https://cloudflare.com
2. Account erstellen
3. R2 aktivieren

## Deployment-Schritte

### Phase 1: Backend auf Railway deployen

#### 1.1 Railway Projekt erstellen
```bash
# In VS Code Terminal im tankmanager-backend Ordner
npm install -g @railway/cli
railway login
railway init
```

#### 1.2 PostgreSQL Datenbank hinzufügen
1. Railway Dashboard öffnen
2. "New" → "Database" → "PostgreSQL"
3. Warten bis Datenbank bereit ist

#### 1.3 Environment Variables setzen
Im Railway Dashboard unter "Variables":
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<zufälliger-sehr-langer-string>
FRONTEND_URL=https://ihre-domain.vercel.app

# Cloudflare R2 (später)
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=<wird später gesetzt>
R2_ACCESS_KEY_ID=<wird später gesetzt>
R2_SECRET_ACCESS_KEY=<wird später gesetzt>
R2_BUCKET_NAME=tankmanager-files
R2_PUBLIC_URL=https://<ihre-domain>.r2.cloudflarestorage.com
```

#### 1.4 Datenbank-Migration durchführen
```bash
railway run npx prisma migrate deploy
railway run npx prisma db seed
```

#### 1.5 Backend deployen
```bash
railway up
```

### Phase 2: Frontend auf Vercel deployen

#### 2.1 Vercel Projekt erstellen
1. GitHub Repository verbinden
2. Framework: "Next.js" (wird automatisch erkannt)
3. Root Directory: "tankmanager-frontend"

#### 2.2 Environment Variables setzen
Im Vercel Dashboard unter "Settings" → "Environment Variables":
```
NEXT_PUBLIC_API_BASE_URL=https://<ihr-railway-backend>.up.railway.app
```

#### 2.3 Deployment starten
- Vercel deployt automatisch bei jedem Git Push
- Oder manuell: "Deployments" → "Redeploy"

### Phase 3: Cloudflare R2 einrichten

#### 3.1 R2 Bucket erstellen
1. Cloudflare Dashboard → R2
2. "Create bucket" → Name: "tankmanager-files"
3. Region: Automatisch gewählt

#### 3.2 API Token erstellen
1. R2 → "Manage R2 API Tokens"
2. "Create API Token"
3. Permissions: "Object Read & Write"
4. Notieren Sie:
   - Account ID
   - Access Key ID
   - Secret Access Key

#### 3.3 Public Domain einrichten (Optional)
1. R2 Bucket → "Settings" → "Public Access"
2. "Connect Domain" oder Custom Domain nutzen

#### 3.4 Railway Backend aktualisieren
Environment Variables in Railway hinzufügen:
```
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID=<ihre-account-id>
R2_ACCESS_KEY_ID=<ihr-access-key>
R2_SECRET_ACCESS_KEY=<ihr-secret-key>
R2_BUCKET_NAME=tankmanager-files
R2_PUBLIC_URL=<ihre-r2-public-url>
```

### Phase 4: CORS konfigurieren

Das Backend muss CORS für Ihre Frontend-Domain erlauben.

Railway Environment Variable:
```
FRONTEND_URL=https://ihre-domain.vercel.app
```

## Post-Deployment

### Admin-User erstellen
1. Railway Terminal öffnen
2. Seed-Script ausführen oder manuell User in DB anlegen

### Testen
1. Frontend URL aufrufen
2. Registrieren / Login testen
3. Maschine anlegen
4. Datei hochladen
5. QR-Code scannen

### Domain verbinden (Optional)

#### Custom Domain für Frontend (Vercel)
1. Vercel Dashboard → "Settings" → "Domains"
2. Domain hinzufügen (z.B. tankmanager.ihr-unternehmen.de)
3. DNS-Einträge bei Ihrem Domain-Anbieter setzen

#### Custom Domain für Backend (Railway)
1. Railway Dashboard → "Settings" → "Domains"
2. Domain hinzufügen (z.B. api.ihr-unternehmen.de)
3. DNS-Einträge bei Ihrem Domain-Anbieter setzen

## Kosten-Übersicht

| Service | Kosten/Monat | Notiz |
|---------|-------------|-------|
| Railway (Backend + DB) | $7-10 | Abhängig von Nutzung |
| Vercel (Frontend) | $0 | Kostenlos für kleine Teams |
| Cloudflare R2 | $1-2 | $0.015/GB Storage |
| **Total** | **~$10/Monat** | |

## Support & Monitoring

### Logs ansehen
- **Railway:** Dashboard → "Deployments" → "View Logs"
- **Vercel:** Dashboard → "Deployments" → "Logs"

### Datenbank-Backup
Railway bietet automatische Backups. Zusätzlich:
```bash
railway run npx prisma db pull
```

## Troubleshooting

### Backend startet nicht
- Environment Variables prüfen
- Logs in Railway ansehen
- DATABASE_URL korrekt?

### Frontend kann Backend nicht erreichen
- CORS in Backend prüfen
- NEXT_PUBLIC_API_BASE_URL korrekt?
- HTTPS verwenden!

### File Upload funktioniert nicht
- R2 Credentials prüfen
- Bucket Name korrekt?
- CORS in R2 Bucket konfiguriert?

## Nächste Schritte nach Deployment

1. ✅ Multi-Tenancy testen
2. ✅ Benutzer einladen
3. ✅ Backup-Strategie einrichten
4. ✅ Monitoring aufsetzen (optional: Sentry)
5. ✅ SSL/HTTPS prüfen (automatisch durch Vercel/Railway)

## Wichtige URLs

- Frontend: https://ihre-domain.vercel.app
- Backend: https://ihre-app.up.railway.app
- Railway Dashboard: https://railway.app/dashboard
- Vercel Dashboard: https://vercel.com/dashboard
- Cloudflare Dashboard: https://dash.cloudflare.com
