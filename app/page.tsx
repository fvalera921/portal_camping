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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Mapa de parcelas</h1>
      <MapaParcelas parcelas={parcelas} fechaISO={formatFechaISO(fecha)} />
    </main>
  );
}
