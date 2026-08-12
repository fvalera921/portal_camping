"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatEUR } from "@/lib/dinero";
import type { EstadoParcela } from "@/lib/estadoParcela";

export type ReservaResumen = {
  id: number;
  fechaEntrada: string;
  fechaSalida: string;
  clienteNombre: string;
  clienteTelefono: string;
  totalCentimos: number;
  frigorifico: { numero: number; fechaEntrada: string; fechaSalida: string } | null;
};

export default function ReservaVigente({
  reserva,
  estadoParcela,
}: {
  reserva: ReservaResumen;
  estadoParcela: EstadoParcela;
}) {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cambiarEstado(accion: "checkout" | "cancelar") {
    setProcesando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/reservas/${reserva.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        setError(
          data?.error ?? (accion === "checkout" ? "No se pudo completar el checkout" : "No se pudo cancelar la reserva"),
        );
        return;
      }
      router.refresh();
    } finally {
      setProcesando(false);
    }
  }

  function hacerCancelacion() {
    if (window.confirm(`¿Cancelar la reserva de ${reserva.clienteNombre}? Esta acción no se puede deshacer.`)) {
      cambiarEstado("cancelar");
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <h2 className="text-lg font-semibold text-neutral-900">
        {estadoParcela === "OCUPADA" ? "Estancia en curso" : "Próxima reserva"}
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-neutral-500">Cliente</dt>
        <dd className="text-neutral-900">{reserva.clienteNombre}</dd>
        <dt className="text-neutral-500">Teléfono</dt>
        <dd className="text-neutral-900">{reserva.clienteTelefono}</dd>
        <dt className="text-neutral-500">Entrada</dt>
        <dd className="text-neutral-900">{reserva.fechaEntrada}</dd>
        <dt className="text-neutral-500">Salida</dt>
        <dd className="text-neutral-900">{reserva.fechaSalida}</dd>
        <dt className="text-neutral-500">Total</dt>
        <dd className="font-semibold text-neutral-900">{formatEUR(reserva.totalCentimos)}</dd>
        {reserva.frigorifico && (
          <>
            <dt className="text-neutral-500">Frigorífico</dt>
            <dd className="text-neutral-900">
              Nº {reserva.frigorifico.numero} ({reserva.frigorifico.fechaEntrada} –{" "}
              {reserva.frigorifico.fechaSalida})
            </dd>
          </>
        )}
      </dl>
      {estadoParcela === "OCUPADA" && (
        <button
          type="button"
          onClick={() => cambiarEstado("checkout")}
          disabled={procesando}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {procesando ? "Procesando..." : "Check-out (liberar parcela)"}
        </button>
      )}
      {estadoParcela === "RESERVADA" && (
        <button
          type="button"
          onClick={hacerCancelacion}
          disabled={procesando}
          className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-40"
        >
          {procesando ? "Procesando..." : "Cancelar reserva"}
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
