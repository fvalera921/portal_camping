"use client";

import SelectorFechaCalendario, { type RangoBloqueado } from "@/components/SelectorFechaCalendario";
import { formatFechaISO, parseFechaISO, sumarDias } from "@/lib/fechas";

export default function SelectorFechas({
  fechaEntradaISO,
  fechaSalidaISO,
  onCambiarEntrada,
  onCambiarSalida,
  noches,
  rangosBloqueados = [],
}: {
  fechaEntradaISO: string;
  fechaSalidaISO: string;
  onCambiarEntrada: (valor: string) => void;
  onCambiarSalida: (valor: string) => void;
  noches: number;
  rangosBloqueados?: RangoBloqueado[];
}) {
  const fechaEntrada = parseFechaISO(fechaEntradaISO);
  const minSalidaISO = fechaEntrada ? formatFechaISO(sumarDias(fechaEntrada, 1)) : undefined;

  return (
    <div className="flex flex-wrap items-end gap-4">
      <SelectorFechaCalendario
        label="Entrada"
        valorISO={fechaEntradaISO}
        onCambiar={onCambiarEntrada}
        rangosBloqueados={rangosBloqueados}
      />
      <SelectorFechaCalendario
        label="Salida"
        valorISO={fechaSalidaISO}
        onCambiar={onCambiarSalida}
        minISO={minSalidaISO}
        rangosBloqueados={rangosBloqueados}
      />
      <p className="text-sm text-neutral-600" aria-live="polite">
        {noches > 0 ? `${noches} ${noches === 1 ? "noche" : "noches"}` : "Selecciona fechas válidas"}
      </p>
    </div>
  );
}
