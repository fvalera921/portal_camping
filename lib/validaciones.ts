import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

type ClienteDB = PrismaClient | Prisma.TransactionClient;

export function fechaSalidaEsValida(fechaEntrada: Date, fechaSalida: Date): boolean {
  return fechaSalida.getTime() > fechaEntrada.getTime();
}

/**
 * Comprueba si ya existe una reserva activa (CONFIRMADA/EN_CURSO) en la parcela que se
 * solape con el rango [fechaEntrada, fechaSalida). Recibe el cliente de Prisma (o una
 * transacción) para poder reutilizarse dentro de la creación atómica de una reserva.
 */
export async function existeSolapamiento(
  db: ClienteDB,
  parcelaId: number,
  fechaEntrada: Date,
  fechaSalida: Date,
): Promise<boolean> {
  const solapada = await db.reserva.findFirst({
    where: {
      parcelaId,
      estado: { in: ["CONFIRMADA", "EN_CURSO"] },
      fechaEntrada: { lt: fechaSalida },
      fechaSalida: { gt: fechaEntrada },
    },
    select: { id: true },
  });
  return solapada !== null;
}

/**
 * Igual que existeSolapamiento pero para la asignacion de un frigorifico (solo hay 8, se
 * comparten entre parcelas). Compara contra frigorificoFechaEntrada/frigorificoFechaSalida,
 * que puede ser un rango mas corto que el de la reserva.
 */
export async function existeSolapamientoFrigorifico(
  db: ClienteDB,
  frigorificoId: number,
  fechaEntrada: Date,
  fechaSalida: Date,
): Promise<boolean> {
  const solapada = await db.reserva.findFirst({
    where: {
      frigorificoId,
      estado: { in: ["CONFIRMADA", "EN_CURSO"] },
      frigorificoFechaEntrada: { lt: fechaSalida },
      frigorificoFechaSalida: { gt: fechaEntrada },
    },
    select: { id: true },
  });
  return solapada !== null;
}
