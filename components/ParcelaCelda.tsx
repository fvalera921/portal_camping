import { memo } from "react";
import type { ParcelaConEstado, EstadoParcela } from "@/lib/estadoParcela";
import type { TipoParcela } from "@/app/generated/prisma/enums";

const ESTILO_ESTADO: Record<
  EstadoParcela,
  { fondo: string; borde: string; texto: string; icono: string; etiqueta: string }
> = {
  LIBRE: {
    fondo: "bg-emerald-50",
    borde: "border-emerald-500",
    texto: "text-emerald-900",
    icono: "✓",
    etiqueta: "Libre",
  },
  OCUPADA: {
    fondo: "bg-red-50",
    borde: "border-red-500",
    texto: "text-red-900",
    icono: "✕",
    etiqueta: "Ocupada",
  },
  RESERVADA: {
    fondo: "bg-amber-50",
    borde: "border-amber-500",
    texto: "text-amber-900",
    icono: "◗",
    etiqueta: "Reservada",
  },
};

const ICONO_TIPO: Record<TipoParcela, string> = {
  TIENDA: "⛺",
  CARAVANA: "🚐",
  AUTOCARAVANA: "🚙",
};

const ETIQUETA_TIPO: Record<TipoParcela, string> = {
  TIENDA: "Tienda",
  CARAVANA: "Caravana",
  AUTOCARAVANA: "Autocaravana",
};

function ParcelaCelda({ parcela }: { parcela: ParcelaConEstado }) {
  const estilo = ESTILO_ESTADO[parcela.estado];
  const descripcion = `Parcela ${parcela.numero}, ${ETIQUETA_TIPO[parcela.tipo]}${
    parcela.tieneElectricidad ? ", con electricidad" : ""
  }, estado: ${estilo.etiqueta}`;

  return (
    <div
      role="img"
      aria-label={descripcion}
      title={descripcion}
      className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md border-2 p-1 text-center ${estilo.fondo} ${estilo.borde} ${estilo.texto}`}
    >
      <span className="text-xs font-bold">{parcela.numero}</span>
      <span aria-hidden="true" className="text-base leading-none">
        {ICONO_TIPO[parcela.tipo]}
      </span>
      <span aria-hidden="true" className="text-sm leading-none">
        {estilo.icono}
      </span>
      {parcela.tieneElectricidad && (
        <span aria-hidden="true" className="text-[10px] leading-none">
          {"⚡"}
        </span>
      )}
      <span className="text-[9px] leading-none font-medium">{estilo.etiqueta}</span>
    </div>
  );
}

export default memo(ParcelaCelda);
