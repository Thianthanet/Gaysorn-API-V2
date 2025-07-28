-- AddForeignKey
ALTER TABLE "Repair" ADD CONSTRAINT "Repair_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "Customer"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
