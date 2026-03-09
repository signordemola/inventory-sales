-- CreateTable
CREATE TABLE "expense" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "branchId" TEXT,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "receiptUrl" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_businessId_idx" ON "expense"("businessId");

-- CreateIndex
CREATE INDEX "expense_recordedById_idx" ON "expense"("recordedById");

-- CreateIndex
CREATE INDEX "expense_date_idx" ON "expense"("date");

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
