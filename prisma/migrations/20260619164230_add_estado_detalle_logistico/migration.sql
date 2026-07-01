/*
  Warnings:

  - Added the required column `estadoDetalleId` to the `OrdenDetalle` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ordendetalle` ADD COLUMN `estadoDetalleId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `EstadoDetalle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `EstadoDetalle_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrdenDetalle` ADD CONSTRAINT `OrdenDetalle_estadoDetalleId_fkey` FOREIGN KEY (`estadoDetalleId`) REFERENCES `EstadoDetalle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
