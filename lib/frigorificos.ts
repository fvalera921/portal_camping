import { prisma as prismaPorDefecto } from "@/lib/db";
import { inicioDia } from "@/lib/fechas";
import type { Prisma, PrismaClient } from "@/app/generated/prisma/client";

type ClienteDB = PrismaClient | Prisma.TransactionClient;

export type FrigorificoConDisponibilidad = {
  id: number;
  numero: number;
  disponible: boolean;
};

export type OcupacionFrigorifico = {
  parcelaNumero: number;
  clienteNombre: string;
  fechaEntrada: Date;
  fechaSalida: Date;
};

export type FrigorificoConEstado = {
  id: number;
  numero: number;
  disponible: boolean;
  ocupacion: OcupacionFrigorifico | null;
};

/**
 * Disponibilidad de los frigorificos (solo hay 8) para un rango [fechaEntrada, fechaSalida).
 * Con 2 queries (sin N+1), igual que lib/estadoParcela.ts para las parcelas. Acepta el cliente
 * de Prisma como parametro (por defecto el singleton de la app) para poder testearse contra
 * una base de datos aislada, igual que lib/validaciones.ts.
 */
export async function obtenerDisponibilidadFrigorificos(
  fechaEntrada: Date,
  fechaSalida: Date,
  db: ClienteDB = prismaPorDefecto,
): Promise<FrigorificoConDisponibilidad[]> {
  const [frigorificos, asignacionesActivas] = await Promise.all([
    db.frigorifico.findMany({ orderBy: { numero: "asc" } }),
    db.reserva.findMany({
      where: {
        estado: { in: ["CONFIRMADA", "EN_CURSO"] },
        frigorificoId: { not: null },
        frigorificoFechaEntrada: { lt: fechaSalida },
        frigorificoFechaSalida: { gt: fechaEntrada },
      },
      select: { frigorificoId: true },
    }),
  ]);

  const ocupados = new Set(asignacionesActivas.map((a) => a.frigorificoId));

  return frigorificos.map((frigorifico) => ({
    id: frigorifico.id,
    numero: frigorifico.numero,
    disponible: !ocupados.has(frigorifico.id),
  }));
}

/**
 * Estado de los 8 frigorificos para un dia concreto (para el mapa de parcelas), incluyendo
 * que parcela/cliente lo tiene asignado cuando esta ocupado. Igual patron de 2 queries que
 * obtenerDisponibilidadFrigorificos, con el detalle de la ocupacion en vez de solo el booleano.
 */
export async function obtenerEstadoFrigorificosEnFecha(
  fecha: Date,
  db: ClienteDB = prismaPorDefecto,
): Promise<FrigorificoConEstado[]> {
  const dia = inicioDia(fecha);
  const diaSiguiente = new Date(dia);
  diaSiguiente.setDate(dia.getDate() + 1);

  const [frigorificos, asignacionesActivas] = await Promise.all([
    db.frigorifico.findMany({ orderBy: { numero: "asc" } }),
    db.reserva.findMany({
      where: {
        estado: { in: ["CONFIRMADA", "EN_CURSO"] },
        frigorificoId: { not: null },
        frigorificoFechaEntrada: { lt: diaSiguiente },
        frigorificoFechaSalida: { gt: dia },
      },
      select: {
        frigorificoId: true,
        clienteNombre: true,
        frigorificoFechaEntrada: true,
        frigorificoFechaSalida: true,
        parcela: { select: { numero: true } },
      },
    }),
  ]);

  const ocupacionPorFrigorifico = new Map(
    asignacionesActivas.map((a) => [a.frigorificoId!, a] as const),
  );

  return frigorificos.map((frigorifico) => {
    const ocupacion = ocupacionPorFrigorifico.get(frigorifico.id);
    return {
      id: frigorifico.id,
      numero: frigorifico.numero,
      disponible: !ocupacion,
      ocupacion: ocupacion
        ? {
            parcelaNumero: ocupacion.parcela.numero,
            clienteNombre: ocupacion.clienteNombre,
            fechaEntrada: ocupacion.frigorificoFechaEntrada!,
            fechaSalida: ocupacion.frigorificoFechaSalida!,
          }
        : null,
    };
  });
}
