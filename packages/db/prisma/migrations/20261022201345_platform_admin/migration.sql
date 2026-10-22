-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('invited', 'trial', 'active', 'suspended');
-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "city" TEXT,
ADD COLUMN     "invited_at" TIMESTAMP(3),
ADD COLUMN     "plan_id" TEXT,
ADD COLUMN     "status" "CompanyStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "status_note" TEXT,
ADD COLUMN     "suspended_at" TIMESTAMP(3),
ADD COLUMN     "trial_ends_at" TIMESTAMP(3);
-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "employee_limit" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "platform_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "platform_name" TEXT NOT NULL DEFAULT 'Salon Manager',
    "support_email" TEXT NOT NULL DEFAULT '',
    "support_phone" TEXT NOT NULL DEFAULT '',
    "trial_days" INTEGER NOT NULL DEFAULT 14,
    "invite_days" INTEGER NOT NULL DEFAULT 7,
    "notify_signup" BOOLEAN NOT NULL DEFAULT true,
    "notify_trial_end" BOOLEAN NOT NULL DEFAULT true,
    "notify_overdue" BOOLEAN NOT NULL DEFAULT true,
    "notify_weekly" BOOLEAN NOT NULL DEFAULT false,
    "modified_date" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "platform_admins" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "encrypted_password" TEXT NOT NULL,
    "tokens_valid_after" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sign_in_at" TIMESTAMP(3),
    "created_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modified_date" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "plans_name_key" ON "plans"("name");
-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins"("email");
-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");
-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
