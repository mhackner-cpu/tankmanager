# 🚜 TankManager - Professionelle Fuhrpark-Verwaltung

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-Backend-red)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)

**SaaS-Plattform** zur Verwaltung von Maschinen, Tankungen und Wartungen mit Multi-Tenancy.

## 🎯 Features

- 📋 **Maschinen & Geräte** - Zentrale Verwaltung mit automatischen Inventarnummern
- ⛽ **Tankungen** - Kraftstoffverbrauch dokumentieren und auswerten
- 🔧 **Wartungen** - Intervalle planen und Historie nachvollziehen
- 👥 **Team-Verwaltung** - 5 Rollen (Admin, Driver, Mechanic, Management, Viewer)
- 🏢 **Multi-Tenancy** - Jedes Unternehmen mit komplett isolierten Daten
- 🔐 **Sicheres Auth** - JWT-basiert, Einladungssystem für neue Mitarbeiter
- 📱 **Mobile Ready** - Responsive Design für Smartphone-Nutzung
- 🏷️ **QR-Code Labels** - Druckbare Aufkleber für schnellen Zugriff
- 📊 **Reports & Analytics** - Verbrauchsstatistiken und Auswertungen

## 🏗️ Architektur

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Next.js       │         │   NestJS        │         │   PostgreSQL    │
│   Frontend      │────────▶│   Backend       │────────▶│   Database      │
│   Port 3000     │  REST   │   Port 3005     │  Prisma │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

**Tech-Stack:**
- **Frontend:** Next.js 15 (App Router), TypeScript, TailwindCSS (geplant)
- **Backend:** NestJS, Prisma ORM, JWT Authentication
- **Datenbank:** PostgreSQL
- **Hosting:** Vercel (Frontend) + Railway (Backend + DB)

## 🚀 Quick Start (Development)

### Voraussetzungen
- Node.js 18+ 
- PostgreSQL 14+
- npm oder yarn

### 1. Repository klonen
```bash
git clone <dein-repo>
cd tankmanager-frontend
```

### 2. Backend starten
```bash
cd ../tankmanager-backend
npm install
cp .env.example .env  # Anpassen!

# Datenbank migrieren
npx prisma migrate dev

# Optional: Test-Daten
npm run seed

# Server starten
npm run start:dev  # Port 3005
```

### 3. Frontend starten
```bash
cd ../tankmanager-frontend
npm install

# .env.local erstellen
echo "NEXT_PUBLIC_API_URL=http://localhost:3005" > .env.local

# Dev-Server starten
npm run dev  # Port 3000
```

### 4. App öffnen
Browser: http://localhost:3000

**Erste Registrierung:**
1. Gehe zu `/auth/register`
2. Registriere dein Unternehmen
3. Du wirst automatisch als Admin eingeloggt

## 📦 Production Deployment

### Option 1: Vercel + Railway (Empfohlen)
Schritt-für-Schritt: Siehe **[QUICK_START.md](./QUICK_START.md)**

**Zusammenfassung:**
1. Domain registrieren (app.deine-firma.de)
2. Backend auf Railway deployen (mit Postgres)
3. Frontend auf Vercel deployen
4. DNS-Einträge setzen
5. SSL automatisch via Let's Encrypt

**Kosten:** ~€6-36/Monat (skaliert mit Nutzung)

### Option 2: Hetzner VPS
Siehe **[DEPLOYMENT.md](./DEPLOYMENT.md)** für detaillierte Anleitung.

**Kosten:** ~€10/Monat (fix)

## 📚 Dokumentation

- **[PROJECT_LOG.md](./PROJECT_LOG.md)** - Vollständiges Arbeitsprotokoll, Architektur-Entscheidungen
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Detaillierte Deployment-Anleitungen (Vercel, Railway, VPS)
- **[QUICK_START.md](./QUICK_START.md)** - Schritt-für-Schritt Go-Live Guide
- **[LANDING_PAGE_TEMPLATE.html](./LANDING_PAGE_TEMPLATE.html)** - Marketing-Seite für Website

## 🔐 Multi-Tenancy & Lizenzen

### Aktueller Stand
- ✅ **Multi-Tenancy voll implementiert**
- ✅ Jedes Unternehmen hat eigene Company-ID
- ✅ Backend filtert automatisch nach companyId (aus JWT)
- ✅ Daten-Isolation garantiert
- ✅ Öffentliche Registrierung möglich

### Roadmap: Lizenz-System
**Phase 1 (aktuell):** Kostenlose Beta für alle

**Phase 2 (3-6 Monate):** Freemium-Modell
- FREE: 5 User, 20 Maschinen
- BASIC: €29/Monat
- PROFESSIONAL: €79/Monat
- ENTERPRISE: Custom

**Phase 3 (6-12 Monate):** Vollständiges SaaS
- Stripe/PayPal Integration
- Self-Service Upgrades
- White-Label Option (Enterprise)

Details: Siehe [PROJECT_LOG.md - Lizenz-Strategie](./PROJECT_LOG.md#-production-deployment--lizenz-strategie-29012026)

## 🗂️ Projekt-Struktur

```
tankmanager-frontend/
├── app/
│   ├── layout.tsx           # Root Layout mit Navigation
│   ├── page.tsx             # Dashboard / Startseite
│   ├── auth/                # Login, Register, Einladungen
│   ├── machines/            # Maschinen-Verwaltung
│   ├── owners/              # Betriebe
│   ├── categories/          # Kategorien
│   ├── profile/             # User-Profil
│   └── admin/               # Admin-Panel (Rollen, Einladungen)
├── components/              # Wiederverwendbare Komponenten
├── lib/
│   ├── api.ts              # API-Client
│   └── auth.ts             # Auth-Helper
└── public/

tankmanager-backend/
├── src/
│   ├── modules/
│   │   ├── auth/           # JWT, Guards, Strategies
│   │   ├── machines/       # Maschinen-Service
│   │   ├── owners/         # Betriebe-Service
│   │   ├── categories/     # Kategorien-Service
│   │   ├── invitations/    # Einladungs-System
│   │   └── users/          # User-Management
│   ├── common/             # Decorators, Guards
│   └── main.ts             # Bootstrap + CORS
└── prisma/
    ├── schema.prisma       # Datenbankmodell
    └── migrations/         # Migrationen
```

## 🔧 Entwicklung

### Available Scripts

**Frontend:**
```bash
npm run dev          # Development Server (Port 3000)
npm run build        # Production Build
npm run start        # Production Server
npm run lint         # ESLint
```

**Backend:**
```bash
npm run start:dev    # Development (Watch Mode, Port 3005)
npm run build        # Production Build
npm run start        # Production Server
npm run test         # Unit Tests
npx prisma studio    # Database GUI
npx prisma migrate dev  # Neue Migration
```

### VS Code Tasks
Nutze integrierte Tasks:
- `frontend dev` - Startet Frontend (Port 3000)
- `backend dev` - Startet Backend (Port 3005)

## 📊 Datenbankmodell

**Wichtigste Entities:**
- **Company** - Mandant (mit Subscription-Feldern für Zukunft)
- **User** - Benutzer (gehört zu einer Company)
- **UserRoleAssignment** - Rollen-Zuordnung (Many-to-Many)
- **Machine** - Maschine/Gerät
- **Owner** - Betrieb/Standort
- **Category** - Kategorie (global über alle Companies)
- **FuelEntry** - Tankung (vorbereitet für Tankmodul)
- **Invitation** - Einladungs-Token

Vollständiges Schema: `tankmanager-backend/prisma/schema.prisma`

## 🐛 Bekannte Probleme

- Keine aktuellen Bugs
- Hydration-Warning behoben (suppressHydrationWarning)

## ✅ Offene Features (Roadmap)

1. **Tankmodul** - FuelEntry erfassen, Verbrauch auswerten
2. **Wartungsmodul** - Wartungspläne definieren, Erinnerungen
3. **Reports & Analytics** - Dashboards, KPIs, Export
4. **Lizenz-System** - Subscription-Tiers, Billing
5. **Mobile App** - Native iOS/Android (optional)
6. **API für Integrationen** - REST API für Drittanbieter
7. **White-Label** - Branding anpassen (Enterprise)

## 🤝 Contributing

Dieses Projekt ist aktuell **privat** und nicht für externe Contributions geöffnet.

## 📄 Lizenz

Copyright © 2026 Deine Firma GmbH. Alle Rechte vorbehalten.

## 📞 Support

- **Technische Fragen:** Siehe PROJECT_LOG.md
- **Deployment-Hilfe:** Siehe DEPLOYMENT.md oder QUICK_START.md
- **Business-Anfragen:** sales@deine-firma.de

---

**Gebaut mit ❤️ für professionelle Fuhrpark-Verwaltung**
