import type { Metadata } from 'next';
import FalaAoContrario from './FalaAoContrario';

export const metadata: Metadata = {
  title: 'Fala ao contrário',
  appleWebApp: { title: 'Ao Contrário' },
};

export default function Page() {
  return <FalaAoContrario />;
}
