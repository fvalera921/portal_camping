-- CreateIndex
CREATE INDEX "Reserva_estado_fechaEntrada_fechaSalida_idx" ON "Reserva"("estado", "fechaEntrada", "fechaSalida");
