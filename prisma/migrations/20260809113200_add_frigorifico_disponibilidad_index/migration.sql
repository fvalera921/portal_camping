-- CreateIndex
CREATE INDEX "Reserva_estado_frigorificoFechaEntrada_frigorificoFechaSalida_idx" ON "Reserva"("estado", "frigorificoFechaEntrada", "frigorificoFechaSalida");
