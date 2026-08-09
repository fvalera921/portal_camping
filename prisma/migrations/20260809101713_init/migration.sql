-- CreateTable
CREATE TABLE "Parcela" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "tieneElectricidad" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT
);

-- CreateTable
CREATE TABLE "Reserva" (
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
    "totalCentimos" INTEGER NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'CONFIRMADA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reserva_parcelaId_fkey" FOREIGN KEY ("parcelaId") REFERENCES "Parcela" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LineaConcepto" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservaId" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitarioCentimos" INTEGER NOT NULL,
    "subtotalCentimos" INTEGER NOT NULL,
    CONSTRAINT "LineaConcepto_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tarifa" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "concepto" TEXT NOT NULL,
    "precioBajaCentimos" INTEGER NOT NULL,
    "precioAltaCentimos" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_numero_key" ON "Parcela"("numero");

-- CreateIndex
CREATE INDEX "Reserva_parcelaId_fechaEntrada_fechaSalida_idx" ON "Reserva"("parcelaId", "fechaEntrada", "fechaSalida");

-- CreateIndex
CREATE UNIQUE INDEX "Tarifa_concepto_key" ON "Tarifa"("concepto");
