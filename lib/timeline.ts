import { prisma } from "@/lib/db";
import { inicioDia } from "@/lib/fechas";

export type ReservaTimeline = {
  id: number;
  parcelaId: number;
  fechaEntrada: Date;
  fechaSalida: Date;
  clienteNombre: string;
  totalCentimos: number;
};

/** Reservas activas (CONFIRMADA/EN_CURSO) que se solapan con [desde, hasta). */
export async function obtenerReservasEnRango(desde: Date, hasta: Date): Promise<ReservaTimeline[]> {
  const inicio = inicioDia(desde);
  const fin = inicioDia(hasta);
  return prisma.reserva.findMany({
    where: {
      estado: { in: ["CONFIRMADA", "EN_CURSO"] },
      fechaEntrada: { lt: fin },
      fechaSalida: { gt: inicio },
    },
    select: {
      id: true,
      parcelaId: true,
      fechaEntrada: true,
      fechaSalida: true,
      clienteNombre: true,
      totalCentimos: true,
    },
    orderBy: { fechaEntrada: "asc" },
  });
}
