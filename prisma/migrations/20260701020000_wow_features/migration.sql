-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "embedding" JSONB,
ADD COLUMN     "interviewKit" JSONB;

-- AlterTable
ALTER TABLE "CandidateSkill" ADD COLUMN     "codeEvidence" JSONB;

