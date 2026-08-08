export function roundTo(n: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(n * factor) / factor
}

export function roundTo1(n: number): number {
  return roundTo(n, 1)
}

/** Polish decimal comma, wrapped for KaTeX so it doesn't get list-separator spacing. */
export function formatNumberTex(n: number, decimals = 1): string {
  return String(roundTo(n, decimals)).replace('.', '{,}')
}
