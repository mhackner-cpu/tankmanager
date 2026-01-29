# Deployment Checkliste

## Vor dem Deployment

- [ ] Code in Git Repository (GitHub) pushen
- [ ] Alle Tests lokal durchlaufen lassen
- [ ] .env Dateien NICHT committen (stehen in .gitignore)

## Accounts erstellen

- [ ] Railway.app Account (https://railway.app)
  - Mit GitHub anmelden
  - Zahlungsmethode hinterlegen
  
- [ ] Vercel Account (https://vercel.com)
  - Mit GitHub anmelden
  - Kostenlos für Hobby-Projekte
  
- [ ] Cloudflare Account (https://cloudflare.com)
  - Account erstellen
  - R2 aktivieren (ggf. Zahlungsmethode)

## Backend Deployment (Railway)

- [ ] Neues Railway Projekt erstellen
- [ ] PostgreSQL Datenbank hinzufügen
- [ ] GitHub Repository verbinden (tankmanager-backend)
- [ ] Environment Variables setzen:
  - [ ] NODE_ENV=production
  - [ ] DATABASE_URL (automatisch von Railway)
  - [ ] JWT_SECRET (zufällig generieren)
  - [ ] FRONTEND_URL (später Vercel URL eintragen)
  - [ ] STORAGE_PROVIDER=local (erstmal)
  
- [ ] Ersten Deployment durchführen
- [ ] Logs prüfen - Backend sollte starten
- [ ] Database Migration: `railway run npx prisma migrate deploy`
- [ ] Seed-Daten laden: `railway run npm run seed`
- [ ] Backend-URL notieren (z.B. https://xxx.up.railway.app)

## Frontend Deployment (Vercel)

- [ ] Neues Vercel Projekt erstellen
- [ ] GitHub Repository verbinden (tankmanager-frontend)
- [ ] Root Directory: tankmanager-frontend
- [ ] Framework: Next.js (automatisch)
- [ ] Environment Variables setzen:
  - [ ] NEXT_PUBLIC_API_BASE_URL=<Railway Backend URL>
  
- [ ] Deployment starten
- [ ] Frontend-URL notieren (z.B. https://xxx.vercel.app)
- [ ] Zurück zu Railway: FRONTEND_URL aktualisieren

## CORS konfigurieren

- [ ] Railway Backend neu deployen mit korrekter FRONTEND_URL
- [ ] Frontend testen: Login funktioniert?

## File Upload einrichten (Cloudflare R2)

- [ ] Cloudflare R2 Bucket erstellen: "tankmanager-files"
- [ ] API Token erstellen (Read & Write)
- [ ] Credentials notieren:
  - [ ] Account ID
  - [ ] Access Key ID
  - [ ] Secret Access Key
  - [ ] Public URL
  
- [ ] Railway Environment Variables aktualisieren:
  - [ ] STORAGE_PROVIDER=r2
  - [ ] R2_ACCOUNT_ID
  - [ ] R2_ACCESS_KEY_ID
  - [ ] R2_SECRET_ACCESS_KEY
  - [ ] R2_BUCKET_NAME=tankmanager-files
  - [ ] R2_PUBLIC_URL
  
- [ ] Backend neu deployen

## Testen

- [ ] Frontend aufrufen
- [ ] Admin-User einloggen (aus Seed-Daten)
- [ ] Neuen User registrieren
- [ ] Firma erstellen
- [ ] Owner anlegen
- [ ] Kategorie anlegen
- [ ] Maschine anlegen
- [ ] Datei hochladen
- [ ] Datei herunterladen
- [ ] QR-Code generieren
- [ ] QR-Code scannen (mit Handy)

## Optional: Custom Domain

- [ ] Domain kaufen (z.B. bei Namecheap, Cloudflare)
- [ ] Vercel: Custom Domain verbinden
- [ ] Railway: Custom Domain verbinden
- [ ] DNS-Einträge setzen
- [ ] SSL-Zertifikat prüfen (automatisch)

## Monitoring & Backup

- [ ] Railway Logs einrichten
- [ ] Vercel Logs einrichten
- [ ] Backup-Strategie überlegen
- [ ] Regelmäßige Datenbank-Backups (Railway macht automatisch)

## Fertig! 🎉

Ihre TankManager Anwendung ist jetzt live!

- Frontend: ___________________
- Backend: ___________________
- Admin-User: admin@moosmuehle.com / AdminPass123!

## Support

Bei Problemen:
1. Logs in Railway/Vercel ansehen
2. DEPLOYMENT_GUIDE.md lesen
3. Environment Variables prüfen
