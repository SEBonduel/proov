-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('NEW', 'SHORTLISTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'NEW';

