-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionSource" AS ENUM ('TRIAL', 'PAYMENT', 'ADMIN_ADJUSTMENT', 'LEGACY_GRACE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_subscriptions" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'EXPIRED',
    "current_period_start" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_trial_grants" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "store_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_trial_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_periods" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "payment_id" INTEGER,
    "source" "SubscriptionSource" NOT NULL,
    "days" INTEGER NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "payment_code" TEXT NOT NULL,
    "transfer_content" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SEPAY',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "provider_txn_id" TEXT,
    "provider_payload" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_logs" (
    "id" SERIAL NOT NULL,
    "store_id" INTEGER,
    "provider" TEXT NOT NULL DEFAULT 'SEPAY',
    "provider_txn_id" TEXT,
    "payment_code" TEXT,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_days_key" ON "subscription_plans"("days");

-- CreateIndex
CREATE UNIQUE INDEX "store_subscriptions_store_id_key" ON "store_subscriptions"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_trial_grants_user_id_key" ON "user_trial_grants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_trial_grants_store_id_key" ON "user_trial_grants"("store_id");

-- CreateIndex
CREATE INDEX "subscription_periods_store_id_starts_at_idx" ON "subscription_periods"("store_id", "starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_payment_code_key" ON "payments"("payment_code");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_txn_id_key" ON "payments"("provider_txn_id");

-- CreateIndex
CREATE INDEX "payments_store_id_created_at_idx" ON "payments"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "payments_status_created_at_idx" ON "payments"("status", "created_at");

-- CreateIndex
CREATE INDEX "payment_webhook_logs_provider_txn_id_idx" ON "payment_webhook_logs"("provider_txn_id");

-- CreateIndex
CREATE INDEX "payment_webhook_logs_payment_code_idx" ON "payment_webhook_logs"("payment_code");

-- AddForeignKey
ALTER TABLE "store_subscriptions" ADD CONSTRAINT "store_subscriptions_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_trial_grants" ADD CONSTRAINT "user_trial_grants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_trial_grants" ADD CONSTRAINT "user_trial_grants_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_periods" ADD CONSTRAINT "subscription_periods_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_periods" ADD CONSTRAINT "subscription_periods_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_webhook_logs" ADD CONSTRAINT "payment_webhook_logs_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "subscription_plans" ("code", "name", "days", "price", "updated_at")
VALUES
  ('D30', 'Gói 30 ngày', 30, 2000, CURRENT_TIMESTAMP),
  ('D90', 'Gói 90 ngày', 90, 3000, CURRENT_TIMESTAMP),
  ('D180', 'Gói 180 ngày', 180, 4000, CURRENT_TIMESTAMP),
  ('D360', 'Gói 360 ngày', 360, 5000, CURRENT_TIMESTAMP)
ON CONFLICT ("days") DO UPDATE SET
  "code" = EXCLUDED."code",
  "name" = EXCLUDED."name",
  "price" = EXCLUDED."price",
  "is_active" = true,
  "updated_at" = CURRENT_TIMESTAMP;

WITH first_stores AS (
  SELECT DISTINCT ON ("user_id") "id", "user_id"
  FROM "stores"
  ORDER BY "user_id", "created_at" ASC, "id" ASC
)
INSERT INTO "store_subscriptions" (
  "store_id",
  "status",
  "current_period_start",
  "current_period_end",
  "updated_at"
)
SELECT
  fs."id",
  'ACTIVE',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days',
  CURRENT_TIMESTAMP
FROM first_stores fs
ON CONFLICT ("store_id") DO NOTHING;

WITH first_stores AS (
  SELECT DISTINCT ON ("user_id") "id", "user_id"
  FROM "stores"
  ORDER BY "user_id", "created_at" ASC, "id" ASC
)
INSERT INTO "user_trial_grants" ("user_id", "store_id", "started_at", "ends_at")
SELECT
  fs."user_id",
  fs."id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days'
FROM first_stores fs
ON CONFLICT ("user_id") DO NOTHING;

WITH first_stores AS (
  SELECT DISTINCT ON ("user_id") "id", "user_id"
  FROM "stores"
  ORDER BY "user_id", "created_at" ASC, "id" ASC
)
INSERT INTO "subscription_periods" ("store_id", "source", "days", "starts_at", "ends_at")
SELECT
  fs."id",
  'LEGACY_GRACE',
  7,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP + INTERVAL '7 days'
FROM first_stores fs;

INSERT INTO "store_subscriptions" ("store_id", "status", "updated_at")
SELECT "id", 'EXPIRED', CURRENT_TIMESTAMP
FROM "stores"
ON CONFLICT ("store_id") DO NOTHING;
