import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { determinarEstado, reservaCubreFecha } from "@/lib/estadoParcela";
import { formatFechaISO, hoy, parseFechaISO } from "@/lib/fechas";
import PanelReserva from "@/components/PanelReserva";
import ReservaVigente from "@/components/ReservaVigente";
import HistorialReservas from "@/components/HistorialReservas";
import type { TipoParcela } from "@/app/generated/prisma/enums";

const ETIQUETA_TIPO: Record<TipoParcela, string> = {
  TIENDA: "Tienda",
  CARAVANA: "Caravana",
  AUTOCARAVANA: "Autocaravana",
};

export default async function ParcelaDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ numero: string }>;
  searchParams: Promise<{ fecha?: string }>;
}) {
  const { numero: numeroParam } = await params;
  const numero = Number(numeroParam);
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    notFound();
  }

  const { fecha: fechaParam } = await searchParams;
  const fecha = (fechaParam && parseFechaISO(fechaParam)) || hoy();
  const fechaISO = formatFechaISO(fecha);

  const MAX_HISTORIAL = 50;

  const parcela = await prisma.parcela.findUnique({
    where: { numero },
    select: {
      id: true,
      numero: true,
      tipo: true,
      reservas: {
        orderBy: { fechaEntrada: "desc" },
        take: MAX_HISTORIAL,
        select: {
          id: true,
          fechaEntrada: true,
          fechaSalida: true,
          estado: true,
          totalCentimos: true,
          clienteNombre: true,
          clienteTelefono: true,
          frigorificoFechaEntrada: true,
          frigorificoFechaSalida: true,
          frigorifico: { select: { numero: true } },
        },
      },
    },
  });

  if (!parcela) {
    notFound();
  }

  const reservaVigente = parcela.reservas.find((reserva) => reservaCubreFecha(reserva, fecha));
  const estado = determinarEstado(Boolean(reservaVigente), fecha);
  const tarifas = estado === "LIBRE" ? await prisma.tarifa.findMany({ orderBy: { concepto: "asc" } }) : [];

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Link href={`/?fecha=${fechaISO}`} className="text-sm text-neutral-500 hover:underline">
        ← Volver al mapa
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-neutral-900">
          Parcela {parcela.numero} · {ETIQUETA_TIPO[parcela.tipo]}
        </h1>
        <span className="text-sm text-neutral-500">Vista para el {fechaISO}</span>
      </div>

      {estado === "LIBRE" && (
        <PanelReserva parcelaId={parcela.id} tarifas={tarifas} fechaInicialISO={fechaISO} />
      )}

      {estado !== "LIBRE" && reservaVigente && (
        <ReservaVigente
          estadoParcela={estado}
          reserva={{
            id: reservaVigente.id,
            fechaEntrada: formatFechaISO(reservaVigente.fechaEntrada),
            fechaSalida: formatFechaISO(reservaVigente.fechaSalida),
            clienteNombre: reservaVigente.clienteNombre,
            clienteTelefono: reservaVigente.clienteTelefono,
            totalCentimos: reservaVigente.totalCentimos,
            frigorifico: reservaVigente.frigorifico
              ? {
                  numero: reservaVigente.frigorifico.numero,
                  fechaEntrada: formatFechaISO(reservaVigente.frigorificoFechaEntrada!),
                  fechaSalida: formatFechaISO(reservaVigente.frigorificoFechaSalida!),
                }
              : null,
          }}
        />
      )}

      <div>
        <h2 className="mb-2 text-lg font-semibold text-neutral-900">Historial de reservas</h2>
        <HistorialReservas
          reservas={parcela.reservas.map((reserva) => ({
            id: reserva.id,
            fechaEntrada: formatFechaISO(reserva.fechaEntrada),
            fechaSalida: formatFechaISO(reserva.fechaSalida),
            clienteNombre: reserva.clienteNombre,
            estado: reserva.estado,
            totalCentimos: reserva.totalCentimos,
          }))}
        />
      </div>
    </main>
  );
}
