'use client';

import { useEffect, useState } from 'react';
import Burst from '@/components/Burst';
import Icon from '@/components/Icon';
import TopBar from '@/components/TopBar';
import type { Club, FootballerCard } from '@/server/modules/quem-e-o-jogador';
import { pointsForClubsShown } from '@/shared/quem-e-o-jogador';
import s from './jogador.module.css';

type Screen = 'setup' | 'clue' | 'answer' | 'final';
type Pool = 'todos' | 'brasil' | 'mundo';

interface Settings { names: string[]; pool: Pool; rounds: number }
interface Result { card: FootballerCard; shown: number; winner: string | null; points: number }

const DEFAULTS: Settings = { names: ['', ''], pool: 'todos', rounds: 10 };
const POOLS: [Pool, string][] = [['todos', 'Todos'], ['brasil', 'Passou pelo Brasil'], ['mundo', 'Só gringos']];
const ROUNDS: [number, string][] = [[5, '5'], [10, '10'], [15, '15']];

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const buzz = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch {} };
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const store = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem('jogador.' + k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem('jogador.' + k, JSON.stringify(v)); } catch {} },
};

/** Texto escuro ou claro, conforme a cor de fundo. */
function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#1F2A44' : '#FFFFFF';
}

/** Escudo genérico nas cores do clube (não é o escudo oficial). */
function Badge({ club, size = 56 }: { club: Club; size?: number }) {
  const [main, second] = club.colors;
  const id = `b-${club.id}`;
  return (
    <svg width={size} height={size * 1.14} viewBox="0 0 56 64" role="img" aria-label={club.name} style={{ flex: 'none' }}>
      <defs>
        <clipPath id={id}><path d="M28 2l24 8v20c0 15-10.5 27-24 32C14.5 57 4 45 4 30V10z" /></clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect width="56" height="64" fill={main} />
        <path d="M56 0v64H36L56 0z" fill={second} />
        <rect y="40" width="56" height="4" fill={second} opacity=".9" />
      </g>
      <path d="M28 2l24 8v20c0 15-10.5 27-24 32C14.5 57 4 45 4 30V10z" fill="none" stroke="#1F2A44" strokeOpacity=".25" strokeWidth="2" />
      <text x="25" y="33" textAnchor="middle" fontFamily="Bungee, Rubik, sans-serif" fontSize={club.short.length > 2 ? 13 : 16}
        fill={textOn(main)}>{club.short}</text>
    </svg>
  );
}

export default function QuemEOJogador({ cards }: { cards: FootballerCard[] }) {
  const [S, setS] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('setup');
  const [err, setErr] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [deck, setDeck] = useState<FootballerCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(2);
  const [results, setResults] = useState<Result[]>([]);
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    const saved = store.get<Partial<Settings>>('settings', {});
    setS({ ...DEFAULTS, ...saved, names: Array.isArray(saved.names) && saved.names.length ? saved.names : DEFAULTS.names });
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) store.set('settings', S); }, [S, loaded]);
  useEffect(() => { window.scrollTo(0, 0); }, [screen, idx]);

  const update = (patch: Partial<Settings>) => setS(prev => ({ ...prev, ...patch }));
  const pool = cards.filter(c => S.pool === 'todos' || (S.pool === 'brasil' ? c.br : !c.br));
  const leave = () => { if (confirm('Sair da partida?')) setScreen('setup'); };

  function start() {
    setErr('');
    const list = S.names.map((n, i) => n.trim() || 'Jogador ' + (i + 1));
    const lower = list.map(n => n.toLowerCase());
    if (new Set(lower).size !== lower.length) return setErr('Tem dois jogadores com o mesmo nome. Troque um deles.');
    if (!pool.length) return setErr('Nenhum jogador nesse filtro.');
    // Evita repetir jogadores entre partidas enquanto houver novos
    const seen = new Set(store.get<string[]>('seen', []));
    let fresh = pool.filter(c => !seen.has(c.id));
    if (fresh.length < Math.min(S.rounds, pool.length)) { fresh = pool; store.set('seen', []); }
    const d = shuffle(fresh).slice(0, S.rounds);
    store.set('seen', [...(fresh === pool ? [] : seen), ...d.map(c => c.id)]);
    setPlayers(list); setDeck(d); setIdx(0); setShown(2); setResults([]);
    setScreen('clue');
  }

  function award(winner: string | null) {
    const card = deck[idx];
    const points = winner ? pointsForClubsShown(shown) : 0;
    const next = [...results, { card, shown, winner, points }];
    setResults(next);
    if (winner) { setBurst(b => b + 1); buzz([40, 30, 40]); }
    if (idx + 1 >= deck.length) { setScreen('final'); return; }
    setIdx(idx + 1); setShown(2); setScreen('clue');
  }

  const scoreOf = (nm: string) => results.filter(r => r.winner === nm).reduce((a, r) => a + r.points, 0);

  /* ---------- Configuração ---------- */
  if (screen === 'setup') {
    return (
      <main className={s.main}>
        <TopBar><span className={s.a}>Quem é o</span> <span className={s.b}>jogador?</span></TopBar>
        <p className={s.sub}>Os clubes aparecem um por um. Quem acertar primeiro com menos clubes ganha mais pontos.</p>

        <div className={s.howto}>
          <div><Badge club={{ id: 'demo1', name: 'Clube', short: '2', colors: ['#FF5C8A', '#1F2A44'] }} size={34} /><span><b>3 pontos</b> com 2 clubes</span></div>
          <div><Badge club={{ id: 'demo2', name: 'Clube', short: '3', colors: ['#FFD23F', '#1F2A44'] }} size={34} /><span><b>2 pontos</b> com 3 clubes</span></div>
          <div><Badge club={{ id: 'demo3', name: 'Clube', short: '4', colors: ['#3FD1C4', '#1F2A44'] }} size={34} /><span><b>1 ponto</b> com 4 clubes</span></div>
        </div>

        <section className={s.box}>
          <div className={s.boxHead}>
            <h2 className={s.h2}>Jogadores</h2>
            <span className={s.count}>{S.names.length} de 12</span>
          </div>
          <div className={s.names}>
            {S.names.map((n, i) => (
              <div className={s.nameRow} key={i}>
                <input value={n} placeholder={'Jogador ' + (i + 1)} maxLength={18} autoComplete="off" aria-label={'Nome do jogador ' + (i + 1)}
                  onChange={e => { const next = [...S.names]; next[i] = e.target.value; update({ names: next }); }} />
                {S.names.length > 1 && (
                  <button className={s.x} aria-label={'Remover jogador ' + (i + 1)} onClick={() => update({ names: S.names.filter((_, j) => j !== i) })}>
                    <Icon name="close" size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          {S.names.length < 12 && (
            <button className={s.add} onClick={() => update({ names: [...S.names, ''] })}><Icon name="plus" size={16} />Adicionar jogador</button>
          )}
        </section>

        <section className={s.box}>
          <h2 className={s.h2}>Quais jogadores</h2>
          <div className={s.chips}>
            {POOLS.map(([p, label]) => (
              <button key={p} className={cx(s.chip, S.pool === p && s.on)} aria-pressed={S.pool === p} onClick={() => update({ pool: p })}>{label}</button>
            ))}
          </div>
          <h2 className={s.h2} style={{ marginTop: 16 }}>Rodadas</h2>
          <div className={s.seg} role="group" aria-label="Rodadas">
            {ROUNDS.map(([r, label]) => (
              <button key={r} className={cx(S.rounds === r && s.on)} aria-pressed={S.rounds === r} onClick={() => update({ rounds: r })}>{label}</button>
            ))}
          </div>
          <p className={s.note}>{pool.length} jogadores nesse filtro.</p>
        </section>

        {err && <div className={s.err} role="alert">{err}</div>}
        <button className={cx(s.btn, s.hot, s.big)} onClick={start}>Começar</button>
        <p className={s.disclaimer}>Escudos ilustrativos nas cores dos clubes. Não são os escudos oficiais.</p>
      </main>
    );
  }

  /* ---------- Final ---------- */
  if (screen === 'final') {
    const ranked = players.map(nm => ({ nm, pts: scoreOf(nm), hits: results.filter(r => r.winner === nm).length }))
      .sort((a, b) => b.pts - a.pts);
    const missed = results.filter(r => !r.winner).length;
    return (
      <main className={s.main}>
        <span className={s.badge}>Fim de jogo</span>
        <h1 className={s.headline}>{ranked.length > 1 && ranked[0].pts > 0 ? `${ranked[0].nm} venceu!` : 'Fim de jogo'}</h1>
        <p className={s.sub} style={{ marginTop: 0 }}>{results.length} jogadores · {missed ? `${missed} ninguém acertou` : 'todos acertados'}</p>
        <section className={s.box}>
          <h2 className={s.h2}>Placar</h2>
          <ol className={s.rank}>
            {ranked.map(({ nm, pts, hits }, i) => (
              <li key={nm}>
                <span className={cx(s.pos, i === 0 && s.posFirst)}>{i + 1}</span>
                <span className={s.rankName}>{nm} <span className={s.muted}>· {hits} {hits === 1 ? 'acerto' : 'acertos'}</span></span>
                <span className={s.pts}>{pts}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className={s.box}>
          <h2 className={s.h2}>Respostas</h2>
          <ul className={s.answers}>
            {results.map(r => (
              <li key={r.card.id}>
                <span className={s.miniBadges}>{r.card.clubs.slice(0, r.shown).map(c => <Badge key={c.id} club={c} size={22} />)}</span>
                <span className={s.rankName}>{r.card.name}</span>
                <span className={s.muted}>{r.winner ? `${r.winner} +${r.points}` : 'ninguém'}</span>
              </li>
            ))}
          </ul>
        </section>
        <div className={s.stack}>
          <button className={cx(s.btn, s.hot, s.big)} onClick={start}>Jogar de novo</button>
          <button className={s.btn} onClick={() => setScreen('setup')}>Mudar jogadores</button>
        </div>
        <Burst trigger={burst} />
      </main>
    );
  }

  const card = deck[idx];
  if (!card) return null;
  const max = card.clubs.length;
  const pts = pointsForClubsShown(shown);
  const progress = `Jogador ${idx + 1} de ${deck.length}`;

  /* ---------- Pista ---------- */
  if (screen === 'clue') {
    return (
      <main className={cx(s.main, s.full)}>
        <TopBar onClose={leave} end={<span className={s.count}>{progress}</span>} />
        <div className={s.turn}>
          <span className={s.step}>Quem jogou nesses clubes?</span>
          <span className={s.pill}>Vale {pts} {pts === 1 ? 'ponto' : 'pontos'}</span>
        </div>
        <ol className={s.path}>
          {Array.from({ length: 4 }, (_, i) => {
            const club = card.clubs[i];
            if (i >= max) return null;
            const visible = i < shown;
            return (
              <li key={i} className={cx(s.stop, !visible && s.stopHidden)}>
                <span className={s.stopNum}>{i + 1}</span>
                {visible && club ? (
                  <><Badge club={club} size={52} /><span className={s.clubName}>{club.name}</span></>
                ) : (
                  <><span className={s.mystery} aria-hidden="true">?</span><span className={s.clubName}>Clube escondido</span></>
                )}
              </li>
            );
          })}
        </ol>
        <p className={s.note} style={{ textAlign: 'center' }}>Em ordem de carreira. Falem em voz alta!</p>
        <div className={cx(s.stack, s.pushDown)}>
          {shown < max && (
            <button className={s.btn} onClick={() => { setShown(shown + 1); buzz(15); }}>
              Mostrar mais um clube (vale {pointsForClubsShown(shown + 1)})
            </button>
          )}
          <button className={cx(s.btn, s.hot, s.big)} onClick={() => setScreen('answer')}>Revelar resposta</button>
        </div>
        <Burst trigger={burst} />
      </main>
    );
  }

  /* ---------- Resposta ---------- */
  return (
    <main className={cx(s.main, s.full)}>
      <TopBar onClose={leave} end={<span className={s.count}>{progress}</span>} />
      <div className={s.reveal}>
        <span className={s.kicker}>Era</span>
        <span className={s.answerName}>{card.name}</span>
        <span className={s.revealClubs}>
          {card.clubs.map((c, i) => (
            <span key={c.id} className={cx(s.revealClub, i >= shown && s.revealExtra)}>
              <Badge club={c} size={30} />{c.name}
            </span>
          ))}
        </span>
      </div>
      <h2 className={s.h2} style={{ textAlign: 'center' }}>Quem acertou primeiro? <span className={s.muted}>(+{pts})</span></h2>
      <div className={s.opts}>
        {players.map(nm => (
          <button key={nm} className={s.optBtn} onClick={() => award(nm)}>
            <span className={s.optLabel}>{nm}</span>
            <span className={s.muted}>{scoreOf(nm)} pts</span>
          </button>
        ))}
        <button className={cx(s.optBtn, s.none)} onClick={() => award(null)}>Ninguém acertou</button>
      </div>
      <Burst trigger={burst} />
    </main>
  );
}
