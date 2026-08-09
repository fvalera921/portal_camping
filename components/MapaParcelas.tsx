"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ParcelaConEstado } from "@/lib/estadoParcela";
import ContadoresOcupacion from "@/components/ContadoresOcupacion";
import FiltrosMapa, {
  type FiltroElectricidad,
  type FiltroEstado,
  type FiltroTipo,
} from "@/components/FiltrosMapa";
import SelectorFechaMapa from "@/components/SelectorFechaMapa";
import ParcelaCelda from "@/components/ParcelaCelda";

export default function MapaParcelas({
  parcelas,
  fechaISO,
}: {
  parcelas: ParcelaConEstado[];
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

  function cambiarFecha(nuevaFechaISO: string) {
    router.push(`/?fecha=${nuevaFechaISO}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SelectorFechaMapa fechaISO={fechaISO} onCambiar={cambiarFecha} />
        <ContadoresOcupacion parcelas={parcelas} />
      </div>

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

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {parcelasFiltradas.map((parcela) => (
          <ParcelaCelda key={parcela.id} parcela={parcela} />
        ))}
      </div>
    </div>
  );
}
