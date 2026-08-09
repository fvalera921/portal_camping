import { memo } from "react";
import Link from "next/link";
import type { ParcelaConEstado, EstadoParcela } from "@/lib/estadoParcela";
import type { TipoParcela } from "@/app/generated/prisma/enums";

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

const ABREVIATURA_TIPO: Record<TipoParcela, string> = {
  TIENDA: "Tienda",
  CARAVANA: "Carav.",
  AUTOCARAVANA: "Autoc.",
};

const ETIQUETA_TIPO: Record<TipoParcela, string> = {
  TIENDA: "Tienda",
  CARAVANA: "Caravana",
  AUTOCARAVANA: "Autocaravana",
};

function ParcelaCelda({ parcela, fechaISO }: { parcela: ParcelaConEstado; fechaISO: string }) {
  const estilo = ESTILO_ESTADO[parcela.estado];
  const descripcion = `Parcela ${parcela.numero}, ${ETIQUETA_TIPO[parcela.tipo]}${
    parcela.tieneElectricidad ? ", con electricidad" : ""
  }, estado: ${estilo.etiqueta}`;

  return (
    <Link
      href={`/parcelas/${parcela.numero}?fecha=${fechaISO}`}
      aria-label={`${descripcion}. Ver detalle.`}
      title={descripcion}
      className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border-2 p-1 text-center transition hover:brightness-95 ${estilo.fondo} ${estilo.borde} ${estilo.texto}`}
    >
      <span className="text-xs font-bold">{parcela.numero}</span>
      <span className="text-[10px] leading-none">{ABREVIATURA_TIPO[parcela.tipo]}</span>
      {parcela.tieneElectricidad && <span className="text-[9px] leading-none">Con luz</span>}
      <span className="text-[9px] leading-none font-medium">{estilo.etiqueta}</span>
    </Link>
  );
}

export default memo(ParcelaCelda);
