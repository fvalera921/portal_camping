-- CreateTable
CREATE TABLE "Frigorifico" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Reserva" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "parcelaId" INTEGER NOT NULL,
    "fechaEntrada" DATETIME NOT NULL,
    "fechaSalida" DATETIME NOT NULL,
    "temporada" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteDocumento" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "matricula" TEXT,
    "frigorificoId" INTEGER,
    "frigorificoFechaEntrada" DATETIME,
    "frigorificoFechaSalida" DATETIME,
    "totalCentimos" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reserva_parcelaId_fkey" FOREIGN KEY ("parcelaId") REFERENCES "Parcela" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Reserva_frigorificoId_fkey" FOREIGN KEY ("frigorificoId") REFERENCES "Frigorifico" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Reserva" ("clienteDocumento", "clienteEmail", "clienteNombre", "clienteTelefono", "createdAt", "estado", "fechaEntrada", "fechaSalida", "id", "matricula", "parcelaId", "temporada", "totalCentimos", "updatedAt") SELECT "clienteDocumento", "clienteEmail", "clienteNombre", "clienteTelefono", "createdAt", "estado", "fechaEntrada", "fechaSalida", "id", "matricula", "parcelaId", "temporada", "totalCentimos", "updatedAt" FROM "Reserva";
DROP TABLE "Reserva";
ALTER TABLE "new_Reserva" RENAME TO "Reserva";
CREATE INDEX "Reserva_parcelaId_fechaEntrada_fechaSalida_idx" ON "Reserva"("parcelaId", "fechaEntrada", "fechaSalida");
CREATE INDEX "Reserva_estado_fechaEntrada_fechaSalida_idx" ON "Reserva"("estado", "fechaEntrada", "fechaSalida");
CREATE INDEX "Reserva_frigorificoId_frigorificoFechaEntrada_frigorificoFechaSalida_idx" ON "Reserva"("frigorificoId", "frigorificoFechaEntrada", "frigorificoFechaSalida");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Frigorifico_numero_key" ON "Frigorifico"("numero");
