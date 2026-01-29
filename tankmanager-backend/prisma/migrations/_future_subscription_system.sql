-- HINWEIS: Dies ist eine ROADMAP für zukünftige Lizenz-Implementierung
-- NICHT JETZT AUSFÜHREN! Erst wenn Subscription-System implementiert wird.

-- Erweitere Company-Tabelle um Subscription-Felder
ALTER TABLE "Company" ADD COLUMN "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "Company" ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "Company" ADD COLUMN "subscriptionStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Company" ADD COLUMN "subscriptionEnd" TIMESTAMP(3);
ALTER TABLE "Company" ADD COLUMN "maxUsers" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Company" ADD COLUMN "maxMachines" INTEGER NOT NULL DEFAULT 20;
ALTER TABLE "Company" ADD COLUMN "features" TEXT[] DEFAULT ARRAY['basic']::TEXT[];
ALTER TABLE "Company" ADD COLUMN "billingEmail" TEXT;
ALTER TABLE "Company" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Company" ADD COLUMN "stripeSubscriptionId" TEXT;

-- Optional: Subscription-Historie für Audit
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "action" TEXT NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'renewed'
    "amount" DECIMAL(10,2),
    "currency" TEXT DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE;

-- Indizes für Performance
CREATE INDEX "SubscriptionHistory_companyId_idx" ON "SubscriptionHistory"("companyId");
CREATE INDEX "Company_subscriptionStatus_idx" ON "Company"("subscriptionStatus");
CREATE INDEX "Company_subscriptionEnd_idx" ON "Company"("subscriptionEnd");

-- Subscription-Tiers Dokumentation:
-- FREE: 5 Users, 20 Maschinen, Basis-Features (machines, owners, categories)
-- BASIC: 20 Users, 100 Maschinen, Standard-Features (+ fuel)
-- PROFESSIONAL: 50 Users, 500 Maschinen, Erweiterte Features (+ maintenance, reports)
-- ENTERPRISE: Unbegrenzt, Alle Features (+ api, white-label, priority-support)

-- Beispiel-Daten (für Tests):
-- UPDATE "Company" SET 
--   "subscriptionTier" = 'BASIC',
--   "subscriptionEnd" = CURRENT_TIMESTAMP + INTERVAL '30 days',
--   "maxUsers" = 20,
--   "maxMachines" = 100,
--   "features" = ARRAY['basic', 'fuel', 'mobile']
-- WHERE "id" = '<test-company-id>';
