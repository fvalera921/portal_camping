"use client";

import type { EstadoParcela } from "@/lib/estadoParcela";
import type { TipoParcela } from "@/app/generated/prisma/enums";

export type FiltroEstado = EstadoParcela | "TODOS";
export type FiltroTipo = TipoParcela | "TODOS";
export type FiltroElectricidad = "TODOS" | "CON" | "SIN";

export default function FiltrosMapa({
  filtroEstado,
  onFiltroEstadoChange,
  filtroTipo,
  onFiltroTipoChange,
  filtroElectricidad,
  onFiltroElectricidadChange,
}: {
  filtroEstado: FiltroEstado;
  onFiltroEstadoChange: (valor: FiltroEstado) => void;
  filtroTipo: FiltroTipo;
  onFiltroTipoChange: (valor: FiltroTipo) => void;
  filtroElectricidad: FiltroElectricidad;
  onFiltroElectricidadChange: (valor: FiltroElectricidad) => void;
}) {
  return (
    <div className="flex flex-wrap gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Estado
        <select
          value={filtroEstado}
          onChange={(e) => onFiltroEstadoChange(e.target.value as FiltroEstado)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="TODOS">Todos</option>
          <option value="LIBRE">Libre</option>
          <option value="OCUPADA">Ocupada</option>
          <option value="RESERVADA">Reservada</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Tipo
        <select
          value={filtroTipo}
          onChange={(e) => onFiltroTipoChange(e.target.value as FiltroTipo)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="TODOS">Todos</option>
          <option value="TIENDA">Tienda</option>
          <option value="CARAVANA">Caravana</option>
          <option value="AUTOCARAVANA">Autocaravana</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Electricidad
        <select
          value={filtroElectricidad}
          onChange={(e) => onFiltroElectricidadChange(e.target.value as FiltroElectricidad)}
          className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
        >
          <option value="TODOS">Todas</option>
          <option value="CON">Con electricidad</option>
          <option value="SIN">Sin electricidad</option>
        </select>
      </label>
    </div>
  );
}
