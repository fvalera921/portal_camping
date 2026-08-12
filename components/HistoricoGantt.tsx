"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatEUR } from "@/lib/dinero";
import {
  diferenciaEnNoches,
  formatDiaSemanaCorto,
  formatFechaCorta,
  formatFechaISO,
  hoy,
  parseFechaISO,
  sumarDias,
} from "@/lib/fechas";
import type { TipoParcela } from "@/app/generated/prisma/enums";

export type ParcelaTimeline = { id: number; numero: number; tipo: TipoParcela };

export type ReservaTimelineDTO = {
  id: number;
  parcelaId: number;
  fechaEntradaISO: string;
  fechaSalidaISO: string;
  clienteNombre: string;
  totalCentimos: number;
};

export type FrigorificoTimeline = { id: number; numero: number };

export type AsignacionFrigorificoTimelineDTO = {
  id: number;
  frigorificoId: number;
  fechaEntradaISO: string;
  fechaSalidaISO: string;
  clienteNombre: string;
  parcelaNumero: number;
};

const ANCHO_COLUMNA_ETIQUETA = "5rem";
const ANCHO_COLUMNA_DIA = "minmax(2.75rem, 1fr)";
const ALTO_FILA = "2rem";

export default function HistoricoGantt({
  parcelas,
  reservas,
  frigorificos,
  asignacionesFrigorifico,
  desdeISO,
  diasVisibles,
}: {
  parcelas: ParcelaTimeline[];
  reservas: ReservaTimelineDTO[];
  frigorificos: FrigorificoTimeline[];
  asignacionesFrigorifico: AsignacionFrigorificoTimelineDTO[];
  desdeISO: string;
  diasVisibles: number;
}) {
  const router = useRouter();
  const desde = parseFechaISO(desdeISO) ?? hoy();

  const dias = useMemo(
    () => Array.from({ length: diasVisibles }, (_, i) => sumarDias(desde, i)),
    [desde, diasVisibles],
  );

  const reservasPorParcela = useMemo(() => {
    const mapa = new Map<number, ReservaTimelineDTO[]>();
    for (const reserva of reservas) {
      const lista = mapa.get(reserva.parcelaId) ?? [];
      lista.push(reserva);
      mapa.set(reserva.parcelaId, lista);
    }
    return mapa;
  }, [reservas]);

  const asignacionesPorFrigorifico = useMemo(() => {
    const mapa = new Map<number, AsignacionFrigorificoTimelineDTO[]>();
    for (const asignacion of asignacionesFrigorifico) {
      const lista = mapa.get(asignacion.frigorificoId) ?? [];
      lista.push(asignacion);
      mapa.set(asignacion.frigorificoId, lista);
    }
    return mapa;
  }, [asignacionesFrigorifico]);

  const columnaHoy = diferenciaEnNoches(desde, hoy());
  const filaDivisor = parcelas.length + 2;
  const filaFrigorificosInicio = filaDivisor + 1;
  const totalFilas = filaFrigorificosInicio + frigorificos.length - 1;

  function ir(fechaISO: string) {
    router.push(`/historico?desde=${fechaISO}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => ir(formatFechaISO(sumarDias(desde, -diasVisibles)))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          ← Anterior
        </button>
        <button
          type="button"
          onClick={() => ir(formatFechaISO(hoy()))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Hoy
        </button>
        <button
          type="button"
          onClick={() => ir(formatFechaISO(sumarDias(desde, diasVisibles)))}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          Siguiente →
        </button>
        <label className="ml-2 flex items-center gap-2 text-sm font-medium text-neutral-700">
          Desde
          <input
            type="date"
            value={desdeISO}
            onChange={(e) => e.target.value && ir(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border border-neutral-200">
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: `${ANCHO_COLUMNA_ETIQUETA} repeat(${diasVisibles}, ${ANCHO_COLUMNA_DIA})`,
            gridAutoRows: ALTO_FILA,
          }}
        >
          <div className="sticky top-0 left-0 z-20 border-b border-r border-neutral-200 bg-white" />
          {dias.map((dia, i) => (
            <div
              key={i}
              className="sticky top-0 z-10 flex flex-col items-center justify-center border-b border-neutral-200 bg-white py-1 text-[10px] leading-tight text-neutral-600"
              style={{ gridColumn: i + 2, gridRow: 1 }}
            >
              <span>{formatDiaSemanaCorto(dia)}</span>
              <span className="font-semibold">{formatFechaCorta(dia)}</span>
            </div>
          ))}

          {parcelas.map((parcela, indice) => (
            <div
              key={parcela.id}
              className={indice % 2 === 0 ? "bg-white" : "bg-neutral-50"}
              style={{ gridColumn: `1 / -1`, gridRow: indice + 2 }}
            />
          ))}

          {frigorificos.map((frigorifico, indice) => (
            <div
              key={frigorifico.id}
              className={indice % 2 === 0 ? "bg-white" : "bg-neutral-50"}
              style={{ gridColumn: `1 / -1`, gridRow: filaFrigorificosInicio + indice }}
            />
          ))}

          {columnaHoy >= 0 && columnaHoy < diasVisibles && (
            <div
              className="bg-blue-100/60"
              style={{ gridColumn: columnaHoy + 2, gridRow: `1 / ${totalFilas + 1}` }}
            />
          )}

          {dias.map((_, i) => (
            <div
              key={`separador-${i}`}
              className="border-r border-dashed border-neutral-300"
              style={{ gridColumn: i + 2, gridRow: `1 / ${totalFilas + 1}` }}
            />
          ))}

          <div
            className="flex items-center border-y border-neutral-300 bg-neutral-100 px-2 text-xs font-semibold text-neutral-600"
            style={{ gridColumn: "1 / -1", gridRow: filaDivisor }}
          >
            Frigoríficos
          </div>

          {parcelas.map((parcela, indice) => (
            <Link
              key={parcela.id}
              href={`/parcelas/${parcela.numero}`}
              className={`sticky left-0 z-10 flex items-center border-r border-b border-neutral-200 px-2 text-sm font-medium text-neutral-800 hover:underline ${
                indice % 2 === 0 ? "bg-white" : "bg-neutral-50"
              }`}
              style={{ gridColumn: 1, gridRow: indice + 2 }}
            >
              {parcela.numero}
            </Link>
          ))}

          {parcelas.map((parcela, indice) => {
            const fila = indice + 2;
            const reservasParcela = reservasPorParcela.get(parcela.id) ?? [];
            return reservasParcela.map((reserva) => {
              const entrada = parseFechaISO(reserva.fechaEntradaISO)!;
              const salida = parseFechaISO(reserva.fechaSalidaISO)!;
              const inicioCol = Math.max(0, diferenciaEnNoches(desde, entrada));
              const finCol = Math.min(diasVisibles, diferenciaEnNoches(desde, salida));
              if (finCol <= inicioCol) return null;

              const esFutura = entrada > hoy();
              const titulo = `${reserva.clienteNombre} · ${formatFechaCorta(entrada)} - ${formatFechaCorta(
                salida,
              )} · ${formatEUR(reserva.totalCentimos)}`;

              return (
                <div
                  key={reserva.id}
                  title={titulo}
                  className={`m-0.5 flex items-center truncate rounded px-1.5 text-xs font-medium ${
                    esFutura ? "bg-amber-400 text-amber-950" : "bg-red-500 text-white"
                  }`}
                  style={{ gridColumn: `${inicioCol + 2} / ${finCol + 2}`, gridRow: fila }}
                >
                  {reserva.clienteNombre}
                </div>
              );
            });
          })}

          {frigorificos.map((frigorifico, indice) => (
            <div
              key={frigorifico.id}
              className={`sticky left-0 z-10 flex items-center border-r border-b border-neutral-200 px-2 text-sm font-medium text-neutral-800 ${
                indice % 2 === 0 ? "bg-white" : "bg-neutral-50"
              }`}
              style={{ gridColumn: 1, gridRow: filaFrigorificosInicio + indice }}
            >
              F{frigorifico.numero}
            </div>
          ))}

          {frigorificos.map((frigorifico, indice) => {
            const fila = filaFrigorificosInicio + indice;
            const asignaciones = asignacionesPorFrigorifico.get(frigorifico.id) ?? [];
            return asignaciones.map((asignacion) => {
              const entrada = parseFechaISO(asignacion.fechaEntradaISO)!;
              const salida = parseFechaISO(asignacion.fechaSalidaISO)!;
              const inicioCol = Math.max(0, diferenciaEnNoches(desde, entrada));
              const finCol = Math.min(diasVisibles, diferenciaEnNoches(desde, salida));
              if (finCol <= inicioCol) return null;

              const esFutura = entrada > hoy();
              const titulo = `${asignacion.clienteNombre} (parcela ${asignacion.parcelaNumero}) · ${formatFechaCorta(
                entrada,
              )} - ${formatFechaCorta(salida)}`;

              return (
                <Link
                  key={asignacion.id}
                  href={`/parcelas/${asignacion.parcelaNumero}`}
                  title={titulo}
                  className={`m-0.5 flex items-center truncate rounded px-1.5 text-xs font-medium ${
                    esFutura ? "bg-amber-400 text-amber-950" : "bg-sky-500 text-white"
                  }`}
                  style={{ gridColumn: `${inicioCol + 2} / ${finCol + 2}`, gridRow: fila }}
                >
                  {asignacion.clienteNombre} · Parc. {asignacion.parcelaNumero}
                </Link>
              );
            });
          })}
        </div>
      </div>
    </div>
  );
}
