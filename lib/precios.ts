export function calcularSubtotalCentimos(
  cantidad: number,
  precioUnitarioCentimos: number,
  noches: number,
): number {
  return cantidad * precioUnitarioCentimos * noches;
}

export function calcularTotalCentimos(lineas: { subtotalCentimos: number }[]): number {
  return lineas.reduce((total, linea) => total + linea.subtotalCentimos, 0);
}
