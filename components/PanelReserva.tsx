"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SelectorFechas from "@/components/SelectorFechas";
import SelectorTemporada from "@/components/SelectorTemporada";
import ListaConceptos, { type Tarifa } from "@/components/ListaConceptos";
import FormularioCliente, { type DatosCliente } from "@/components/FormularioCliente";
import { formatEUR } from "@/lib/dinero";
import { calcularSubtotalCentimos, calcularTotalCentimos } from "@/lib/precios";
import { diferenciaEnNoches, formatFechaISO, parseFechaISO } from "@/lib/fechas";
import { sugerirTemporada } from "@/lib/temporada";
import type { Temporada } from "@/app/generated/prisma/enums";

export default function PanelReserva({
  parcelaId,
  tarifas,
  fechaInicialISO,
}: {
  parcelaId: number;
  tarifas: Tarifa[];
  fechaInicialISO: string;
}) {
  const router = useRouter();

  const [fechaEntradaISO, setFechaEntradaISO] = useState(fechaInicialISO);
  const [fechaSalidaISO, setFechaSalidaISO] = useState(() => {
    const salida = parseFechaISO(fechaInicialISO) ?? new Date();
    salida.setDate(salida.getDate() + 1);
    return formatFechaISO(salida);
  });
  const [temporada, setTemporada] = useState<Temporada>(() => {
    const entrada = parseFechaISO(fechaEntradaISO);
    const salida = parseFechaISO(fechaSalidaISO);
    return entrada && salida ? sugerirTemporada(entrada, salida) : "BAJA";
  });
  const [temporadaEditadaManualmente, setTemporadaEditadaManualmente] = useState(false);
  const [cantidades, setCantidades] = useState<Record<string, number>>({});
  const [datosCliente, setDatosCliente] = useState<DatosCliente>({
    nombre: "",
    documento: "",
    telefono: "",
    email: "",
    matricula: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fechaEntrada = parseFechaISO(fechaEntradaISO);
  const fechaSalida = parseFechaISO(fechaSalidaISO);
  const fechasValidas = Boolean(fechaEntrada && fechaSalida && fechaSalida > fechaEntrada);
  const noches = fechaEntrada && fechaSalida ? diferenciaEnNoches(fechaEntrada, fechaSalida) : 0;

  function actualizarTemporadaSugerida(entradaISO: string, salidaISO: string) {
    if (temporadaEditadaManualmente) return;
    const entrada = parseFechaISO(entradaISO);
    const salida = parseFechaISO(salidaISO);
    if (entrada && salida && salida > entrada) {
      setTemporada(sugerirTemporada(entrada, salida));
    }
  }

  function cambiarFechaEntrada(valor: string) {
    setFechaEntradaISO(valor);
    actualizarTemporadaSugerida(valor, fechaSalidaISO);
  }

  function cambiarFechaSalida(valor: string) {
    setFechaSalidaISO(valor);
    actualizarTemporadaSugerida(fechaEntradaISO, valor);
  }

  function cambiarTemporada(valor: Temporada) {
    setTemporadaEditadaManualmente(true);
    setTemporada(valor);
  }

  const lineas = useMemo(() => {
    return tarifas
      .map((tarifa) => {
        const cantidad = cantidades[tarifa.concepto] ?? 0;
        if (cantidad <= 0) return null;
        const precioUnitarioCentimos =
          temporada === "ALTA" ? tarifa.precioAltaCentimos : tarifa.precioBajaCentimos;
        return {
          concepto: tarifa.concepto,
          cantidad,
          precioUnitarioCentimos,
          subtotalCentimos: calcularSubtotalCentimos(cantidad, precioUnitarioCentimos, Math.max(noches, 0)),
        };
      })
      .filter((linea): linea is NonNullable<typeof linea> => linea !== null);
  }, [tarifas, cantidades, temporada, noches]);

  const totalCentimos = calcularTotalCentimos(lineas);

  const puedeEnviar =
    fechasValidas &&
    lineas.length > 0 &&
    datosCliente.nombre.trim() !== "" &&
    datosCliente.documento.trim() !== "" &&
    datosCliente.telefono.trim() !== "" &&
    !enviando;

  async function confirmarReserva() {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parcelaId,
          fechaEntrada: fechaEntradaISO,
          fechaSalida: fechaSalidaISO,
          temporada,
          cliente: {
            nombre: datosCliente.nombre,
            documento: datosCliente.documento,
            telefono: datosCliente.telefono,
            email: datosCliente.email || undefined,
            matricula: datosCliente.matricula || undefined,
          },
          lineas: lineas.map((linea) => ({ concepto: linea.concepto, cantidad: linea.cantidad })),
        }),
      });
      if (!respuesta.ok) {
        const data = await respuesta.json().catch(() => null);
        setError(data?.error ?? "No se pudo crear la reserva");
        return;
      }
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="space-y-5 rounded-lg border border-neutral-200 p-4">
      <h2 className="text-lg font-semibold text-neutral-900">Nueva reserva</h2>

      <SelectorFechas
        fechaEntradaISO={fechaEntradaISO}
        fechaSalidaISO={fechaSalidaISO}
        onCambiarEntrada={cambiarFechaEntrada}
        onCambiarSalida={cambiarFechaSalida}
        noches={noches}
      />

      <SelectorTemporada temporada={temporada} onCambiar={cambiarTemporada} />

      <ListaConceptos
        tarifas={tarifas}
        temporada={temporada}
        noches={noches}
        cantidades={cantidades}
        onCambiarCantidad={(concepto, cantidad) =>
          setCantidades((prev) => ({ ...prev, [concepto]: cantidad }))
        }
      />

      <FormularioCliente
        datos={datosCliente}
        onCambiar={(campo, valor) => setDatosCliente((prev) => ({ ...prev, [campo]: valor }))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 pt-4">
        <p className="text-lg font-bold text-neutral-900">Total: {formatEUR(totalCentimos)}</p>
        <button
          type="button"
          onClick={confirmarReserva}
          disabled={!puedeEnviar}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {enviando ? "Confirmando..." : "Confirmar reserva"}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
