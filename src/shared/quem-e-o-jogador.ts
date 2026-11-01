/** Código usado tanto no navegador quanto no servidor. */

/** Acertou vendo 2 clubes = 3 pontos, 3 clubes = 2, 4 clubes = 1. */
export function pointsForClubsShown(shown: number): number {
  return Math.max(1, 5 - Math.max(2, shown));
}
