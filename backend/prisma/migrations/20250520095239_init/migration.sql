/*
  Warnings:

  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `publicKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `secretKey` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_publicKey_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password",
DROP COLUMN "publicKey",
DROP COLUMN "secretKey";
