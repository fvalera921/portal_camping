"use client";

import type { Temporada } from "@/app/generated/prisma/enums";

export default function SelectorTemporada({
  temporada,
  onCambiar,
}: {
  temporada: Temporada;
  onCambiar: (valor: Temporada) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-sm font-medium text-neutral-700">Temporada</legend>
      <div className="flex gap-2">
        <button
          type="button"
          aria-pressed={temporada === "BAJA"}
          onClick={() => onCambiar("BAJA")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            temporada === "BAJA"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700"
          }`}
        >
          Temporada baja
        </button>
        <button
          type="button"
          aria-pressed={temporada === "ALTA"}
          onClick={() => onCambiar("ALTA")}
          className={`rounded-md border px-3 py-1.5 text-sm ${
            temporada === "ALTA"
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-300 text-neutral-700"
          }`}
        >
          Temporada alta
        </button>
      </div>
    </fieldset>
  );
}
