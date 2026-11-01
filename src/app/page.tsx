import Link from 'next/link';
import Icon, { type IconName } from '@/components/Icon';
import s from './home.module.css';

const GAMES = [
  {
    href: '/fala-ao-contrario',
    icon: 'swap' as IconName,
    name: 'Fala ao contrário',
    desc: 'Grave uma frase, escute de trás pra frente e tente imitar.',
    who: '1 celular · 2+ pessoas · usa o microfone',
    color: 'var(--tape)',
  },
  {
    href: '/impostor',
    icon: 'eyeOff' as IconName,
    name: 'Impostor',
    desc: 'Todo mundo tem a mesma palavra, menos um. Descubram quem é.',
    who: '1 celular · 3 a 12 pessoas, ou modo dupla',
    color: 'var(--accent)',
  },
];

export default function Home() {
  return (
    <main className={s.main}>
      <h1 className={s.title}>
        <span className={s.a}>Bora</span> <span className={s.b}>jogar</span>
      </h1>
      <p className={s.sub}>Joguinhos de festa pra jogar num celular só.</p>
      <ul className={s.list}>
        {GAMES.map(g => (
          <li key={g.href}>
            <Link href={g.href} className={s.card} style={{ ['--c' as string]: g.color }}>
              <span className={s.icon} aria-hidden="true"><Icon name={g.icon} size={30} /></span>
              <span>
                <strong className={s.name}>{g.name}</strong>
                <span className={s.desc}>{g.desc}</span>
                <span className={s.who}>{g.who}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
