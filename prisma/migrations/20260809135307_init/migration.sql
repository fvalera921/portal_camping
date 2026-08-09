-- CreateEnum
CREATE TYPE "TipoParcela" AS ENUM ('TIENDA', 'CARAVANA', 'AUTOCARAVANA');

-- CreateEnum
CREATE TYPE "Temporada" AS ENUM ('BAJA', 'ALTA');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('CONFIRMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "Parcela" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,
    "tipo" "TipoParcela" NOT NULL,
    "tieneElectricidad" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,

    CONSTRAINT "Parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Frigorifico" (
    "id" SERIAL NOT NULL,
    "numero" INTEGER NOT NULL,

    CONSTRAINT "Frigorifico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" SERIAL NOT NULL,
    "parcelaId" INTEGER NOT NULL,
    "fechaEntrada" TIMESTAMP(3) NOT NULL,
    "fechaSalida" TIMESTAMP(3) NOT NULL,
    "temporada" "Temporada" NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteDocumento" TEXT NOT NULL,
    "clienteTelefono" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "matricula" TEXT,
    "frigorificoId" INTEGER,
    "frigorificoFechaEntrada" TIMESTAMP(3),
    "frigorificoFechaSalida" TIMESTAMP(3),
    "totalCentimos" INTEGER NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'CONFIRMADA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaConcepto" (
    "id" SERIAL NOT NULL,
    "reservaId" INTEGER NOT NULL,
    "concepto" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitarioCentimos" INTEGER NOT NULL,
    "subtotalCentimos" INTEGER NOT NULL,

    CONSTRAINT "LineaConcepto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarifa" (
    "id" SERIAL NOT NULL,
    "concepto" TEXT NOT NULL,
    "precioBajaCentimos" INTEGER NOT NULL,
    "precioAltaCentimos" INTEGER NOT NULL,

    CONSTRAINT "Tarifa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_numero_key" ON "Parcela"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "Frigorifico_numero_key" ON "Frigorifico"("numero");

-- CreateIndex
CREATE INDEX "Reserva_parcelaId_fechaEntrada_fechaSalida_idx" ON "Reserva"("parcelaId", "fechaEntrada", "fechaSalida");

-- CreateIndex
CREATE INDEX "Reserva_estado_fechaEntrada_fechaSalida_idx" ON "Reserva"("estado", "fechaEntrada", "fechaSalida");

-- CreateIndex
CREATE INDEX "Reserva_frigorificoId_frigorificoFechaEntrada_frigorificoFe_idx" ON "Reserva"("frigorificoId", "frigorificoFechaEntrada", "frigorificoFechaSalida");

-- CreateIndex
CREATE INDEX "Reserva_estado_frigorificoFechaEntrada_frigorificoFechaSali_idx" ON "Reserva"("estado", "frigorificoFechaEntrada", "frigorificoFechaSalida");

-- CreateIndex
CREATE INDEX "LineaConcepto_reservaId_idx" ON "LineaConcepto"("reservaId");

-- CreateIndex
CREATE UNIQUE INDEX "Tarifa_concepto_key" ON "Tarifa"("concepto");

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_parcelaId_fkey" FOREIGN KEY ("parcelaId") REFERENCES "Parcela"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_frigorificoId_fkey" FOREIGN KEY ("frigorificoId") REFERENCES "Frigorifico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaConcepto" ADD CONSTRAINT "LineaConcepto_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "Reserva"("id") ON DELETE CASCADE ON UPDATE CASCADE;
