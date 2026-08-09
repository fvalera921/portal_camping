import { prisma } from "@/lib/db";
import { hoy, inicioDia } from "@/lib/fechas";
import type { TipoParcela } from "@/app/generated/prisma/enums";

export type EstadoParcela = "LIBRE" | "OCUPADA" | "RESERVADA";

export type ParcelaConEstado = {
  id: number;
  numero: number;
  tipo: TipoParcela;
  tieneElectricidad: boolean;
  notas: string | null;
  estado: EstadoParcela;
};

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
      select: { parcelaId: true },
    }),
  ]);

  const parcelasConReserva = new Set(reservasDelDia.map((r) => r.parcelaId));
  const esFuturo = dia > hoy();

  return parcelas.map((parcela) => ({
    ...parcela,
    estado: parcelasConReserva.has(parcela.id)
      ? esFuturo
        ? "RESERVADA"
        : "OCUPADA"
      : "LIBRE",
  }));
}
