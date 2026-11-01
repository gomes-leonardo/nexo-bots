import type { Metadata } from 'next';
import { mostraNumeroService } from '@/server/modules/mostra-numero';
import MostraONumero from './MostraONumero';

export const metadata: Metadata = {
  title: 'Mostra o número',
  appleWebApp: { title: 'Mostra o número' },
};

export default async function Page() {
  const categories = await mostraNumeroService.getCategories();
  return <MostraONumero categories={categories} />;
}
