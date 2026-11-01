import { CATEGORIES } from './categories';
import type { NumberCategory } from './types';

export const mostraNumeroService = {
  async getCategories(): Promise<readonly NumberCategory[]> {
    return CATEGORIES;
  },
};

export { scoreGuess, randomInRange } from '@/shared/mostra-numero';
export type { NumberCategory } from './types';
