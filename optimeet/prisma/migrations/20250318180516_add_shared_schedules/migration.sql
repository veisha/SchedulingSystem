-- CreateTable
CREATE TABLE "SharedSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schedules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SharedSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharedSchedule" ADD CONSTRAINT "SharedSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
