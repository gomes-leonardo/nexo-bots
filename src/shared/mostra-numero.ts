/** Código usado tanto no navegador quanto no servidor. Sem dependências de servidor aqui. */
/**
 * Pontuação do Mostra o número. Função pura, usada no cliente e no servidor.
 * 3 = acertou em cheio · 2 = errou por até 5% da faixa · 1 = até 15% · 0 = longe.
 */
export function scoreGuess(secret: number, guess: number, min: number, max: number): number {
  const diff = Math.abs(secret - guess);
  if (diff === 0) return 3;
  const span = Math.max(1, max - min);
  const ratio = diff / span;
  if (ratio <= 0.05) return 2;
  if (ratio <= 0.15) return 1;
  return 0;
}

export function randomInRange(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}
