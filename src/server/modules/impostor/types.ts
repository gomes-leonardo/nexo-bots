export type WordPair = readonly [string, string];

export interface Theme {
  id: string;
  name: string;
  /** Pares de palavras parecidas. A primeira vai pros inocentes ou pro impostor, sorteado a cada rodada. */
  pairs: readonly WordPair[];
}

export interface ThemeSummary {
  id: string;
  name: string;
  count: number;
}
