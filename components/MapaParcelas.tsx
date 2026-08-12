"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ParcelaConEstado } from "@/lib/estadoParcela";
import type { FrigorificoConEstado } from "@/lib/frigorificos";
import ContadoresOcupacion from "@/components/ContadoresOcupacion";
import FiltrosMapa, {
  type FiltroElectricidad,
  type FiltroEstado,
  type FiltroTipo,
} from "@/components/FiltrosMapa";
import SelectorFechaMapa from "@/components/SelectorFechaMapa";
import ParcelaCelda from "@/components/ParcelaCelda";
import PanelFrigorificos from "@/components/PanelFrigorificos";
import { GRID_TEMPLATE_COLUMNAS, generarLayoutMapa } from "@/lib/mapaLayout";

const LAYOUT_MAPA = generarLayoutMapa();

export default function MapaParcelas({
  parcelas,
  frigorificos,
  fechaISO,
}: {
  parcelas: ParcelaConEstado[];
  frigorificos: FrigorificoConEstado[];
  fechaISO: string;
}) {
  const router = useRouter();
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("TODOS");
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>("TODOS");
  const [filtroElectricidad, setFiltroElectricidad] = useState<FiltroElectricidad>("TODOS");

  const parcelasFiltradas = useMemo(
    () =>
      parcelas.filter((p) => {
        if (filtroEstado !== "TODOS" && p.estado !== filtroEstado) return false;
        if (filtroTipo !== "TODOS" && p.tipo !== filtroTipo) return false;
        if (filtroElectricidad === "CON" && !p.tieneElectricidad) return false;
        if (filtroElectricidad === "SIN" && p.tieneElectricidad) return false;
        return true;
      }),
    [parcelas, filtroEstado, filtroTipo, filtroElectricidad],
  );

  const parcelaPorNumero = useMemo(() => new Map(parcelas.map((p) => [p.numero, p])), [parcelas]);
  const numerosVisibles = useMemo(
    () => new Set(parcelasFiltradas.map((p) => p.numero)),
    [parcelasFiltradas],
  );

  function cambiarFecha(nuevaFechaISO: string) {
    router.push(`/?fecha=${nuevaFechaISO}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SelectorFechaMapa fechaISO={fechaISO} onCambiar={cambiarFecha} />
        <ContadoresOcupacion parcelas={parcelas} />
      </div>

      <PanelFrigorificos frigorificos={frigorificos} fechaISO={fechaISO} />

      <FiltrosMapa
        filtroEstado={filtroEstado}
        onFiltroEstadoChange={setFiltroEstado}
        filtroTipo={filtroTipo}
        onFiltroTipoChange={setFiltroTipo}
        filtroElectricidad={filtroElectricidad}
        onFiltroElectricidadChange={setFiltroElectricidad}
      />

      <p className="text-sm text-neutral-500">
        Mostrando {parcelasFiltradas.length} de {parcelas.length} parcelas
      </p>

      <div className="grid gap-2" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNAS }}>
        {LAYOUT_MAPA.map(({ numero, fila, columnaGrid }) => {
          const parcela = parcelaPorNumero.get(numero);
          if (!parcela) return null;
          return (
            <div
              key={numero}
              style={{ gridRow: fila, gridColumn: columnaGrid }}
              className={numerosVisibles.has(numero) ? undefined : "invisible"}
            >
              <ParcelaCelda parcela={parcela} fechaISO={fechaISO} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
