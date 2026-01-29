# 🧩 TankManager - Modulare Architektur

## Modul-Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│                    TANKMANAGER PLATFORM                          │
│                     (Multi-Tenant SaaS)                          │
└─────────────────────────────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    ┌────▼────┐         ┌─────▼──────┐       ┌─────▼──────┐
    │  CORE   │         │  MODUL 1   │       │  MODUL 2   │
    │ SYSTEM  │         │ MASCHINEN  │       │  TANKUNGEN │
    └─────────┘         └────────────┘       └────────────┘
         │                     │                     │
    ┌────▼────┐         ┌─────▼──────┐       ┌─────▼──────┐
    │  AUTH   │         │  Betriebe  │       │  Erfassen  │
    │  Users  │         │ Kategorien │       │  Historie  │
    │Companies│         │ Inventar   │       │ Statistik  │
    │ Rollen  │         │  QR-Codes  │       │ Verbrauch  │
    └─────────┘         └────────────┘       └────────────┘

    ┌─────────┐         ┌────────────┐       ┌────────────┐
    │ MODUL 3 │         │  MODUL 4   │       │  MODUL 5   │
    │ WARTUNG │         │  REPORTS   │       │    UVV     │
    └─────────┘         └────────────┘       └────────────┘
         │                     │                     │
    ┌────▼────┐         ┌─────▼──────┐       ┌─────▼──────┐
    │ Wartungs│         │ Dashboard  │       │ Prüfungen  │
    │ -pläne  │         │   KPIs     │       │ Fristen    │
    │Fällig-  │         │  Export    │       │  Berichte  │
    │ keiten  │         │  Analysen  │       │  Historie  │
    └─────────┘         └────────────┘       └────────────┘
```

---

## Modul-Status & Roadmap

### ✅ PRODUKTIONSBEREIT (Jetzt deployen!)

#### Core-System
- [x] **Authentication & JWT** - Login, Register, Token-Management
- [x] **User-Management** - Profil, Passwort, Team-Einladungen
- [x] **Company-Management** - Multi-Tenancy, Daten-Isolation
- [x] **Rollen-System** - 5 Rollen (Admin, Driver, Mechanic, Management, Viewer)
- [x] **Permissions** - Feature-basierte Berechtigungen

#### Modul 1: Maschinen & Geräte
- [x] **Maschinenverwaltung** - Anlegen, Bearbeiten, Löschen, Status
- [x] **Betriebe (Owners)** - Standorte/Abteilungen
- [x] **Kategorien** - Maschinentypen mit dynamischen Feldern
- [x] **Inventarnummern** - Automatische Generierung (PREFIX-MIDDLE-XXX)
- [x] **QR-Code Labels** - Druckbare Aufkleber (3 Größen)
- [x] **Übersicht** - Gruppiert nach Kategorien, Suche, Filter

**API-Endpoints:**
```
GET    /api/machines              Liste aller Maschinen
POST   /api/machines              Neue Maschine anlegen
GET    /api/machines/:id          Details einer Maschine
PATCH  /api/machines/:id          Maschine bearbeiten
DELETE /api/machines/:id          Maschine löschen
PATCH  /api/machines/:id/status   Status ändern

GET    /api/owners                Liste aller Betriebe
POST   /api/owners                Neuer Betrieb
...

GET    /api/categories            Liste aller Kategorien
GET    /api/categories/:id/next-inventory-number
...
```

**Frontend-Routen:**
```
/machines                 Übersicht (Kategorien-Grid)
/machines/manage          Verwaltung (Tabelle)
/machines/new             Neue Maschine
/machines/[id]            Details
/machines/[id]/edit       Bearbeiten
/machines/category/[id]   Kategorie-Detail

/owners                   Betriebe verwalten
/categories               Kategorien verwalten
```

---

### 🚧 IN ENTWICKLUNG (Parallel offline)

#### Modul 2: Tankungen
- [x] **DB-Schema** - FuelEntry Model vorhanden
- [x] **Backend-Modul** - Grundstruktur existiert
- [ ] **Service erweitern** - Validierung, Verbrauchsberechnung
- [ ] **Frontend-UI** - Tankungen erfassen, Historie, Statistiken
- [ ] **Integration** - Button in Maschinen-Detail

**Geplante API-Endpoints:**
```
GET    /api/fuel?machineId=       Tankungen einer Maschine
POST   /api/fuel                  Neue Tankung erfassen
GET    /api/fuel/:id              Tankung-Details
PATCH  /api/fuel/:id              Tankung bearbeiten
DELETE /api/fuel/:id              Tankung löschen
GET    /api/fuel/stats/:machineId Verbrauchsstatistiken
```

**Geplante Frontend-Routen:**
```
/fuel                     Alle Tankungen (Timeline)
/fuel/new                 Neue Tankung
/fuel/[id]                Details/Bearbeiten
/machines/[id]/fuel       Tankungen pro Maschine
```

**Features:**
- Tankung erfassen (Datum, Liter, Zählerstand, Notiz)
- Automatische Verbrauchsberechnung (Liter/Stunde oder Liter/km)
- Historie-Ansicht (Tabelle + Graph)
- Statistiken: Durchschnitt, Trends, Kosten
- Filter: Datum, Kraftstoffart, Maschine
- Export: CSV, PDF

**Deployment:** Sobald fertig → Git Push → Auto-Deploy → Sofort live!

---

### 📋 TODO (Roadmap)

#### Modul 3: Wartung & Service (Monat 2-3)
- [ ] **Wartungspläne** - Intervalle definieren (Stunden/KM/Tage)
- [ ] **Fälligkeiten** - Dashboard mit anstehenden Wartungen
- [ ] **Historie** - Durchgeführte Wartungen dokumentieren
- [ ] **Erinnerungen** - Email/Push-Benachrichtigungen
- [ ] **Checklisten** - Standard-Wartungsschritte

**DB-Schema:** MaintenancePlan bereits vorhanden ✅

**Geplante API-Endpoints:**
```
GET    /api/maintenance/plans              Alle Wartungspläne
POST   /api/maintenance/plans              Neuer Plan
GET    /api/maintenance/due                Fällige Wartungen
POST   /api/maintenance/history            Wartung durchgeführt
GET    /api/maintenance/history/:machineId Historie
```

---

#### Modul 4: Reports & Analytics (Monat 3-4)
- [ ] **Dashboard** - KPIs, Auslastung, Kosten
- [ ] **Verbrauchsreports** - Gesamt, pro Maschine, pro Betrieb
- [ ] **Kostenanalyse** - Kraftstoff, Wartung, Reparaturen
- [ ] **Export** - PDF, CSV, Excel
- [ ] **Visualisierung** - Charts, Graphs, Heatmaps

**Geplante Frontend-Routen:**
```
/reports                  Report-Übersicht
/reports/consumption      Verbrauchsreport
/reports/costs            Kostenanalyse
/reports/machines         Maschinen-Auslastung
```

---

#### Modul 5: UVV-Prüfungen (Monat 4-5)
- [ ] **Prüffristen** - Automatische Berechnung
- [ ] **Prüfberichte** - Formular mit Checkliste
- [ ] **Mängel** - Erfassen, nachverfolgen, beheben
- [ ] **Dokumentation** - PDF-Export für Behörden
- [ ] **Erinnerungen** - Rechtzeitige Benachrichtigungen

**Zusätzliches DB-Schema nötig:**
```prisma
model UVVInspection {
  id            String
  machineId     String
  inspectorName String
  date          DateTime
  result        String  // PASSED, FAILED, CONDITIONAL
  notes         String?
  defects       UVVDefect[]
}

model UVVDefect {
  id            String
  inspectionId  String
  description   String
  severity      String  // CRITICAL, MAJOR, MINOR
  resolved      Boolean
}
```

---

#### Modul 6: Mobile App (Monat 6+)
- [ ] **React Native App** - iOS + Android
- [ ] **QR-Code Scanner** - Maschine scannen → Details
- [ ] **Offline-Mode** - Tankungen auch ohne Internet
- [ ] **Push-Notifications** - Wartungserinnerungen
- [ ] **Kamera** - Fotos für Mängel/Reparaturen

---

#### Modul 7: API & Integrationen (Monat 6+)
- [ ] **REST API** - Für Drittanbieter
- [ ] **Webhooks** - Events bei Tankungen/Wartungen
- [ ] **API-Keys** - Authentifizierung für externe Apps
- [ ] **Rate-Limiting** - Schutz vor Missbrauch
- [ ] **Documentation** - Swagger/OpenAPI

**Integrationen:**
- Buchhaltungssoftware (DATEV, Lexware)
- Tankkarten-Anbieter (DKV, UTA, Shell)
- Telematik-Systeme (GPS-Tracking)
- ERP-Systeme (SAP, Microsoft Dynamics)

---

## Modul-Abhängigkeiten

```
CORE (Pflicht)
  ├── Modul 1: Maschinen ✅
  │     ├── Modul 2: Tankungen (benötigt Maschinen)
  │     ├── Modul 3: Wartung (benötigt Maschinen)
  │     └── Modul 5: UVV (benötigt Maschinen)
  │
  ├── Modul 2: Tankungen
  │     └── Modul 4: Reports (nutzt Tankdaten)
  │
  ├── Modul 3: Wartung
  │     └── Modul 4: Reports (nutzt Wartungsdaten)
  │
  └── Modul 4: Reports (nutzt alle Daten)
```

**Regel:** Module können unabhängig deployed werden, solange Abhängigkeiten erfüllt sind.

---

## Lizenz-Tiers & Module

### FREE (€0/Monat)
```
✅ Core (Auth, Users, Rollen)
✅ Modul 1: Maschinen & Geräte (max 20)
❌ Modul 2: Tankungen
❌ Modul 3: Wartung
❌ Modul 4: Reports
❌ Modul 5: UVV
❌ Modul 6: Mobile App
❌ Modul 7: API
```

### BASIC (€29/Monat)
```
✅ Alle FREE Features
✅ Maschinen & Geräte (max 100)
✅ Modul 2: Tankungen
✅ Modul 4: Basis-Reports
❌ Modul 3: Wartung
❌ Modul 5: UVV
❌ Modul 6: Mobile App
❌ Modul 7: API
```

### PROFESSIONAL (€79/Monat)
```
✅ Alle BASIC Features
✅ Maschinen & Geräte (max 500)
✅ Modul 3: Wartungsplanung
✅ Modul 4: Erweiterte Reports
✅ Modul 5: UVV-Prüfungen
✅ Modul 6: Mobile App
❌ Modul 7: API
```

### ENTERPRISE (€199+/Monat)
```
✅ Alle PROFESSIONAL Features
✅ Maschinen & Geräte (unbegrenzt)
✅ Modul 7: API & Integrationen
✅ White-Label (eigenes Branding)
✅ Custom-Module nach Wunsch
✅ Dedicated Support
✅ SLA 99.9% Uptime
```

---

## Deployment-Workflow

### Scenario 1: Neues Modul entwickeln (Tankungen)

```bash
# 1. Lokale Entwicklung (ohne Production zu beeinflussen)
cd tankmanager-backend/src/modules/fuel
# Code schreiben, testen...

cd tankmanager-frontend/app/fuel
# UI erstellen, testen...

# 2. Lokal testen mit Dev-DB
npm run dev  # Frontend Port 3000
npm run start:dev  # Backend Port 3005

# 3. Alles funktioniert? Committen
git add .
git commit -m "feat: add fuel tracking module"
git push origin main

# 4. Automatisches Deployment (Vercel + Railway)
# - Railway: Migrations laufen automatisch
# - Vercel: Build + Deploy Frontend
# - Downtime: 0 Sekunden
# - Zeit: 2-3 Minuten

# 5. Neue Features sind SOFORT live!
# - /fuel Routen funktionieren
# - /api/fuel Endpoints aktiv
# - Alte Features unberührt
```

### Scenario 2: Bug-Fix in Production

```bash
# 1. Bug gefunden in Maschinen-Modul
# 2. Fix lokal entwickeln & testen
git commit -m "fix: machine status update error"
git push

# 3. Auto-Deploy innerhalb 2-3 Minuten
# 4. Fix ist live, keine Downtime
```

### Scenario 3: Modul temporär deaktivieren

```typescript
// app.module.ts
@Module({
  imports: [
    // FuelModule,  ← Auskommentieren
  ],
})

// Oder: Feature-Flag
@Controller('fuel')
@FeatureFlag('fuel_enabled')  // ← Guard
export class FuelController { ... }
```

---

## Best Practices

### ✅ DO

1. **Kleine, unabhängige Module** - Leichter zu testen und zu warten
2. **Klare API-Grenzen** - Jedes Modul hat eigene Endpoints
3. **DB-Schema vorbereiten** - FuelEntry, MaintenancePlan schon angelegt
4. **Feature-Flags nutzen** - Module schrittweise freischalten
5. **Versionierung** - Git-Tags für Releases (v1.0.0, v1.1.0, etc.)
6. **Rollback-Plan** - Git-Revert bei Problemen

### ❌ DON'T

1. **Zu große Module** - Schwer zu testen, hohes Fehler-Risiko
2. **Zirkuläre Abhängigkeiten** - Modul A braucht B, B braucht A
3. **Direct DB-Access** - Immer über Services gehen
4. **Ungetestete Deployments** - Lokal erst testen!
5. **Breaking Changes** - Alte API-Versionen unterstützen

---

## Monitoring & Rollback

### Deployment-Health-Check

```bash
# Nach jedem Deployment prüfen:

# 1. Backend erreichbar?
curl https://api.deine-firma.de/health
# → {"status":"ok"}

# 2. Frontend lädt?
curl https://app.deine-firma.de
# → HTML mit <title>TankManager</title>

# 3. Login funktioniert?
# → Browser-Test durchführen

# 4. Neues Feature aktiv?
curl https://api.deine-firma.de/fuel
# → 401 Unauthorized (okay, JWT fehlt)
# → 404 Not Found (NICHT okay!)
```

### Rollback bei Problemen

```bash
# Option 1: Git-Revert (empfohlen)
git revert HEAD
git push
# → Deployment innerhalb 2-3 Min zurück auf vorherigen Stand

# Option 2: Vercel/Railway Dashboard
# → "Redeploy" auf vorherige Version klicken

# Option 3: Feature-Flag
# → Modul im Code auskommentieren, pushen
```

---

## Zusammenfassung

**Aktuelle Situation:**
- ✅ Core + Maschinen-Modul FERTIG
- ✅ Kann SOFORT deployed werden
- ✅ 100% produktionsbereit

**Parallel-Entwicklung:**
- 🚧 Tankmodul offline entwickeln
- 🚧 Kein Risiko für Live-System
- 🚧 Deployment mit einem Git-Push

**Modul-Freischaltung:**
- 💰 Feature-Guards implementieren (später)
- 💰 Subscription-Tiers definieren
- 💰 Upgrades im Frontend anbieten

**Timeline:**
- **Woche 1:** Maschinen-Modul deployen ✅
- **Woche 2-4:** Tankmodul entwickeln 🚧
- **Woche 4:** Tankmodul deployen 🚀
- **Monat 2-3:** Weitere Module 📋
- **Monat 4:** Lizenz-System 💰

🎯 **Du hast eine perfekt skalierbare, modulare SaaS-Architektur!**
