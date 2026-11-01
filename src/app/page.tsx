import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import s from './home.module.css';

const GAMES: { href: string; icon: IconName; name: string; desc: string; tags: string[]; color: string; isNew?: boolean }[] = [
  {
    href: '/mostra-o-numero',
    icon: 'thermo',
    name: 'Mostra o número',
    desc: 'Mímica de número, o hit do TikTok. Sem falar, sem dedos.',
    tags: ['2+ pessoas', 'Ótimo em dupla'],
    color: 'var(--label)',
    isNew: true,
  },
  {
    href: '/quem-e-o-jogador',
    icon: 'shield',
    name: 'Quem é o jogador?',
    desc: 'Adivinhe o craque pelos clubes. Menos clubes, mais pontos.',
    tags: ['1+ pessoas', 'Futebol'],
    color: 'var(--accent)',
    isNew: true,
  },
  {
    href: '/fala-ao-contrario',
    icon: 'swap',
    name: 'Fala ao contrário',
    desc: 'Grave, escute de trás pra frente e tente imitar.',
    tags: ['2+ pessoas', 'Microfone'],
    color: 'var(--tape)',
  },
  {
    href: '/impostor',
    icon: 'eyeOff',
    name: 'Impostor',
    desc: 'Todo mundo tem a mesma palavra, menos um.',
    tags: ['3 a 12 pessoas', 'Modo dupla'],
    color: 'var(--mint)',
  },
];

export default function Home() {
  return (
    <main className={s.main}>
      <header className={s.header}>
        <span className={s.eyebrow}>Jogos de festa</span>
        <h1 className={s.title}><span className={s.a}>Bora</span><br /><span className={s.b}>jogar</span></h1>
        <p className={s.sub}>Um celular, a turma toda. Escolha o jogo e passe pra frente.</p>
      </header>
      <nav aria-label="Jogos">
        <ul className={s.list}>
          {GAMES.map(g => (
            <li key={g.href}>
              <Link href={g.href} className={s.card}>
                <span className={s.icon} style={{ background: g.color }} aria-hidden="true"><Icon name={g.icon} size={32} /></span>
                <span className={s.body}>
                  <span className={s.name}>{g.name}{g.isNew && <span className={s.new}>Novo</span>}</span>
                  <span className={s.desc}>{g.desc}</span>
                  <span className={s.tags}>{g.tags.map(t => <span key={t}>{t}</span>)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <p className={s.foot}>Sem login. Seus placares ficam no seu celular.</p>
    </main>
  );
}
