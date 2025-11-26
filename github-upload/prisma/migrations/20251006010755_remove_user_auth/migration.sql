/*
  Warnings:

  - You are about to drop the column `userId` on the `LearningItem` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `knowledge_base_items` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LearningItem" DROP CONSTRAINT "LearningItem_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."knowledge_base_items" DROP CONSTRAINT "knowledge_base_items_userId_fkey";

-- AlterTable
ALTER TABLE "LearningItem" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "knowledge_base_items" DROP COLUMN "userId";

-- DropTable
DROP TABLE "public"."User";
