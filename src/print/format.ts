export function fmt(n: number): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

export function fmtQty(n: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n)
}
