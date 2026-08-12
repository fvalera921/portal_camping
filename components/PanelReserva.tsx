"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SelectorFechas from "@/components/SelectorFechas";
import SelectorTemporada from "@/components/SelectorTemporada";
import ListaConceptos, { type Tarifa } from "@/components/ListaConceptos";
import FormularioCliente, { type DatosCliente } from "@/components/FormularioCliente";
import SelectorFrigorifico, { type FrigorificoDisponibilidad } from "@/components/SelectorFrigorifico";
import { formatEUR } from "@/lib/dinero";
import { calcularSubtotalCentimos, calcularTotalCentimos } from "@/lib/precios";
import { diferenciaEnNoches, formatFechaISO, parseFechaISO } from "@/lib/fechas";
import { sugerirTemporada } from "@/lib/temporada";
import type { Temporada } from "@/app/generated/prisma/enums";

const CONCEPTO_FRIGORIFICO = "FRIGORIFICO";

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

  const [frigorificoActivo, setFrigorificoActivo] = useState(false);
  const [frigorificoNumero, setFrigorificoNumero] = useState<number | null>(null);
  const [frigorificoEntradaISO, setFrigorificoEntradaISO] = useState(fechaEntradaISO);
  const [frigorificoSalidaISO, setFrigorificoSalidaISO] = useState(fechaSalidaISO);
  const [disponibilidadFrigorificos, setDisponibilidadFrigorificos] = useState<FrigorificoDisponibilidad[]>([]);
  const [frigorificoError, setFrigorificoError] = useState(false);

  const tarifasSinFrigorifico = useMemo(
    () => tarifas.filter((tarifa) => tarifa.concepto !== CONCEPTO_FRIGORIFICO),
    [tarifas],
  );
  const tarifaFrigorifico = useMemo(
    () => tarifas.find((tarifa) => tarifa.concepto === CONCEPTO_FRIGORIFICO) ?? null,
    [tarifas],
  );

  const fechaEntrada = parseFechaISO(fechaEntradaISO);
  const fechaSalida = parseFechaISO(fechaSalidaISO);
  const fechasValidas = Boolean(fechaEntrada && fechaSalida && fechaSalida > fechaEntrada);
  const noches = fechaEntrada && fechaSalida ? diferenciaEnNoches(fechaEntrada, fechaSalida) : 0;

  const nochesFrigorifico = useMemo(() => {
    const entrada = parseFechaISO(frigorificoEntradaISO);
    const salida = parseFechaISO(frigorificoSalidaISO);
    return entrada && salida && salida > entrada ? diferenciaEnNoches(entrada, salida) : 0;
  }, [frigorificoEntradaISO, frigorificoSalidaISO]);

  // Mientras las fechas del frigorifico no sean validas no hay nada que consultar; se muestra
  // como "sin disponibilidad" derivandolo aqui en vez de resetear el estado desde un efecto.
  const disponibilidadEfectiva = useMemo(
    () => (nochesFrigorifico > 0 ? disponibilidadFrigorificos : []),
    [nochesFrigorifico, disponibilidadFrigorificos],
  );

  // El numero que el usuario pulso puede haber dejado de estar disponible (p.ej. otra reserva
  // lo ocupo, o el rango de fechas cambio). Se deriva en vez de "corregir" el estado con un
  // efecto: si ya no es valido, simplemente se trata como si no hubiera seleccion.
  const frigorificoNumeroValido = useMemo(() => {
    if (frigorificoNumero === null) return null;
    const seleccionado = disponibilidadEfectiva.find((f) => f.numero === frigorificoNumero);
    return seleccionado?.disponible ? frigorificoNumero : null;
  }, [frigorificoNumero, disponibilidadEfectiva]);

  useEffect(() => {
    if (nochesFrigorifico <= 0) return;
    let cancelado = false;
    fetch(`/api/frigorificos?fechaEntrada=${frigorificoEntradaISO}&fechaSalida=${frigorificoSalidaISO}`)
      .then((respuesta) => {
        if (!respuesta.ok) throw new Error("No se pudo consultar la disponibilidad");
        return respuesta.json();
      })
      .then((data) => {
        if (cancelado) return;
        setDisponibilidadFrigorificos(data.frigorificos ?? []);
        setFrigorificoError(false);
      })
      .catch(() => {
        if (!cancelado) {
          setDisponibilidadFrigorificos([]);
          setFrigorificoError(true);
        }
      });
    return () => {
      cancelado = true;
    };
  }, [frigorificoEntradaISO, frigorificoSalidaISO, nochesFrigorifico]);

  function actualizarTemporadaSugerida(entradaISO: string, salidaISO: string) {
    if (temporadaEditadaManualmente) return;
    const entrada = parseFechaISO(entradaISO);
    const salida = parseFechaISO(salidaISO);
    if (entrada && salida && salida > entrada) {
      setTemporada(sugerirTemporada(entrada, salida));
    }
  }

  // El rango del frigorifico por defecto sigue al de la parcela; si el usuario ya lo habia
  // acotado manualmente, se recorta aqui mismo para seguir cabiendo dentro del nuevo rango.
  function cambiarFechaEntrada(valor: string) {
    setFechaEntradaISO(valor);
    actualizarTemporadaSugerida(valor, fechaSalidaISO);
    setFrigorificoEntradaISO((actual) => (actual < valor ? valor : actual));
  }

  function cambiarFechaSalida(valor: string) {
    setFechaSalidaISO(valor);
    actualizarTemporadaSugerida(fechaEntradaISO, valor);
    setFrigorificoSalidaISO((actual) => (actual > valor ? valor : actual));
  }

  function cambiarTemporada(valor: Temporada) {
    setTemporadaEditadaManualmente(true);
    setTemporada(valor);
  }

  const lineas = useMemo(() => {
    return tarifasSinFrigorifico
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
  }, [tarifasSinFrigorifico, cantidades, temporada, noches]);

  const precioUnitarioFrigorificoCentimos = tarifaFrigorifico
    ? temporada === "ALTA"
      ? tarifaFrigorifico.precioAltaCentimos
      : tarifaFrigorifico.precioBajaCentimos
    : null;

  const lineaFrigorifico = useMemo(() => {
    if (!frigorificoActivo || frigorificoNumeroValido === null || precioUnitarioFrigorificoCentimos === null) {
      return null;
    }
    if (nochesFrigorifico <= 0) return null;
    return {
      concepto: CONCEPTO_FRIGORIFICO,
      cantidad: 1,
      precioUnitarioCentimos: precioUnitarioFrigorificoCentimos,
      subtotalCentimos: calcularSubtotalCentimos(1, precioUnitarioFrigorificoCentimos, nochesFrigorifico),
    };
  }, [frigorificoActivo, frigorificoNumeroValido, precioUnitarioFrigorificoCentimos, nochesFrigorifico]);

  const totalCentimos = calcularTotalCentimos(lineaFrigorifico ? [...lineas, lineaFrigorifico] : lineas);

  const frigorificoValido = !frigorificoActivo || lineaFrigorifico !== null;

  const puedeEnviar =
    fechasValidas &&
    lineas.length > 0 &&
    frigorificoValido &&
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
          frigorifico:
            frigorificoActivo && frigorificoNumeroValido !== null
              ? {
                  numero: frigorificoNumeroValido,
                  fechaEntrada: frigorificoEntradaISO,
                  fechaSalida: frigorificoSalidaISO,
                }
              : null,
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
        tarifas={tarifasSinFrigorifico}
        temporada={temporada}
        noches={noches}
        cantidades={cantidades}
        onCambiarCantidad={(concepto, cantidad) =>
          setCantidades((prev) => ({ ...prev, [concepto]: cantidad }))
        }
      />

      <SelectorFrigorifico
        activo={frigorificoActivo}
        onActivoChange={(valor) => {
          setFrigorificoActivo(valor);
          if (!valor) setFrigorificoNumero(null);
        }}
        numero={frigorificoNumeroValido}
        onNumeroChange={setFrigorificoNumero}
        fechaEntradaISO={frigorificoEntradaISO}
        fechaSalidaISO={frigorificoSalidaISO}
        onCambiarFechaEntrada={setFrigorificoEntradaISO}
        onCambiarFechaSalida={setFrigorificoSalidaISO}
        fechaEntradaMinISO={fechaEntradaISO}
        fechaSalidaMaxISO={fechaSalidaISO}
        disponibilidad={disponibilidadEfectiva}
        error={frigorificoError}
        precioUnitarioCentimos={precioUnitarioFrigorificoCentimos}
        noches={nochesFrigorifico}
        subtotalCentimos={lineaFrigorifico?.subtotalCentimos ?? 0}
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
