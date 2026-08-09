"use client";

import { formatEUR } from "@/lib/dinero";

export type FrigorificoDisponibilidad = { id: number; numero: number; disponible: boolean };

export default function SelectorFrigorifico({
  activo,
  onActivoChange,
  numero,
  onNumeroChange,
  fechaEntradaISO,
  fechaSalidaISO,
  onCambiarFechaEntrada,
  onCambiarFechaSalida,
  fechaEntradaMinISO,
  fechaSalidaMaxISO,
  disponibilidad,
  precioUnitarioCentimos,
  noches,
  subtotalCentimos,
}: {
  activo: boolean;
  onActivoChange: (valor: boolean) => void;
  numero: number | null;
  onNumeroChange: (valor: number | null) => void;
  fechaEntradaISO: string;
  fechaSalidaISO: string;
  onCambiarFechaEntrada: (valor: string) => void;
  onCambiarFechaSalida: (valor: string) => void;
  fechaEntradaMinISO: string;
  fechaSalidaMaxISO: string;
  disponibilidad: FrigorificoDisponibilidad[];
  precioUnitarioCentimos: number | null;
  noches: number;
  subtotalCentimos: number;
}) {
  const hayDisponibles = disponibilidad.some((f) => f.disponible);

  return (
    <fieldset className="space-y-3 rounded-md border border-neutral-200 p-3">
      <legend className="px-1 text-sm font-medium text-neutral-700">Frigorífico</legend>

      <label className="flex items-center gap-2 text-sm text-neutral-800">
        <input
          type="checkbox"
          checked={activo}
          disabled={!hayDisponibles}
          onChange={(e) => onActivoChange(e.target.checked)}
        />
        Añadir frigorífico
      </label>

      {!hayDisponibles && (
        <p className="text-sm text-neutral-500">
          No hay frigoríficos disponibles para estas fechas: solo hay 8 y están todos ocupados.
        </p>
      )}

      {activo && hayDisponibles && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Numero de frigorifico">
            {disponibilidad.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={numero === f.numero}
                aria-label={`Frigorifico ${f.numero}${f.disponible ? "" : " (no disponible)"}`}
                title={f.disponible ? `Frigorífico ${f.numero}` : `Frigorífico ${f.numero} — no disponible`}
                disabled={!f.disponible}
                onClick={() => onNumeroChange(f.numero)}
                className={`h-9 w-9 rounded-md border text-sm font-medium disabled:cursor-not-allowed ${
                  numero === f.numero
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : f.disponible
                      ? "border-neutral-300 text-neutral-700"
                      : "border-neutral-200 text-neutral-300 line-through"
                }`}
              >
                {f.numero}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
              Desde
              <input
                type="date"
                value={fechaEntradaISO}
                min={fechaEntradaMinISO}
                max={fechaSalidaMaxISO}
                onChange={(e) => e.target.value && onCambiarFechaEntrada(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
              Hasta
              <input
                type="date"
                value={fechaSalidaISO}
                min={fechaEntradaMinISO}
                max={fechaSalidaMaxISO}
                onChange={(e) => e.target.value && onCambiarFechaSalida(e.target.value)}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              />
            </label>
            <p className="text-sm text-neutral-600" aria-live="polite">
              {noches > 0 ? `${noches} ${noches === 1 ? "noche" : "noches"}` : "Fechas inválidas"}
            </p>
          </div>

          {precioUnitarioCentimos !== null && (
            <p className="text-sm text-neutral-600">
              {formatEUR(precioUnitarioCentimos)} / día
              {numero !== null && noches > 0 ? ` · Subtotal: ${formatEUR(subtotalCentimos)}` : ""}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
