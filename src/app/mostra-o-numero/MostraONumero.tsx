'use client';

import { useEffect, useRef, useState } from 'react';
import Burst from '@/components/Burst';
import Icon from '@/components/Icon';
import TopBar from '@/components/TopBar';
import type { NumberCategory } from '@/server/modules/mostra-numero';
import { randomInRange, scoreGuess } from '@/shared/mostra-numero';
import s from './numero.module.css';

type Screen = 'setup' | 'secret' | 'mime' | 'guess' | 'result' | 'final';

interface Settings {
  names: string[];
  categories: string[];
  timer: number;
  rounds: number;
}

interface Turn {
  mimer: number;
  category: NumberCategory;
  secret: number;
  guess: number | null;
  points: number;
}

const DEFAULTS: Settings = { names: ['', ''], categories: ['temperatura', 'idade', 'nota', 'preco'], timer: 30, rounds: 2 };
const TIMERS: [number, string][] = [[0, 'Livre'], [20, '20s'], [30, '30s'], [45, '45s']];
const ROUNDS: [number, string][] = [[1, '1 volta'], [2, '2 voltas'], [3, '3 voltas']];
const POINTS_LABEL = ['Passou longe', 'Chegou perto', 'Quase!', 'Em cheio!'];

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const rnd = (n: number) => Math.floor(Math.random() * n);
const buzz = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch {} };
const fmtNum = (c: NumberCategory, n: number) => `${c.prefix ?? ''}${n}${c.suffix ?? ''}`;
const fmtRange = (c: NumberCategory) => `${c.prefix ?? ''}${c.min} a ${c.prefix ?? ''}${c.max}${c.suffix ?? ''}`;
const store = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem('numero.' + k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem('numero.' + k, JSON.stringify(v)); } catch {} },
};

function MimeTimer({ seconds, onEnd }: { seconds: number; onEnd: () => void }) {
  const [left, setLeft] = useState(seconds);
  const endRef = useRef(onEnd);
  useEffect(() => { endRef.current = onEnd; });
  useEffect(() => {
    if (left <= 0) { buzz([200, 100, 200]); endRef.current(); return; }
    const t = window.setTimeout(() => setLeft(l => l - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left]);
  const pct = (left / seconds) * 100;
  return (
    <div className={s.timer}>
      <span className={cx(s.timerNum, left <= 5 && s.timerLow)}>{left}</span>
      <span className={s.timerTrack}><span className={s.timerFill} style={{ width: `${pct}%` }} /></span>
    </div>
  );
}

export default function MostraONumero({ categories }: { categories: readonly NumberCategory[] }) {
  const [S, setS] = useState<Settings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('setup');
  const [err, setErr] = useState('');
  const [players, setPlayers] = useState<string[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [entry, setEntry] = useState('');
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    const saved = store.get<Partial<Settings>>('settings', {});
    setS({ ...DEFAULTS, ...saved, names: Array.isArray(saved.names) && saved.names.length >= 2 ? saved.names : DEFAULTS.names });
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) store.set('settings', S); }, [S, loaded]);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);

  const update = (patch: Partial<Settings>) => setS(prev => ({ ...prev, ...patch }));
  const finalNames = () => S.names.map((n, i) => n.trim() || 'Jogador ' + (i + 1));
  const turn = turns[turns.length - 1];
  const totalTurns = players.length * S.rounds;
  const leave = () => { if (confirm('Sair da partida?')) setScreen('setup'); };

  function newTurn(list: string[], done: Turn[]) {
    const pool = categories.filter(c => S.categories.includes(c.id));
    const category = pool[rnd(pool.length)];
    const t: Turn = { mimer: done.length % list.length, category, secret: randomInRange(category.min, category.max), guess: null, points: 0 };
    setTurns([...done, t]);
    setOpen(false); setSeen(false); setEntry('');
    setScreen('secret');
  }

  function start() {
    setErr('');
    const list = finalNames();
    const lower = list.map(n => n.toLowerCase());
    if (new Set(lower).size !== lower.length) return setErr('Tem dois jogadores com o mesmo nome. Troque um deles.');
    if (!S.categories.length) return setErr('Escolha pelo menos uma categoria.');
    setPlayers(list);
    newTurn(list, []);
  }

  function submitGuess() {
    if (!turn || entry === '') return;
    const guess = Number(entry);
    const { min, max } = turn.category;
    if (guess < min || guess > max) { setErr(`O palpite tem que ficar entre ${min} e ${max}.`); return; }
    setErr('');
    const points = scoreGuess(turn.secret, guess, min, max);
    setTurns(prev => [...prev.slice(0, -1), { ...turn, guess, points }]);
    if (points === 3) setBurst(b => b + 1);
    buzz(points === 3 ? [60, 40, 60] : 20);
    setScreen('result');
  }

  function next() {
    if (turns.length >= totalTurns) { setScreen('final'); setBurst(b => b + 1); return; }
    newTurn(players, turns);
  }

  const press = (k: string) => {
    if (k === 'del') return setEntry(e => e.slice(0, -1));
    setEntry(e => (e === '0' ? k : (e + k).slice(0, 3)));
  };

  /* ---------- Configuração ---------- */
  if (screen === 'setup') {
    return (
      <main className={s.main}>
        <TopBar><span className={s.a}>Mostra o</span> <span className={s.b}>número</span></TopBar>
        <p className={s.sub}>Mímica de número, sem falar e sem contar nos dedos. Quanto mais perto o palpite, mais pontos pra dupla.</p>

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
                {S.names.length > 2 && (
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
          <h2 className={s.h2}>Categorias</h2>
          <div className={s.chips}>
            {categories.map(c => {
              const on = S.categories.includes(c.id);
              return (
                <button key={c.id} className={cx(s.chip, on && s.on)} aria-pressed={on}
                  onClick={() => update({ categories: on ? S.categories.filter(x => x !== c.id) : [...S.categories, c.id] })}>
                  {c.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className={s.box}>
          <h2 className={s.h2}>Tempo de mímica</h2>
          <div className={s.seg} role="group" aria-label="Tempo de mímica">
            {TIMERS.map(([t, label]) => (
              <button key={t} className={cx(S.timer === t && s.on)} aria-pressed={S.timer === t} onClick={() => update({ timer: t })}>{label}</button>
            ))}
          </div>
          <h2 className={s.h2} style={{ marginTop: 16 }}>Duração</h2>
          <div className={s.seg} role="group" aria-label="Duração">
            {ROUNDS.map(([r, label]) => (
              <button key={r} className={cx(S.rounds === r && s.on)} aria-pressed={S.rounds === r} onClick={() => update({ rounds: r })}>{label}</button>
            ))}
          </div>
          <p className={s.note}>Cada volta, todo mundo faz a mímica uma vez.</p>
        </section>

        {err && <div className={s.err} role="alert">{err}</div>}
        <button className={cx(s.btn, s.hot, s.big)} onClick={start}>Começar</button>

        <details className={s.rules}>
          <summary>Como joga</summary>
          <ol>
            <li>Na sua vez, segure a tela pra ver o número secreto. Ninguém mais pode olhar.</li>
            <li>Faça a mímica do número: dance, faça cara, se mexa. Não vale falar nem mostrar com os dedos.</li>
            <li>Os outros combinam um palpite e digitam.</li>
            <li>Em cheio vale 3 pontos, quase vale 2, perto vale 1. Os pontos são da turma toda.</li>
          </ol>
        </details>
      </main>
    );
  }

  if (!turn) return null;
  const mimerName = players[turn.mimer];
  const c = turn.category;
  const progress = `Vez ${turns.length} de ${totalTurns}`;
  const team = turns.reduce((a, t) => a + t.points, 0);

  /* ---------- Número secreto ---------- */
  if (screen === 'secret') {
    const close = () => setOpen(false);
    const reveal = () => { setOpen(true); setSeen(true); buzz(15); };
    return (
      <main className={cx(s.main, s.full)}>
        <TopBar onClose={leave} end={<span className={s.count}>{progress}</span>} />
        <div className={s.turn}>
          <span className={s.step}>Vez de fazer a mímica</span>
          <span className={s.who}>{mimerName}</span>
          <span className={s.question}>Os outros, olhem pro outro lado.</span>
        </div>
        <div
          className={cx(s.secret, open && s.open)}
          role="button"
          tabIndex={0}
          aria-label="Segure para ver o número secreto"
          onPointerDown={e => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} reveal(); }}
          onPointerUp={close}
          onPointerCancel={close}
          onLostPointerCapture={close}
          onContextMenu={e => e.preventDefault()}
          onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reveal(); } }}
          onKeyUp={close}
        >
          <div className={s.cover}><Icon name="eye" size={44} /><span>Só {mimerName} pode olhar.<br />Segure aqui pra ver.</span></div>
          <div className={s.content}>
            <span className={s.kicker}>{c.name}</span>
            <span className={s.bigNum}>{fmtNum(c, turn.secret)}</span>
            <span className={s.tag}>de {fmtRange(c)}</span>
          </div>
        </div>
        <p className={s.holdHint}><Icon name="hand" size={18} />Solte o dedo e o número some</p>
        <button className={cx(s.btn, s.go, s.big, s.pushDown)} disabled={!seen} onClick={() => setScreen('mime')}>Decorei, começar a mímica</button>
      </main>
    );
  }

  /* ---------- Mímica ---------- */
  if (screen === 'mime') {
    return (
      <main className={cx(s.main, s.full)}>
        <TopBar onClose={leave} end={<span className={s.count}>{progress}</span>} />
        <div className={s.turn}>
          <span className={s.step}>{mimerName} está mostrando</span>
          <span className={s.who}>{c.name}</span>
          <span className={s.question}>{c.prompt}</span>
        </div>
        <div className={s.range}>
          <span>{(c.prefix ?? '') + c.min}</span>
          <span className={s.rangeLine} aria-hidden="true" />
          <span>{fmtNum(c, c.max)}</span>
        </div>
        <ul className={s.dont}>
          <li><Icon name="close" size={18} />Sem falar</li>
          <li><Icon name="close" size={18} />Sem contar nos dedos</li>
          <li><Icon name="check" size={18} />Vale dançar, fazer cara e se mexer</li>
        </ul>
        <div className={s.pushDown}>
          {S.timer > 0 && <MimeTimer key={turns.length} seconds={S.timer} onEnd={() => setScreen('guess')} />}
          <button className={cx(s.btn, s.hot, s.big)} onClick={() => setScreen('guess')}>Já sabemos, dar palpite</button>
        </div>
      </main>
    );
  }

  /* ---------- Palpite ---------- */
  if (screen === 'guess') {
    return (
      <main className={cx(s.main, s.full)}>
        <TopBar onClose={leave} end={<span className={s.count}>{progress}</span>} />
        <div className={s.turn}>
          <span className={s.step}>Palpite da turma · {c.name}</span>
          <span className={s.display} aria-live="polite">{entry === '' ? '–' : fmtNum(c, Number(entry))}</span>
          <span className={s.question}>De {fmtRange(c)}</span>
        </div>
        {err && <div className={s.err} role="alert">{err}</div>}
        <div className={s.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(k => (
            <button key={k} className={s.key} onClick={() => press(k)}>{k}</button>
          ))}
          <span />
          <button className={s.key} onClick={() => press('0')}>0</button>
          <button className={s.key} aria-label="Apagar" onClick={() => press('del')}><Icon name="backspace" size={24} /></button>
        </div>
        <button className={cx(s.btn, s.hot, s.big, s.pushDown)} disabled={entry === ''} onClick={submitGuess}>Confirmar palpite</button>
      </main>
    );
  }

  /* ---------- Resultado da vez ---------- */
  if (screen === 'result') {
    const diff = Math.abs(turn.secret - (turn.guess ?? 0));
    return (
      <main className={cx(s.main, s.full)}>
        <span className={s.badge}>{progress}</span>
        <h1 className={s.headline}>{POINTS_LABEL[turn.points]}</h1>
        <p className={s.sub} style={{ marginTop: 0 }}>
          {turn.points === 3 ? `${mimerName} mandou muito bem.` : `Errou por ${diff}. ${turn.points ? `Vale ${turn.points} ${turn.points === 1 ? 'ponto' : 'pontos'}.` : 'Sem pontos dessa vez.'}`}
        </p>
        <div className={s.cards}>
          <div className={s.card}><small>Número</small><strong>{fmtNum(c, turn.secret)}</strong><span>{c.name}</span></div>
          <div className={cx(s.card, s.cardDark)}><small>Palpite</small><strong>{fmtNum(c, turn.guess ?? 0)}</strong><span>+{turn.points} {turn.points === 1 ? 'ponto' : 'pontos'}</span></div>
        </div>
        <div className={s.meter} aria-hidden="true">
          {[0, 1, 2, 3].map(i => <span key={i} className={cx(i < turn.points && s.meterOn)} />)}
        </div>
        <section className={s.box}>
          <div className={s.boxHead}>
            <h2 className={s.h2}>Pontos da turma</h2>
            <span className={s.teamScore}>{team}</span>
          </div>
          <p className={s.note} style={{ margin: 0 }}>de {totalTurns * 3} possíveis</p>
        </section>
        <button className={cx(s.btn, s.hot, s.big, s.pushDown)} onClick={next}>
          {turns.length >= totalTurns ? 'Ver resultado final' : `Próximo: ${players[turns.length % players.length]}`}
        </button>
        <Burst trigger={burst} />
      </main>
    );
  }

  /* ---------- Final ---------- */
  const max = totalTurns * 3;
  const pct = Math.round((team / max) * 100);
  const verdict = pct >= 75 ? 'Sintonia total' : pct >= 50 ? 'Mandaram bem' : pct >= 25 ? 'Dá pra melhorar' : 'Precisam treinar';
  const byMimer = players.map((nm, i) => ({ nm, pts: turns.filter(t => t.mimer === i).reduce((a, t) => a + t.points, 0) }))
    .sort((a, b) => b.pts - a.pts);
  return (
    <main className={s.main}>
      <span className={s.badge}>Fim de jogo</span>
      <h1 className={s.headline}>{verdict}</h1>
      <p className={s.sub} style={{ marginTop: 0 }}>A turma fez {team} de {max} pontos.</p>
      <div className={s.bigScore}>
        <span>{pct}%</span>
        <span className={s.timerTrack}><span className={s.timerFill} style={{ width: `${pct}%` }} /></span>
      </div>
      <section className={s.box}>
        <h2 className={s.h2}>Melhor mímica</h2>
        <ol className={s.rank}>
          {byMimer.map(({ nm, pts }, i) => (
            <li key={nm}>
              <span className={cx(s.pos, i === 0 && s.posFirst)}>{i + 1}</span>
              <span className={s.rankName}>{nm}</span>
              <span className={s.pts}>{pts}</span>
            </li>
          ))}
        </ol>
      </section>
      <div className={s.stack}>
        <button className={cx(s.btn, s.hot, s.big)} onClick={() => newTurn(players, [])}>Jogar de novo</button>
        <button className={s.btn} onClick={() => setScreen('setup')}>Mudar jogadores ou categorias</button>
      </div>
      <Burst trigger={burst} />
    </main>
  );
}
