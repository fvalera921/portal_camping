import { prisma } from "@/lib/db";
import { hoy, inicioDia } from "@/lib/fechas";
import type { TipoParcela, Temporada } from "@/app/generated/prisma/enums";

export type EstadoParcela = "LIBRE" | "OCUPADA" | "RESERVADA";

export type ReservaActivaResumen = {
  id: number;
  fechaEntrada: Date;
  fechaSalida: Date;
  temporada: Temporada;
  clienteNombre: string;
  clienteDocumento: string;
  clienteTelefono: string;
  clienteEmail: string | null;
  matricula: string | null;
  totalCentimos: number;
  frigorifico: { numero: number; fechaEntrada: Date; fechaSalida: Date } | null;
};

export type ParcelaConEstado = {
  id: number;
  numero: number;
  tipo: TipoParcela;
  tieneElectricidad: boolean;
  notas: string | null;
  estado: EstadoParcela;
  reserva: ReservaActivaResumen | null;
};

const ESTADOS_ACTIVOS = new Set(["CONFIRMADA", "EN_CURSO"]);

export function reservaCubreFecha(
  reserva: { fechaEntrada: Date; fechaSalida: Date; estado: string },
  fecha: Date,
): boolean {
  if (!ESTADOS_ACTIVOS.has(reserva.estado)) return false;
  const dia = inicioDia(fecha);
  return reserva.fechaEntrada <= dia && dia < reserva.fechaSalida;
}

/** LIBRE si no hay reserva activa cubriendo la fecha; si la hay, OCUPADA (fecha <= hoy) o RESERVADA (fecha futura). */
export function determinarEstado(cubiertaPorReserva: boolean, fecha: Date): EstadoParcela {
  if (!cubiertaPorReserva) return "LIBRE";
  return inicioDia(fecha) > hoy() ? "RESERVADA" : "OCUPADA";
}

/**
 * Calcula el estado de las 100 parcelas para una fecha dada con un número constante de
 * queries (2), no una por parcela: una para las parcelas y otra para las reservas que
 * cubren ese día en cualquier parcela.
 */
export async function obtenerParcelasConEstado(fecha: Date): Promise<ParcelaConEstado[]> {
  const dia = inicioDia(fecha);
  const diaSiguiente = new Date(dia);
  diaSiguiente.setDate(dia.getDate() + 1);

  const [parcelas, reservasDelDia] = await Promise.all([
    prisma.parcela.findMany({ orderBy: { numero: "asc" } }),
    prisma.reserva.findMany({
      where: {
        estado: { in: ["CONFIRMADA", "EN_CURSO"] },
        fechaEntrada: { lt: diaSiguiente },
        fechaSalida: { gt: dia },
      },
      select: {
        id: true,
        parcelaId: true,
        fechaEntrada: true,
        fechaSalida: true,
        temporada: true,
        clienteNombre: true,
        clienteDocumento: true,
        clienteTelefono: true,
        clienteEmail: true,
        matricula: true,
        totalCentimos: true,
        frigorificoFechaEntrada: true,
        frigorificoFechaSalida: true,
        frigorifico: { select: { numero: true } },
      },
    }),
  ]);

  const reservaPorParcela = new Map(
    reservasDelDia.map((r) => [r.parcelaId, r] as const),
  );

  return parcelas.map((parcela) => {
    const reserva = reservaPorParcela.get(parcela.id);
    return {
      ...parcela,
      estado: determinarEstado(reserva !== undefined, fecha),
      reserva: reserva
        ? {
            id: reserva.id,
            fechaEntrada: reserva.fechaEntrada,
            fechaSalida: reserva.fechaSalida,
            temporada: reserva.temporada,
            clienteNombre: reserva.clienteNombre,
            clienteDocumento: reserva.clienteDocumento,
            clienteTelefono: reserva.clienteTelefono,
            clienteEmail: reserva.clienteEmail,
            matricula: reserva.matricula,
            totalCentimos: reserva.totalCentimos,
            frigorifico:
              reserva.frigorifico && reserva.frigorificoFechaEntrada && reserva.frigorificoFechaSalida
                ? {
                    numero: reserva.frigorifico.numero,
                    fechaEntrada: reserva.frigorificoFechaEntrada,
                    fechaSalida: reserva.frigorificoFechaSalida,
                  }
                : null,
          }
        : null,
    };
  });
}
