-- AlterTable
ALTER TABLE `orden` MODIFY `total` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `ordendetalle` MODIFY `precioUnit` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `producto` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `imagenUrl` VARCHAR(511) NULL,
    MODIFY `precio` DECIMAL(10, 2) NOT NULL;

-- CreateIndex
CREATE INDEX `Producto_nombre_idx` ON `Producto`(`nombre`);
