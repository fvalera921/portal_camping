import { memo, useMemo } from "react";
import type { ParcelaConEstado } from "@/lib/estadoParcela";

function ContadoresOcupacion({ parcelas }: { parcelas: ParcelaConEstado[] }) {
  const { libres, ocupadas, reservadas, porcentajeOcupacion } = useMemo(() => {
    const conteo = parcelas.reduce(
      (acc, p) => {
        acc[p.estado] += 1;
        return acc;
      },
      { LIBRE: 0, OCUPADA: 0, RESERVADA: 0 },
    );
    const totalParcelas = parcelas.length;
    return {
      libres: conteo.LIBRE,
      ocupadas: conteo.OCUPADA,
      reservadas: conteo.RESERVADA,
      porcentajeOcupacion: totalParcelas === 0 ? 0 : Math.round((conteo.OCUPADA / totalParcelas) * 100),
    };
  }, [parcelas]);

  return (
    <dl className="flex flex-wrap gap-3 text-sm">
      <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2">
        <dt className="text-emerald-700">Libres</dt>
        <dd className="text-lg font-semibold text-emerald-900">{libres}</dd>
      </div>
      <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2">
        <dt className="text-red-700">Ocupadas</dt>
        <dd className="text-lg font-semibold text-red-900">{ocupadas}</dd>
      </div>
      <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2">
        <dt className="text-amber-700">Reservadas</dt>
        <dd className="text-lg font-semibold text-amber-900">{reservadas}</dd>
      </div>
      <div className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2">
        <dt className="text-neutral-700">% ocupación</dt>
        <dd className="text-lg font-semibold text-neutral-900">{porcentajeOcupacion}%</dd>
      </div>
    </dl>
  );
}

export default memo(ContadoresOcupacion);
