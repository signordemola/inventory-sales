-- CreateEnum
CREATE TYPE "StaffInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateTable
CREATE TABLE "staff_invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CASHIER',
    "token" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "status" "StaffInviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_invite_token_key" ON "staff_invite"("token");

-- CreateIndex
CREATE INDEX "staff_invite_businessId_idx" ON "staff_invite"("businessId");

-- CreateIndex
CREATE INDEX "staff_invite_token_idx" ON "staff_invite"("token");

-- CreateIndex
CREATE INDEX "staff_invite_email_idx" ON "staff_invite"("email");

-- AddForeignKey
ALTER TABLE "staff_invite" ADD CONSTRAINT "staff_invite_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
