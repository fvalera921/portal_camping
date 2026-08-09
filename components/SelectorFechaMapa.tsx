"use client";

export default function SelectorFechaMapa({
  fechaISO,
  onCambiar,
}: {
  fechaISO: string;
  onCambiar: (fechaISO: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
      Fecha
      <input
        type="date"
        value={fechaISO}
        onChange={(e) => {
          if (e.target.value) onCambiar(e.target.value);
        }}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
      />
    </label>
  );
}
