import { impostorRepository } from './impostor.repository';
import type { Theme, ThemeSummary } from './types';

export const impostorService = {
  /** Temas completos, com as palavras. Usado pela página do jogo. */
  async getThemes(): Promise<readonly Theme[]> {
    return impostorRepository.listThemes();
  },

  /** Lista resumida, sem as palavras (para a API pública não entregar o jogo). */
  async getThemeSummaries(): Promise<ThemeSummary[]> {
    const themes = await impostorRepository.listThemes();
    return themes.map(({ id, icon, name, pairs }) => ({ id, icon, name, count: pairs.length }));
  },
};
