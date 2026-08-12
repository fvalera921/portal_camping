import { memo } from "react";
import Link from "next/link";
import type { ParcelaConEstado, EstadoParcela } from "@/lib/estadoParcela";
import type { TipoParcela } from "@/app/generated/prisma/enums";
import { formatFechaCorta } from "@/lib/fechas";
import { formatEUR } from "@/lib/dinero";

const ESTILO_ESTADO: Record<
  EstadoParcela,
  { fondo: string; borde: string; texto: string; etiqueta: string }
> = {
  LIBRE: {
    fondo: "bg-emerald-50",
    borde: "border-emerald-500",
    texto: "text-emerald-900",
    etiqueta: "Libre",
  },
  OCUPADA: {
    fondo: "bg-red-50",
    borde: "border-red-500",
    texto: "text-red-900",
    etiqueta: "Ocupada",
  },
  RESERVADA: {
    fondo: "bg-amber-50",
    borde: "border-amber-500",
    texto: "text-amber-900",
    etiqueta: "Reservada",
  },
};

const ETIQUETA_TIPO: Record<TipoParcela, string> = {
  TIENDA: "Tienda",
  CARAVANA: "Caravana",
  AUTOCARAVANA: "Autocaravana",
};

function ParcelaCelda({ parcela, fechaISO }: { parcela: ParcelaConEstado; fechaISO: string }) {
  const estilo = ESTILO_ESTADO[parcela.estado];
  const reserva = parcela.reserva;
  const rangoFechas = reserva
    ? `${formatFechaCorta(reserva.fechaEntrada)}–${formatFechaCorta(reserva.fechaSalida)}`
    : null;

  const aviso = `Parcela ${parcela.numero}, ${ETIQUETA_TIPO[parcela.tipo]}${
    parcela.tieneElectricidad ? ", con electricidad" : ""
  }, estado: ${estilo.etiqueta}${rangoFechas ? `, del ${rangoFechas}` : ""}. Ver detalle.`;

  const lineasInfo = [
    `Parcela ${parcela.numero} · ${ETIQUETA_TIPO[parcela.tipo]}${
      parcela.tieneElectricidad ? " · con electricidad" : ""
    }`,
    `Estado: ${estilo.etiqueta}`,
  ];
  if (reserva) {
    lineasInfo.push(
      `Cliente: ${reserva.clienteNombre}`,
      `Documento: ${reserva.clienteDocumento}`,
      `Teléfono: ${reserva.clienteTelefono}`,
      ...(reserva.clienteEmail ? [`Email: ${reserva.clienteEmail}`] : []),
      ...(reserva.matricula ? [`Matrícula: ${reserva.matricula}`] : []),
      `Fechas: ${formatFechaCorta(reserva.fechaEntrada)} - ${formatFechaCorta(reserva.fechaSalida)}`,
      `Temporada: ${reserva.temporada}`,
      `Total: ${formatEUR(reserva.totalCentimos)}`,
    );
    if (reserva.frigorifico) {
      lineasInfo.push(
        `Frigorífico: nº${reserva.frigorifico.numero} (${formatFechaCorta(reserva.frigorifico.fechaEntrada)} - ${formatFechaCorta(reserva.frigorifico.fechaSalida)})`,
      );
    }
  }

  return (
    <Link
      href={`/parcelas/${parcela.numero}?fecha=${fechaISO}`}
      aria-label={aviso}
      title={lineasInfo.join("\n")}
      className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border-2 p-1 text-center transition hover:brightness-95 ${estilo.fondo} ${estilo.borde} ${estilo.texto}`}
    >
      <span className="text-sm font-bold">{parcela.numero}</span>
      {rangoFechas && <span className="text-xs font-medium leading-none">{rangoFechas}</span>}
    </Link>
  );
}

export default memo(ParcelaCelda);
