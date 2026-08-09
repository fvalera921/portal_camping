const formateador = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatEUR(centimos: number): string {
  return formateador.format(centimos / 100);
}

export function eurosACentimos(euros: number): number {
  return Math.round(euros * 100);
}
