"use client";

import { useEffect, useRef, useState } from "react";
import { formatFechaISO, inicioDia, parseFechaISO } from "@/lib/fechas";
import { generarCeldasMes } from "@/lib/calendario";

export type RangoBloqueado = { fechaEntrada: Date; fechaSalida: Date };

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

function estaBloqueada(fecha: Date, rangos: RangoBloqueado[]): boolean {
  return rangos.some((rango) => fecha >= rango.fechaEntrada && fecha < rango.fechaSalida);
}

export default function SelectorFechaCalendario({
  label,
  valorISO,
  onCambiar,
  minISO,
  rangosBloqueados = [],
}: {
  label: string;
  valorISO: string;
  onCambiar: (valorISO: string) => void;
  minISO?: string;
  rangosBloqueados?: RangoBloqueado[];
}) {
  const [abierto, setAbierto] = useState(false);
  const valor = parseFechaISO(valorISO);
  const [mesVisible, setMesVisible] = useState(() => inicioDia(valor ?? new Date()));
  const contenedorRef = useRef<HTMLDivElement>(null);
  const min = minISO ? parseFechaISO(minISO) : null;

  useEffect(() => {
    function alClicarFuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alClicarFuera);
    return () => document.removeEventListener("mousedown", alClicarFuera);
  }, []);

  const celdas = generarCeldasMes(mesVisible.getFullYear(), mesVisible.getMonth());

  function cambiarMes(delta: number) {
    setMesVisible((actual) => new Date(actual.getFullYear(), actual.getMonth() + delta, 1));
  }

  function alAbrir() {
    setMesVisible(inicioDia(valor ?? min ?? new Date()));
    setAbierto((actual) => !actual);
  }

  function seleccionar(fecha: Date) {
    onCambiar(formatFechaISO(fecha));
    setAbierto(false);
  }

  return (
    <div className="relative" ref={contenedorRef}>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        {label}
        <button
          type="button"
          onClick={alAbrir}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-left text-sm text-neutral-900"
        >
          {valor ? formatFechaISO(valor) : "Selecciona"}
        </button>
      </label>

      {abierto && (
        <div className="absolute z-30 mt-1 w-64 rounded-md border border-neutral-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              aria-label="Mes anterior"
              className="rounded p-1 text-neutral-600 hover:bg-neutral-100"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-neutral-800 capitalize">
              {MESES[mesVisible.getMonth()]} {mesVisible.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              aria-label="Mes siguiente"
              className="rounded p-1 text-neutral-600 hover:bg-neutral-100"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-500">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia}>{dia}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {celdas.map((fecha, indice) => {
              if (!fecha) return <div key={indice} />;
              const bloqueada = estaBloqueada(fecha, rangosBloqueados);
              const antesDeMin = min !== null && fecha < min;
              const deshabilitada = bloqueada || antesDeMin;
              const seleccionada = valor !== null && formatFechaISO(valor) === formatFechaISO(fecha);

              return (
                <button
                  key={indice}
                  type="button"
                  disabled={deshabilitada}
                  title={bloqueada ? "Ya reservada" : undefined}
                  onClick={() => seleccionar(fecha)}
                  className={`h-8 w-8 rounded-md text-sm ${
                    seleccionada
                      ? "bg-neutral-900 text-white"
                      : bloqueada
                        ? "cursor-not-allowed bg-red-50 text-red-300 line-through"
                        : antesDeMin
                          ? "cursor-not-allowed text-neutral-300"
                          : "text-neutral-800 hover:bg-neutral-100"
                  }`}
                >
                  {fecha.getDate()}
                </button>
              );
            })}
          </div>

          {rangosBloqueados.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-500">
              <span className="inline-block h-3 w-3 rounded-sm bg-red-50" /> Ya reservada
            </p>
          )}
        </div>
      )}
    </div>
  );
}
