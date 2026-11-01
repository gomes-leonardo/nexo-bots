import type { Metadata } from 'next';
import { quemEOJogadorService } from '@/server/modules/quem-e-o-jogador';
import QuemEOJogador from './QuemEOJogador';

export const metadata: Metadata = {
  title: 'Quem é o jogador?',
  appleWebApp: { title: 'Quem é o jogador' },
};

export default async function Page() {
  const cards = await quemEOJogadorService.getCards();
  return <QuemEOJogador cards={cards} />;
}
