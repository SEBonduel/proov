-- CreateEnum
CREATE TYPE "RemotePref" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "availability" TEXT,
ADD COLUMN     "contractPrefs" "ContractType"[],
ADD COLUMN     "maxDistanceKm" INTEGER,
ADD COLUMN     "openToWork" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferredLocation" TEXT,
ADD COLUMN     "remotePref" "RemotePref";

