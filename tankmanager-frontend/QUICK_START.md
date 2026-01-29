# 🚀 Quick Start Guide - TankManager auf eigener Website veröffentlichen

## Schritt 1: Domain registrieren (15 Minuten)

### Empfohlene Anbieter:
- **IONOS** (Deutschland, DSGVO-konform) - ca. €12/Jahr
- **Namecheap** (International, günstig) - ca. $10/Jahr
- **GoDaddy** (Bekannt, teurer) - ca. €15/Jahr

### Domain-Namen wählen:
- `app.deine-firma.de` → Für die TankManager-App
- `api.deine-firma.de` → Für Backend-API

**Tipp:** Falls du bereits eine Domain hast (z.B. deine-firma.de), brauchst du nur Subdomains einzurichten!

---

## Schritt 2: Railway Account (Backend + Datenbank) - 20 Minuten

### 2.1 Account erstellen
1. Gehe zu https://railway.app
2. "Login with GitHub" (kostenlos)
3. Verifiziere deine Email

### 2.2 Neues Projekt erstellen
1. Dashboard → "New Project"
2. Name: "TankManager Backend"

### 2.3 Postgres-Datenbank hinzufügen
1. "New" → "Database" → "Add PostgreSQL"
2. Railway generiert automatisch:
   - Datenbank-Name
   - Passwort
   - `DATABASE_URL` (wichtig!)
3. Notiere dir die Connection-Details (optional)

### 2.4 Backend-Code deployen
1. "New" → "GitHub Repo"
2. Wähle: `tankmanager-backend`
3. Railway erkennt automatisch Node.js/NestJS

### 2.5 Environment Variables setzen
Im Railway Dashboard → Service "tankmanager-backend" → "Variables":

```bash
DATABASE_URL=postgresql://...  ← Automatisch von Postgres-Service
JWT_SECRET=dein-super-sicherer-secret-hier-32-zeichen-lang
FRONTEND_URL=https://app.deine-firma.de
NODE_ENV=production
PORT=3005
```

**JWT_SECRET generieren:**
```powershell
# In PowerShell ausführen:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```
Kopiere den Output und setze ihn als `JWT_SECRET`.

### 2.6 Build-Command anpassen
Settings → "Build Command":
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

### 2.7 Deploy triggern
- "Deploy" klicken
- Warten bis Status "Success" (ca. 2-3 Minuten)

### 2.8 Custom Domain verbinden
1. Settings → "Networking" → "Public Domain"
2. "Add Custom Domain" → `api.deine-firma.de`
3. Railway zeigt CNAME-Wert an (z.B. `xyz.railway.app`)

**Bei deinem Domain-Provider (z.B. IONOS):**
- DNS-Verwaltung öffnen
- Neuer CNAME-Eintrag:
  ```
  Type: CNAME
  Host: api
  Value: xyz.railway.app  ← Von Railway angezeigt
  TTL: 3600
  ```
- Speichern

**Warten:** DNS-Propagation dauert 5-60 Minuten.

### 2.9 Testen
```bash
# Im Browser oder PowerShell:
curl https://api.deine-firma.de/health

# Sollte anzeigen:
# {"status":"ok"}
```

✅ **Backend ist live!**

---

## Schritt 3: Vercel Account (Frontend) - 15 Minuten

### 3.1 Account erstellen
1. Gehe zu https://vercel.com
2. "Sign Up" → "Continue with GitHub"
3. Autorisiere Vercel für GitHub-Zugriff

### 3.2 Projekt importieren
1. Dashboard → "Add New..." → "Project"
2. "Import Git Repository"
3. Wähle: `tankmanager-frontend`
4. Vercel erkennt automatisch Next.js

### 3.3 Environment Variables setzen
Vor dem Deploy:
```bash
NEXT_PUBLIC_API_URL=https://api.deine-firma.de
```

### 3.4 Deployen
1. "Deploy" klicken
2. Warten (ca. 2-3 Minuten)
3. Vercel gibt dir Preview-URL: `tankmanager-xyz.vercel.app`

### 3.5 QR-Code URL anpassen (WICHTIG!)
Bevor du die Custom Domain setzt:

**Lokal in VS Code:**
1. Öffne: `tankmanager-frontend/components/MachineLabel.tsx`
2. Suche nach Zeile mit `window.location.origin`
3. Ändere zu:
   ```typescript
   const baseUrl = 'https://app.deine-firma.de';
   ```
4. Commit + Push zu GitHub
5. Vercel deployed automatisch neu

### 3.6 Custom Domain verbinden
1. Vercel Dashboard → Projekt öffnen
2. "Settings" → "Domains"
3. "Add" → `app.deine-firma.de` eingeben
4. Vercel zeigt CNAME an: `cname.vercel-dns.com`

**Bei deinem Domain-Provider:**
```
Type: CNAME
Host: app
Value: cname.vercel-dns.com
TTL: 3600
```

**Warten:** DNS-Propagation dauert 5-60 Minuten.

### 3.7 SSL-Zertifikat
Vercel richtet automatisch Let's Encrypt SSL ein (HTTPS).
Status prüfen: Vercel Dashboard → Domains → "SSL"

### 3.8 Testen
Browser öffnen: `https://app.deine-firma.de`

✅ **Frontend ist live!**

---

## Schritt 4: CORS aktivieren (5 Minuten)

Damit Frontend mit Backend sprechen kann:

**Lokal in VS Code:**
1. Öffne: `tankmanager-backend/src/main.ts`
2. Suche nach `app.enableCors()`
3. Ändere zu:
   ```typescript
   app.enableCors({
     origin: [
       'https://app.deine-firma.de',  // Production
       'http://localhost:3000',        // Dev (optional)
     ],
     credentials: true,
   });
   ```
4. Commit + Push zu GitHub
5. Railway deployed automatisch neu

---

## Schritt 5: Erste Registrierung testen (5 Minuten)

1. Öffne: `https://app.deine-firma.de/auth/register`
2. Registriere dein Unternehmen:
   - Firmenname
   - Dein Name
   - Email
   - Passwort
3. Klicke "Registrieren"
4. Du wirst automatisch eingeloggt
5. Teste: Maschine anlegen, QR-Code drucken

✅ **App ist produktiv!**

---

## Schritt 6: Landing-Page auf Website (30 Minuten)

### Option A: Separate Seite
1. Nutze `LANDING_PAGE_TEMPLATE.html` aus dem Projekt
2. Passe Texte und Links an
3. Lade auf deine Website hoch: `www.deine-firma.de/tankmanager`

### Option B: Integration in bestehende Website
Füge auf deiner Startseite einen Bereich hinzu:

```html
<section class="tankmanager-promo">
    <h2>🚜 TankManager - Fuhrpark-Verwaltung</h2>
    <p>Verwalten Sie Maschinen, Tankungen und Wartungen zentral.</p>
    <a href="https://app.deine-firma.de/auth/register">
        Kostenlos testen
    </a>
    <a href="/tankmanager">Mehr erfahren</a>
</section>
```

### Option C: Button in Navigation
```html
<nav>
    <a href="/">Start</a>
    <a href="/leistungen">Leistungen</a>
    <a href="/kontakt">Kontakt</a>
    <a href="https://app.deine-firma.de">
        <button style="background: #10b981; color: white;">
            🚀 Zur App
        </button>
    </a>
</nav>
```

---

## Kosten-Übersicht

```
Monat 1-3 (Beta, < 10 Unternehmen):
  Domain:        €1/Monat
  Railway:       €5/Monat
  Vercel:        €0 (Free Tier)
  ──────────────────────
  TOTAL:         €6/Monat

Monat 4+ (Launch, 50+ Unternehmen):
  Domain:        €1/Monat
  Railway:       €15/Monat (mehr DB-Last)
  Vercel:        €20/Monat (mehr Traffic)
  ──────────────────────
  TOTAL:         €36/Monat

Break-Even:
  2 zahlende Kunden (BASIC €29) = Kosten gedeckt
  5 zahlende Kunden = €145 Umsatz, €109 Gewinn/Monat
```

---

## Troubleshooting

### Frontend zeigt "API Error"
- [ ] Ist Backend erreichbar? → `curl https://api.deine-firma.de/health`
- [ ] `NEXT_PUBLIC_API_URL` korrekt in Vercel gesetzt?
- [ ] CORS aktiviert in `main.ts`?

### Backend wirft Fehler
- [ ] Migrations gelaufen? → Railway Logs prüfen
- [ ] `DATABASE_URL` korrekt?
- [ ] Environment Variables alle gesetzt?

### Domain nicht erreichbar
- [ ] DNS-Propagation abgeschlossen? → Check: `nslookup app.deine-firma.de`
- [ ] CNAME korrekt gesetzt?
- [ ] 1-2 Stunden warten

### "Prisma Client not generated"
- Railway → Settings → Build Command überprüfen
- Muss enthalten: `npx prisma generate`

---

## Support & Ressourcen

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Detaillierte Anleitung:** Siehe `DEPLOYMENT.md`
- **Projekt-Dokumentation:** Siehe `PROJECT_LOG.md`

---

## Nächste Schritte nach Go-Live

1. **Beta-Tester einladen** (5-10 Unternehmen)
2. **Feedback sammeln** und Bugs fixen
3. **Tankmodul fertigstellen**
4. **Landing-Page optimieren** (SEO, Google Analytics)
5. **Support-Prozess etablieren** (Email, Chat)
6. **Lizenz-System planen** (in 3-6 Monaten)

---

## 🎉 Gratulation!

Deine TankManager SaaS-Plattform ist jetzt live und kann von beliebig vielen Unternehmen genutzt werden!

**Multi-Tenancy funktioniert automatisch:**
- Jedes Unternehmen hat komplett isolierte Daten
- Ein User kann nur Daten seines eigenen Unternehmens sehen
- Keine weitere Konfiguration nötig

**Zukünftig Lizenzen verkaufen:**
- Subscription-System implementieren (siehe `PROJECT_LOG.md`)
- Stripe/PayPal Integration
- Verschiedene Tier-Pläne (FREE, BASIC, PRO, ENTERPRISE)
