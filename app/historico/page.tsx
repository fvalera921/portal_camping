import Link from "next/link";
import { prisma } from "@/lib/db";
import { obtenerAsignacionesFrigorificoEnRango, obtenerReservasEnRango } from "@/lib/timeline";
import { formatFechaISO, hoy, parseFechaISO, sumarDias } from "@/lib/fechas";
import HistoricoGantt from "@/components/HistoricoGantt";

const DIAS_VISIBLES = 14;

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>;
}) {
  const { desde: desdeParam } = await searchParams;
  const desde = (desdeParam && parseFechaISO(desdeParam)) || hoy();
  const hasta = sumarDias(desde, DIAS_VISIBLES);

  const [parcelas, reservas, frigorificos, asignacionesFrigorifico] = await Promise.all([
    prisma.parcela.findMany({
      orderBy: { numero: "asc" },
      select: { id: true, numero: true, tipo: true },
    }),
    obtenerReservasEnRango(desde, hasta),
    prisma.frigorifico.findMany({ orderBy: { numero: "asc" }, select: { id: true, numero: true } }),
    obtenerAsignacionesFrigorificoEnRango(desde, hasta),
  ]);

  return (
    <main className="w-full px-6 py-10">
      <Link href="/" className="text-sm text-neutral-500 hover:underline">
        ← Volver al mapa
      </Link>

      <h1 className="mt-2 mb-6 text-2xl font-bold text-neutral-900">Histórico de reservas</h1>

      <HistoricoGantt
        parcelas={parcelas}
        reservas={reservas.map((reserva) => ({
          id: reserva.id,
          parcelaId: reserva.parcelaId,
          fechaEntradaISO: formatFechaISO(reserva.fechaEntrada),
          fechaSalidaISO: formatFechaISO(reserva.fechaSalida),
          clienteNombre: reserva.clienteNombre,
          totalCentimos: reserva.totalCentimos,
        }))}
        frigorificos={frigorificos}
        asignacionesFrigorifico={asignacionesFrigorifico.map((asignacion) => ({
          id: asignacion.id,
          frigorificoId: asignacion.frigorificoId,
          fechaEntradaISO: formatFechaISO(asignacion.fechaEntrada),
          fechaSalidaISO: formatFechaISO(asignacion.fechaSalida),
          clienteNombre: asignacion.clienteNombre,
          parcelaNumero: asignacion.parcelaNumero,
        }))}
        desdeISO={formatFechaISO(desde)}
        diasVisibles={DIAS_VISIBLES}
      />
    </main>
  );
}
