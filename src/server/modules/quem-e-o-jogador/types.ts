export interface Club {
  id: string;
  name: string;
  /** Sigla de até 3 letras mostrada no escudo. */
  short: string;
  /** Cor principal e secundária do escudo genérico (não é o escudo oficial). */
  colors: readonly [string, string];
}

export interface Footballer {
  id: string;
  name: string;
  /** Clubes em ordem cronológica (2 a 4). São revelados nessa ordem. */
  clubs: readonly string[];
  /** Jogou em algum clube brasileiro. */
  br: boolean;
}

/** Jogador com os clubes já resolvidos, pronto pra tela. */
export interface FootballerCard {
  id: string;
  name: string;
  br: boolean;
  clubs: Club[];
}
