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

export type AsignacionFrigorificoTimeline = {
  id: number;
  frigorificoId: number;
  fechaEntrada: Date;
  fechaSalida: Date;
  clienteNombre: string;
  parcelaNumero: number;
};

/** Asignaciones de frigorificos (rango propio, independiente del de la parcela) que se solapan con [desde, hasta). */
export async function obtenerAsignacionesFrigorificoEnRango(
  desde: Date,
  hasta: Date,
): Promise<AsignacionFrigorificoTimeline[]> {
  const inicio = inicioDia(desde);
  const fin = inicioDia(hasta);
  const reservas = await prisma.reserva.findMany({
    where: {
      estado: { in: ["CONFIRMADA", "EN_CURSO"] },
      frigorificoId: { not: null },
      frigorificoFechaEntrada: { lt: fin },
      frigorificoFechaSalida: { gt: inicio },
    },
    select: {
      id: true,
      frigorificoId: true,
      frigorificoFechaEntrada: true,
      frigorificoFechaSalida: true,
      clienteNombre: true,
      parcela: { select: { numero: true } },
    },
    orderBy: { frigorificoFechaEntrada: "asc" },
  });

  return reservas.map((reserva) => ({
    id: reserva.id,
    frigorificoId: reserva.frigorificoId!,
    fechaEntrada: reserva.frigorificoFechaEntrada!,
    fechaSalida: reserva.frigorificoFechaSalida!,
    clienteNombre: reserva.clienteNombre,
    parcelaNumero: reserva.parcela.numero,
  }));
}
