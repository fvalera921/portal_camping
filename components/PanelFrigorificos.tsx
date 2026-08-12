import Link from "next/link";
import type { FrigorificoConEstado } from "@/lib/frigorificos";
import { formatFechaCorta } from "@/lib/fechas";

export default function PanelFrigorificos({
  frigorificos,
  fechaISO,
}: {
  frigorificos: FrigorificoConEstado[];
  fechaISO: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-neutral-700">Frigoríficos</h2>
      <div className="flex flex-wrap gap-2">
        {frigorificos.map((frigorifico) => {
          const ocupacion = frigorifico.ocupacion;
          const titulo = ocupacion
            ? `Frigorífico ${frigorifico.numero}, ocupado por la parcela ${ocupacion.parcelaNumero} (${
                ocupacion.clienteNombre
              }), del ${formatFechaCorta(ocupacion.fechaEntrada)} al ${formatFechaCorta(
                ocupacion.fechaSalida,
              )}`
            : `Frigorífico ${frigorifico.numero}, libre`;

          const clases = `flex h-14 w-14 flex-col items-center justify-center rounded-md border-2 text-center transition ${
            frigorifico.disponible
              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
              : "border-red-500 bg-red-50 text-red-900 hover:brightness-95"
          }`;

          if (!ocupacion) {
            return (
              <div key={frigorifico.id} title={titulo} className={clases}>
                <span className="text-sm font-bold">{frigorifico.numero}</span>
                <span className="text-[10px] leading-none">Libre</span>
              </div>
            );
          }

          return (
            <Link
              key={frigorifico.id}
              href={`/parcelas/${ocupacion.parcelaNumero}?fecha=${fechaISO}`}
              title={titulo}
              className={clases}
            >
              <span className="text-sm font-bold">{frigorifico.numero}</span>
              <span className="text-[10px] leading-none">Parc. {ocupacion.parcelaNumero}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
