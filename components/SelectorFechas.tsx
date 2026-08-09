"use client";

export default function SelectorFechas({
  fechaEntradaISO,
  fechaSalidaISO,
  onCambiarEntrada,
  onCambiarSalida,
  noches,
}: {
  fechaEntradaISO: string;
  fechaSalidaISO: string;
  onCambiarEntrada: (valor: string) => void;
  onCambiarSalida: (valor: string) => void;
  noches: number;
}) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Entrada
        <input
          type="date"
          value={fechaEntradaISO}
          onChange={(e) => e.target.value && onCambiarEntrada(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Salida
        <input
          type="date"
          value={fechaSalidaISO}
          onChange={(e) => e.target.value && onCambiarSalida(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
      </label>
      <p className="text-sm text-neutral-600" aria-live="polite">
        {noches > 0 ? `${noches} ${noches === 1 ? "noche" : "noches"}` : "Selecciona fechas válidas"}
      </p>
    </div>
  );
}
