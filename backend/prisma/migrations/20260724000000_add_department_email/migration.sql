-- CreateTable
CREATE TABLE "DepartmentEmail" (
    "id" SERIAL NOT NULL,
    "department" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DepartmentEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DepartmentEmail_department_idx" ON "DepartmentEmail"("department");

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentEmail_department_email_key" ON "DepartmentEmail"("department", "email");
