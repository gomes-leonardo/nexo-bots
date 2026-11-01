import { THEMES } from './themes';
import type { Theme } from './types';

/**
 * Acesso aos temas. Hoje lê da lista fixa em `themes.ts`.
 * Quando houver banco, troque a implementação aqui (ex.: buscar em `db`)
 * sem mudar quem usa o repositório.
 */
export const impostorRepository = {
  async listThemes(): Promise<readonly Theme[]> {
    return THEMES;
  },

  async findTheme(id: string): Promise<Theme | undefined> {
    return THEMES.find(t => t.id === id);
  },
};
