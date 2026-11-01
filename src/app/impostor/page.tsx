import type { Metadata } from 'next';
import { impostorService } from '@/server/modules/impostor';
import Impostor from './Impostor';

export const metadata: Metadata = {
  title: 'Impostor',
  appleWebApp: { title: 'Impostor' },
};

export default async function Page() {
  const themes = await impostorService.getThemes();
  return <Impostor themes={themes} />;
}
