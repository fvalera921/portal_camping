import Link from "next/link";
import MapaParcelas from "@/components/MapaParcelas";
import { obtenerParcelasConEstado } from "@/lib/estadoParcela";
import { formatFechaISO, hoy, parseFechaISO } from "@/lib/fechas";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  const params = await searchParams;
  const fecha = (params.fecha && parseFechaISO(params.fecha)) || hoy();
  const parcelas = await obtenerParcelasConEstado(fecha);

  return (
    <main className="w-full px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-neutral-900">Mapa de parcelas</h1>
        <Link href="/historico" className="text-sm text-neutral-500 hover:underline">
          Ver histórico de reservas →
        </Link>
      </div>
      <MapaParcelas parcelas={parcelas} fechaISO={formatFechaISO(fecha)} />
    </main>
  );
}
