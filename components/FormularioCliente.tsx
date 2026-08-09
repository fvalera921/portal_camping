"use client";

export type DatosCliente = {
  nombre: string;
  documento: string;
  telefono: string;
  email: string;
  matricula: string;
};

export default function FormularioCliente({
  datos,
  onCambiar,
}: {
  datos: DatosCliente;
  onCambiar: (campo: keyof DatosCliente, valor: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Nombre *
        <input
          required
          value={datos.nombre}
          onChange={(e) => onCambiar("nombre", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        DNI / Pasaporte *
        <input
          required
          value={datos.documento}
          onChange={(e) => onCambiar("documento", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Teléfono *
        <input
          required
          value={datos.telefono}
          onChange={(e) => onCambiar("telefono", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Email
        <input
          type="email"
          value={datos.email}
          onChange={(e) => onCambiar("email", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-neutral-700">
        Matrícula
        <input
          value={datos.matricula}
          onChange={(e) => onCambiar("matricula", e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
      </label>
    </div>
  );
}
