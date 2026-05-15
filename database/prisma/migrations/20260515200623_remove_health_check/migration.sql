/*
  Warnings:

  - You are about to drop the column `contributors` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `HealthCheck` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "headline" TEXT,
ADD COLUMN     "quote" TEXT,
ADD COLUMN     "quoteAuthor" TEXT;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "contributors";

-- DropTable
DROP TABLE "HealthCheck";

-- CreateTable
CREATE TABLE "Contributor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "link" TEXT,

    CONSTRAINT "Contributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectContributor" (
    "projectId" INTEGER NOT NULL,
    "contributorId" INTEGER NOT NULL,

    CONSTRAINT "ProjectContributor_pkey" PRIMARY KEY ("projectId","contributorId")
);

-- AddForeignKey
ALTER TABLE "ProjectContributor" ADD CONSTRAINT "ProjectContributor_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectContributor" ADD CONSTRAINT "ProjectContributor_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Contributor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
