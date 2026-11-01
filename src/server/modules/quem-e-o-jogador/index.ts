import { CLUBS, FOOTBALLERS } from './data';
import type { Club, FootballerCard } from './types';

const clubById = new Map(CLUBS.map(c => [c.id, c]));

export const quemEOJogadorService = {
  /** Jogadores com os clubes resolvidos. Lança erro se algum clube não existir. */
  async getCards(): Promise<FootballerCard[]> {
    return FOOTBALLERS.map(f => ({
      id: f.id,
      name: f.name,
      br: f.br,
      clubs: f.clubs.map(id => {
        const club = clubById.get(id);
        if (!club) throw new Error(`Clube desconhecido "${id}" em ${f.id}`);
        return club as Club;
      }),
    }));
  },

  /** Números públicos, sem revelar respostas. */
  async getStats() {
    return { players: FOOTBALLERS.length, brazil: FOOTBALLERS.filter(f => f.br).length, clubs: CLUBS.length };
  },
};

export type { Club, FootballerCard } from './types';
