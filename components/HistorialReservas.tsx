import { formatEUR } from "@/lib/dinero";

export type ReservaHistorial = {
  id: number;
  fechaEntrada: string;
  fechaSalida: string;
  clienteNombre: string;
  estado: string;
  totalCentimos: number;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  CONFIRMADA: "Confirmada",
  EN_CURSO: "En curso",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export default function HistorialReservas({ reservas }: { reservas: ReservaHistorial[] }) {
  if (reservas.length === 0) {
    return <p className="text-sm text-neutral-500">Sin reservas registradas para esta parcela.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-500">
          <tr>
            <th className="px-3 py-2 font-medium">Cliente</th>
            <th className="px-3 py-2 font-medium">Entrada</th>
            <th className="px-3 py-2 font-medium">Salida</th>
            <th className="px-3 py-2 font-medium">Estado</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {reservas.map((reserva) => (
            <tr key={reserva.id}>
              <td className="px-3 py-2 text-neutral-900">{reserva.clienteNombre}</td>
              <td className="px-3 py-2 text-neutral-700">{reserva.fechaEntrada}</td>
              <td className="px-3 py-2 text-neutral-700">{reserva.fechaSalida}</td>
              <td className="px-3 py-2 text-neutral-700">
                {ETIQUETA_ESTADO[reserva.estado] ?? reserva.estado}
              </td>
              <td className="px-3 py-2 text-right font-medium text-neutral-900">
                {formatEUR(reserva.totalCentimos)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
