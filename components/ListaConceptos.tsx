"use client";

import { formatEUR } from "@/lib/dinero";
import { calcularSubtotalCentimos } from "@/lib/precios";
import type { Temporada } from "@/app/generated/prisma/enums";

export type Tarifa = {
  concepto: string;
  precioBajaCentimos: number;
  precioAltaCentimos: number;
};

const ETIQUETA_CONCEPTO: Record<string, string> = {
  ADULTOS: "Adultos",
  NINOS: "Niños (3 a 11 años)",
  CARAVANA: "Caravana",
  AUTOCARAVANA: "Autocaravana",
  TIENDA: "Tienda",
  COCHE: "Coche",
  ELECTRICIDAD: "Electricidad",
  MOTO: "Moto",
  PERRO: "Perro",
};

export default function ListaConceptos({
  tarifas,
  temporada,
  noches,
  cantidades,
  onCambiarCantidad,
}: {
  tarifas: Tarifa[];
  temporada: Temporada;
  noches: number;
  cantidades: Record<string, number>;
  onCambiarCantidad: (concepto: string, cantidad: number) => void;
}) {
  return (
    <div className="divide-y divide-neutral-200 rounded-md border border-neutral-200">
      {tarifas.map((tarifa) => {
        const cantidad = cantidades[tarifa.concepto] ?? 0;
        const precioUnitarioCentimos =
          temporada === "ALTA" ? tarifa.precioAltaCentimos : tarifa.precioBajaCentimos;
        const subtotalCentimos = calcularSubtotalCentimos(
          cantidad,
          precioUnitarioCentimos,
          Math.max(noches, 0),
        );
        const etiqueta = ETIQUETA_CONCEPTO[tarifa.concepto] ?? tarifa.concepto;

        return (
          <div
            key={tarifa.concepto}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">{etiqueta}</p>
              <p className="text-xs text-neutral-500">{formatEUR(precioUnitarioCentimos)} / día</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Quitar ${etiqueta}`}
                onClick={() => onCambiarCantidad(tarifa.concepto, Math.max(cantidad - 1, 0))}
                disabled={cantidad === 0}
                className="h-7 w-7 rounded-md border border-neutral-300 text-neutral-700 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-6 text-center text-sm" aria-live="polite">
                {cantidad}
              </span>
              <button
                type="button"
                aria-label={`Añadir ${etiqueta}`}
                onClick={() => onCambiarCantidad(tarifa.concepto, cantidad + 1)}
                className="h-7 w-7 rounded-md border border-neutral-300 text-neutral-700"
              >
                +
              </button>
            </div>
            <p className="w-24 text-right text-sm font-semibold text-neutral-900">
              {cantidad > 0 ? formatEUR(subtotalCentimos) : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
