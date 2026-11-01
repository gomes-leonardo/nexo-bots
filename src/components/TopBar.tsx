import Link from 'next/link';
import Icon from './Icon';

/** Cabeçalho das telas de jogo: botão de voltar (ou fechar) + título. */
export default function TopBar({
  children, href = '/', onClose, end,
}: {
  children?: React.ReactNode;
  /** Para onde o botão de voltar leva. Ignorado se `onClose` existir. */
  href?: string;
  /** Mostra um X que chama esta função em vez do link de voltar. */
  onClose?: () => void;
  end?: React.ReactNode;
}) {
  return (
    <div className="topbar">
      {onClose ? (
        <button className="iconbtn" aria-label="Sair da rodada" onClick={onClose}><Icon name="close" size={20} /></button>
      ) : (
        <Link className="iconbtn" href={href} aria-label="Voltar para o início"><Icon name="back" size={22} /></Link>
      )}
      {children && <h1 className="topbar-title">{children}</h1>}
      {end && <div className="topbar-end">{end}</div>}
    </div>
  );
}
