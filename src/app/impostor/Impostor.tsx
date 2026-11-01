'use client';

import { useEffect, useRef, useState } from 'react';
import Burst from '@/components/Burst';
import Icon from '@/components/Icon';
import TopBar from '@/components/TopBar';
import type { Theme } from '@/server/modules/impostor';
import s from './impostor.module.css';

/* ---------- Tipos ---------- */
type Mode = 'grupo' | 'dupla';
type Screen = 'setup' | 'reveal' | 'talk' | 'vote' | 'result';
type Vote = number | 'none' | 'igual' | 'diferente';

interface Settings {
  mode: Mode;
  names: string[];
  themes: string[];
  custom: string;
  hint: boolean;
  similar: boolean;
  chaos: boolean;
  timer: number;
}

interface Pair { a: string; b: string; theme: string }

interface Round {
  mode: Mode;
  names: string[];
  pair: Pair;
  /** Dupla: as duas palavras são iguais? */
  same: boolean;
  /** Dupla: palavra de cada jogador. */
  words: string[];
  /** Grupo: índices dos impostores. */
  imp: number[];
  similar: boolean;
  hint: boolean;
  chaos: boolean;
  starter: number;
  votes: Vote[];
}

interface Outcome { head: string; sub: string; gains: Record<string, number> }

const DEFAULTS: Settings = {
  mode: 'grupo', names: ['', '', '', ''], themes: ['comida', 'lugares', 'animais'],
  custom: '', hint: true, similar: false, chaos: false, timer: 90,
};
const TIMERS: [number, string][] = [[0, 'Livre'], [60, '1 min'], [90, '1:30'], [120, '2 min']];

/* ---------- Utilitários ---------- */
const rnd = (n: number) => Math.floor(Math.random() * n);
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const fmt = (sec: number) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
const buzz = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch {} };
const store = {
  get<T>(k: string, d: T): T {
    try { const v = localStorage.getItem('impostor.' + k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem('impostor.' + k, JSON.stringify(v)); } catch {} },
};

function customWords(text: string) {
  const seen = new Set<string>(), out: string[] = [];
  text.split(/[\n,;]+/).map(w => w.trim()).filter(Boolean).forEach(w => {
    const k = w.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push(w); }
  });
  return out;
}

function buildPool(themes: readonly Theme[], S: Settings): Pair[] {
  const p: Pair[] = [];
  themes.forEach(t => { if (S.themes.includes(t.id)) t.pairs.forEach(([a, b]) => p.push({ a, b, theme: t.name })); });
  if (S.themes.includes('custom')) {
    const ws = customWords(S.custom);
    if (ws.length >= 2) ws.forEach(w => {
      const others = ws.filter(x => x !== w);
      p.push({ a: w, b: others[rnd(others.length)], theme: 'Personalizado' });
    });
  }
  return p;
}

/* ---------- Timer da conversa ---------- */
function TalkTimer({ seconds }: { seconds: number }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft(l => {
        if (l <= 1) { setRunning(false); buzz([200, 100, 200]); return 0; }
        return l - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const ended = left === 0;
  const label = running ? 'Pausar' : ended ? 'De novo' : left === seconds ? 'Iniciar tempo' : 'Continuar';
  const icon = running ? 'pause' : ended ? 'restart' : 'play';
  return (
    <>
      <div className={cx(s.clock, ended && s.clockEnd)}>{ended ? 'Tempo!' : fmt(left)}</div>
      <button
        className={cx(s.btn, s.alt)}
        onClick={() => {
          if (running) { setRunning(false); return; }
          if (ended) setLeft(seconds);
          setRunning(true);
        }}
      >
        <Icon name={icon} size={18} />{label}
      </button>
    </>
  );
}

/* ---------- Jogo ---------- */
export default function Impostor({ themes }: { themes: readonly Theme[] }) {
  const [S, setS] = useState<Settings>(DEFAULTS);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [screen, setScreen] = useState<Screen>('setup');
  const [err, setErr] = useState('');
  const [R, setR] = useState<Round | null>(null);
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const [optsShown, setOptsShown] = useState(false);
  const [guessFor, setGuessFor] = useState<{ name: string; imps: string[]; innocents: string[] } | null>(null);
  const [wordShown, setWordShown] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [burst, setBurst] = useState(0);
  const [resetDone, setResetDone] = useState(false);
  const [picked, setPicked] = useState<Vote | null>(null);
  const [roundNo, setRoundNo] = useState(0);
  const used = useRef(new Set<string>());
  const errRef = useRef<HTMLDivElement>(null);

  // Carrega configurações e placar salvos no aparelho
  useEffect(() => {
    const saved = store.get<Partial<Settings>>('settings', {});
    setS({ ...DEFAULTS, ...saved, names: Array.isArray(saved.names) ? saved.names : DEFAULTS.names });
    setScores(store.get('scores', {}));
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) store.set('settings', S); }, [S, loaded]);
  useEffect(() => { if (loaded) store.set('scores', scores); }, [scores, loaded]);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  useEffect(() => { if (err) errRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [err]);

  const update = (patch: Partial<Settings>) => setS(prev => ({ ...prev, ...patch }));
  const minPlayers = S.mode === 'dupla' ? 2 : 3;
  const maxPlayers = S.mode === 'dupla' ? 2 : 12;
  const names = S.names.length >= minPlayers ? S.names : [...S.names, ...Array(minPlayers - S.names.length).fill('')];
  const shown = S.mode === 'dupla' ? names.slice(0, 2) : names;
  const finalNames = () => shown.map((n, i) => n.trim() || 'Jogador ' + (i + 1));

  /* ----- Início da rodada ----- */
  function pickPair(): Pair {
    const pool = buildPool(themes, S);
    let free = pool.filter(x => !used.current.has(x.a) && !used.current.has(x.b));
    if (!free.length) { used.current.clear(); free = pool; }
    const x = free[rnd(free.length)];
    used.current.add(x.a); used.current.add(x.b);
    return Math.random() < .5 ? x : { a: x.b, b: x.a, theme: x.theme };
  }

  function start() {
    setErr('');
    const list = finalNames();
    const lower = list.map(n => n.toLowerCase());
    if (new Set(lower).size !== lower.length) return setErr('Tem dois jogadores com o mesmo nome. Troque um deles.');
    if (!S.themes.length) return setErr('Escolha pelo menos um tema.');
    if (S.themes.length === 1 && S.themes[0] === 'custom' && customWords(S.custom).length < 2)
      return setErr('No tema personalizado, escreva pelo menos 2 palavras.');
    if (!buildPool(themes, S).length) return setErr('Escolha pelo menos um tema com palavras.');
    newRound(list);
  }

  function newRound(list = R?.names ?? finalNames()) {
    const pair = pickPair();
    const n = list.length;
    let imp: number[] = [];
    let same = false, words: string[] = [];
    if (S.mode === 'dupla') {
      same = Math.random() < .5;
      words = same ? [pair.a, pair.a] : shuffle([pair.a, pair.b]);
    } else {
      let k = 1;
      if (S.chaos) { const r = Math.random(); if (r < .12) k = 0; else if (r < .35 && n >= 5) k = 2; }
      imp = shuffle([...Array(n).keys()]).slice(0, k);
    }
    setR({
      mode: S.mode, names: list, pair, same, words, imp,
      similar: S.similar, hint: S.hint, chaos: S.chaos, starter: rnd(n), votes: [],
    });
    setIdx(0); setOpen(false); setSeen(false); setOptsShown(false);
    setGuessFor(null); setOutcome(null); setWordShown(false);
    setPicked(null);
    setRoundNo(x => x + 1);
    setScreen('reveal');
  }

  /* ----- Votação e resultado ----- */
  function finish(round: Round, o: Outcome) {
    setScores(prev => {
      const next = { ...prev };
      Object.entries(o.gains).forEach(([n, p]) => { next[n] = (next[n] || 0) + p; });
      return next;
    });
    setR(round);
    setOutcome(o);
    setGuessFor(null);
    setScreen('result');
    setBurst(b => b + 1);
  }

  function resolve(round: Round) {
    const g: Record<string, number> = {};
    const { names: ns, votes } = round;
    if (round.mode === 'dupla') {
      ns.forEach((n, i) => { if ((votes[i] === 'igual') === round.same) g[n] = 1; });
      const hits = Object.keys(g);
      return finish(round, {
        head: round.same ? 'Eram iguais!' : 'Eram diferentes!',
        sub: hits.length === 2 ? 'Os dois acertaram. Sintonia total.' : hits.length === 1 ? hits[0] + ' acertou.' : 'Ninguém acertou. Blefe de mestre!',
        gains: g,
      });
    }

    const tally = new Map<Vote, number>();
    votes.forEach(v => tally.set(v, (tally.get(v) || 0) + 1));
    const entries = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    const tie = entries.length > 1 && entries[1][1] === entries[0][1];
    const top = tie ? null : entries[0][0];
    const imps = round.imp.map(i => ns[i]);
    const innocents = ns.filter((_, i) => !round.imp.includes(i));

    if (!round.imp.length) {
      ns.forEach((n, i) => { if (votes[i] === 'none') g[n] = 1; });
      return finish(round, {
        head: top === 'none' ? 'Não tinha impostor! Vocês sacaram.' : 'Pegadinha: não tinha impostor!',
        sub: 'Quem votou em “ninguém” ganha 1 ponto.', gains: g,
      });
    }
    if (top === null) {
      imps.forEach(n => { g[n] = 2; });
      return finish(round, { head: 'Empate! O impostor escapou.', sub: 'Votação empatada, ninguém foi eliminado.', gains: g });
    }
    if (top === 'none') {
      imps.forEach(n => { g[n] = 2; });
      return finish(round, { head: 'Tinha impostor sim!', sub: 'A maioria achou que não tinha ninguém.', gains: g });
    }
    const accused = top as number;
    if (!round.imp.includes(accused)) {
      imps.forEach(n => { g[n] = 2; });
      return finish(round, { head: 'O impostor venceu!', sub: `Vocês votaram em ${ns[accused]}, que era inocente.`, gains: g });
    }
    // Impostor pego: última chance de adivinhar a palavra
    setR(round);
    setGuessFor({ name: ns[accused], imps, innocents });
    setOutcome(null);
    setWordShown(false);
    setScreen('result');
  }

  function castVote(v: Vote) {
    if (!R) return;
    buzz(15);
    const votes = [...R.votes];
    votes[idx] = v;
    const round = { ...R, votes };
    if (idx + 1 < R.names.length) {
      setR(round); setIdx(idx + 1); setOptsShown(false); setPicked(null);
    } else {
      resolve(round);
    }
  }

  function settleGuess(hit: boolean) {
    if (!R || !guessFor) return;
    const g: Record<string, number> = {};
    if (hit) {
      guessFor.imps.forEach(n => { g[n] = 1; });
      finish(R, { head: 'Virou o jogo!', sub: `${guessFor.name} foi pego, mas acertou a palavra.`, gains: g });
    } else {
      guessFor.innocents.forEach(n => { g[n] = 1; });
      finish(R, { head: 'Os inocentes venceram!', sub: `${guessFor.name} era o impostor e não acertou a palavra.`, gains: g });
    }
  }

  /* ----- Telas ----- */
  const leave = () => {
    if (screen !== 'result' && !confirm('Sair desta rodada?')) return;
    setScreen('setup');
  };
  const initial = (n: string) => n.trim().charAt(0).toUpperCase() || '?';
  const AVATAR = ['var(--tape)', 'var(--mint)', 'var(--label)'];

  if (screen === 'setup') {
    const rules = S.mode === 'dupla' ? [
      'Cada um vê uma palavra em segredo, passando o celular.',
      'O jogo sorteia se as duas palavras são iguais ou só parecidas (tipo “praia” e “piscina”).',
      'Conversem dando pistas sobre a sua palavra, sem falar ela.',
      'Cada um vota escondido: “somos iguais” ou “somos diferentes”. Quem acertar ganha 1 ponto.',
    ] : [
      'Passe o celular: cada um segura o dedo na tela pra ver a palavra secreta.',
      'Todo mundo recebe a mesma palavra, menos o impostor.',
      'Em roda, cada um fala uma pista curta sobre a palavra, sem entregar demais.',
      'Votem escondido em quem parece o impostor.',
      'Pegaram o impostor? Ele ainda pode adivinhar a palavra pra virar o jogo.',
      'Pontos: impostor que escapa ganha 2. Se for pego, cada inocente ganha 1, ou ele ganha 1 se adivinhar a palavra.',
    ];
    const chips = [...themes.map(t => ({ id: t.id, label: t.name })), { id: 'custom', label: 'Personalizado' }];

    return (
      <main className={s.main}>
        <TopBar><span className={s.a}>Impos</span><span className={s.b}>tor</span></TopBar>
        <p className={s.sub}>Um celular, várias pessoas, alguém mentindo.</p>

        <div className={s.seg} role="group" aria-label="Modo de jogo">
          {(['grupo', 'dupla'] as Mode[]).map(m => (
            <button key={m} className={cx(S.mode === m && s.on)} aria-pressed={S.mode === m} onClick={() => { setErr(''); update({ mode: m }); }}>
              <Icon name={m === 'grupo' ? 'users' : 'pair'} size={18} />{m === 'grupo' ? 'Grupo' : 'Dupla'}
            </button>
          ))}
        </div>

        <section className={s.box}>
          <div className={s.boxHead}>
            <h2 className={s.h2}>Jogadores</h2>
            {S.mode === 'grupo' && <span className={s.count}>{names.length} de {maxPlayers}</span>}
          </div>
          <div className={s.names}>
            {shown.map((n, i) => (
              <div className={s.nameRow} key={i}>
                <input
                  value={n}
                  placeholder={'Jogador ' + (i + 1)}
                  maxLength={18}
                  autoComplete="off"
                  enterKeyHint="next"
                  aria-label={'Nome do jogador ' + (i + 1)}
                  onChange={e => { const next = [...names]; next[i] = e.target.value; update({ names: next }); }}
                />
                {S.mode === 'grupo' && names.length > 3 && (
                  <button className={s.x} aria-label={'Remover jogador ' + (i + 1)}
                    onClick={() => update({ names: names.filter((_, j) => j !== i) })}><Icon name="close" size={16} /></button>
                )}
              </div>
            ))}
          </div>
          {S.mode === 'grupo' && names.length < maxPlayers && (
            <button className={s.add} onClick={() => update({ names: [...names, ''] })}><Icon name="plus" size={16} />Adicionar jogador</button>
          )}
        </section>

        <section className={s.box}>
          <h2 className={s.h2}>Temas</h2>
          <div className={s.chips}>
            {chips.map(c => {
              const on = S.themes.includes(c.id);
              return (
                <button key={c.id} className={cx(s.chip, on && s.on, c.id === 'custom' && s.chipCustom)} aria-pressed={on}
                  onClick={() => update({ themes: on ? S.themes.filter(x => x !== c.id) : [...S.themes, c.id] })}>
                  {c.id === 'custom' && <Icon name="pencil" size={14} />}{c.label}
                </button>
              );
            })}
          </div>
          {S.themes.includes('custom') && (
            <textarea className={s.custom} value={S.custom} onChange={e => update({ custom: e.target.value })}
              aria-label="Palavras do tema personalizado"
              placeholder="Suas palavras, separadas por vírgula ou uma por linha. Ex.: tia Neide, churrasco do Beto, viagem pra Ubatuba" />
          )}
        </section>

        <section className={s.box}>
          <h2 className={s.h2}>Opções</h2>
          {S.mode === 'grupo' && (
            <>
              <label className={cx(s.opt, S.similar && s.dim)}>
                <span><b>Dica pro impostor</b><small>O impostor vê o nome do tema.</small></span>
                <span className={s.sw}><input type="checkbox" checked={S.hint} onChange={e => update({ hint: e.target.checked })} /><span /></span>
              </label>
              <label className={s.opt}>
                <span><b>Palavra parecida</b><small>O impostor recebe uma palavra parecida e nem sabe que é ele.</small></span>
                <span className={s.sw}><input type="checkbox" checked={S.similar} onChange={e => update({ similar: e.target.checked })} /><span /></span>
              </label>
              <label className={s.opt}>
                <span><b>Modo caos</b><small>Às vezes 2 impostores (com 5 ou mais), às vezes nenhum.</small></span>
                <span className={s.sw}><input type="checkbox" checked={S.chaos} onChange={e => update({ chaos: e.target.checked })} /><span /></span>
              </label>
            </>
          )}
          <div className={cx(s.timerRow, S.mode === 'dupla' && s.timerFirst)}>
            <b>Tempo de conversa</b>
            <div className={s.seg} role="group" aria-label="Tempo de conversa">
              {TIMERS.map(([t, label]) => (
                <button key={t} className={cx(S.timer === t && s.on)} aria-pressed={S.timer === t} onClick={() => update({ timer: t })}>{label}</button>
              ))}
            </div>
          </div>
        </section>

        {err && <div className={s.err} role="alert" ref={errRef}>{err}</div>}
        <button className={cx(s.btn, s.hot, s.big)} onClick={start}>Começar</button>

        <details className={s.rules}>
          <summary>Como joga</summary>
          <ol>{rules.map(r => <li key={r}>{r}</li>)}</ol>
        </details>
        <button className={s.small} onClick={() => {
          if (!confirm('Zerar o placar de todo mundo?')) return;
          setScores({}); setResetDone(true); window.setTimeout(() => setResetDone(false), 1600);
        }}>{resetDone ? 'Placar zerado' : 'Zerar placar'}</button>
      </main>
    );
  }

  if (!R) return null;
  const n = R.names.length;

  if (screen === 'reveal') {
    const name = R.names[idx];
    const isImp = R.mode === 'grupo' && R.imp.includes(idx);
    const word = R.mode === 'dupla' ? R.words[idx] : isImp ? R.pair.b : R.pair.a;
    const nextName = idx + 1 < n ? R.names[idx + 1] : null;
    const close = () => setOpen(false);
    const reveal = () => { setOpen(true); setSeen(true); buzz(15); };
    return (
      <main className={cx(s.main, s.full)}>
        <TopBar onClose={leave} end={
          <div className={s.progress} role="img" aria-label={`Jogador ${idx + 1} de ${n}`}>
            {R.names.map((_, j) => <span key={j} className={cx(j <= idx && s.progressOn)} />)}
          </div>
        } />
        <div className={s.turn}>
          <span className={s.step}>Passe o celular para</span>
          <span className={s.who}>{name}</span>
        </div>
        <div
          className={cx(s.secret, open && s.open)}
          role="button"
          tabIndex={0}
          aria-label="Segure para ver sua palavra"
          onPointerDown={e => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} reveal(); }}
          onPointerUp={close}
          onPointerCancel={close}
          onLostPointerCapture={close}
          onContextMenu={e => e.preventDefault()}
          onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); reveal(); } }}
          onKeyUp={close}
        >
          <div className={s.cover}>
            <Icon name="eye" size={44} />
            <span>Só {name} pode olhar.<br />Segure aqui pra ver.</span>
          </div>
          <div className={s.content}>
            {isImp && !R.similar ? (
              <>
                <Icon name="mask" size={48} />
                <span className={s.word}>Você é o impostor</span>
                <span className={s.tag}>{R.hint ? 'Tema: ' + R.pair.theme : 'Sem dica. Boa sorte!'}</span>
              </>
            ) : (
              <>
                <span className={s.kicker}>Sua palavra</span>
                <span className={s.word}>{word}</span>
                <span className={s.tag}>{R.pair.theme}</span>
              </>
            )}
          </div>
        </div>
        <p className={s.holdHint}><Icon name="hand" size={18} />Solte o dedo e a palavra some</p>
        <button className={cx(s.btn, s.go, s.big, s.pushDown)} disabled={!seen} onClick={() => {
          setOpen(false); setSeen(false);
          if (idx + 1 < n) setIdx(idx + 1); else setScreen('talk');
        }}>
          {nextName ? `Pronto, passar pra ${nextName}` : 'Pronto, começar'}
        </button>
      </main>
    );
  }

  if (screen === 'talk') {
    return (
      <main className={cx(s.main, s.full)}>
        <TopBar onClose={leave} />
        <div className={s.turn}>
          <span className={s.step}>Hora das pistas</span>
          <span className={s.who}>{R.names[R.starter]} começa</span>
        </div>
        <p className={cx(s.muted, s.center)}>
          {R.mode === 'dupla'
            ? 'Falem pistas sobre a sua palavra, um de cada vez. Sem dizer a palavra!'
            : 'Em roda, cada um fala uma pista sobre a palavra. Pode dar mais de uma volta.'}
        </p>
        <div className={cx(s.stack, s.pushDown)}>
          {S.timer > 0 && <TalkTimer seconds={S.timer} />}
          <button className={cx(s.btn, s.hot, s.big)} onClick={() => { setIdx(0); setOptsShown(false); setPicked(null); setScreen('vote'); }}>Votar</button>
        </div>
      </main>
    );
  }

  if (screen === 'vote') {
    const name = R.names[idx];
    const option = (key: string, label: string, v: Vote, color?: string) => (
      <button key={key} className={cx(s.optBtn, picked === v && s.optOn)} aria-pressed={picked === v} onClick={() => setPicked(v)}>
        {color && <span className={s.avatar} style={{ background: color }}>{initial(label)}</span>}
        <span className={s.optLabel}>{label}</span>
        {picked === v && <span className={s.optCheck}><Icon name="check" size={22} /></span>}
      </button>
    );
    return (
      <main className={cx(s.main, s.full)}>
        <TopBar onClose={leave} end={<span className={s.count}>Voto {idx + 1} de {n}</span>} />
        <div className={s.turn}>
          <span className={s.step}>Voto secreto de</span>
          <span className={s.who}>{name}</span>
          <span className={s.question}>{R.mode === 'dupla' ? 'Vocês têm a mesma palavra?' : 'Quem é o impostor?'}</span>
        </div>
        {!optsShown ? (
          <button className={cx(s.btn, s.go, s.big, s.pushDown)} onClick={() => setOptsShown(true)}>Sou {name}, mostrar opções</button>
        ) : (
          <>
            <div className={s.opts}>
              {R.mode === 'dupla' ? (
                <>
                  {option('igual', 'Somos iguais', 'igual')}
                  {option('diferente', 'Somos diferentes', 'diferente')}
                </>
              ) : (
                <>
                  {R.names.map((nm, j) => j !== idx && option(nm, nm, j, AVATAR[j % 3]))}
                  {R.chaos && (
                    <button className={cx(s.optBtn, s.none, picked === 'none' && s.optOn)} aria-pressed={picked === 'none'} onClick={() => setPicked('none')}>
                      Ninguém é impostor
                    </button>
                  )}
                </>
              )}
            </div>
            <div className={s.pushDown}>
              <button className={cx(s.btn, s.hot, s.big)} disabled={picked === null} onClick={() => picked !== null && castVote(picked)}>Confirmar voto</button>
              <p className={cx(s.muted, s.center)} style={{ marginTop: 10 }}>Depois de confirmar, a tela esconde o voto.</p>
            </div>
          </>
        )}
      </main>
    );
  }

  // Resultado
  if (guessFor) {
    return (
      <main className={cx(s.main, s.full)}>
        <span className={s.badge}>Rodada {roundNo}</span>
        <h1 className={s.headline}>{guessFor.name} foi pego!</h1>
        <div className={s.guess}>
          <p><b>Última chance, {guessFor.name}.</b> Fale em voz alta qual você acha que era a palavra. Depois alguém toca no botão.</p>
          <button className={s.btn} style={{ marginBottom: 10 }} disabled={wordShown} onClick={() => setWordShown(true)}>
            {wordShown ? 'A palavra era: ' + R.pair.a : 'Mostrar a palavra pra conferir'}
          </button>
          <div className={s.pair}>
            <button className={cx(s.btn, s.alt)} onClick={() => settleGuess(true)}>Acertou</button>
            <button className={cx(s.btn, s.hot)} onClick={() => settleGuess(false)}>Errou</button>
          </div>
        </div>
      </main>
    );
  }

  if (!outcome) return null;
  const ranked = R.names.map(nm => [nm, scores[nm] || 0] as const).sort((a, b) => b[1] - a[1]);
  const tally = R.names.map((nm, i) => ({ nm, count: R.votes.filter(v => v === i).length }));
  const maxVotes = Math.max(1, ...tally.map(x => x.count));
  const noneVotes = R.votes.filter(v => v === 'none').length;

  return (
    <main className={s.main}>
      <span className={s.badge}>Rodada {roundNo}</span>
      <h1 className={s.headline}>{outcome.head}</h1>
      <p className={s.muted} style={{ margin: '0 0 16px' }}>{outcome.sub}</p>

      <div className={s.cards}>
        {R.mode === 'dupla' ? (
          <>
            <div className={s.cardWord}><small>{R.names[0]}</small><strong>{R.words[0]}</strong><span>{R.pair.theme}</span></div>
            <div className={cx(s.cardWord, !R.same && s.cardDark)}><small>{R.names[1]}</small><strong>{R.words[1]}</strong><span>{R.same ? 'iguais' : 'diferentes'}</span></div>
          </>
        ) : (
          <>
            <div className={s.cardWord}><small>Palavra</small><strong>{R.pair.a}</strong><span>{R.pair.theme}</span></div>
            <div className={cx(s.cardWord, s.cardDark)}>
              <small>{R.imp.length > 1 ? 'Impostores' : 'Impostor'}</small>
              <strong>{R.imp.length ? R.imp.map(i => R.names[i]).join(' e ') : 'Ninguém'}</strong>
              <span>{R.similar && R.imp.length ? 'palavra: ' + R.pair.b : (outcome.gains[R.names[R.imp[0]]] === 2 ? 'escapou' : R.imp.length ? 'foi pego' : 'pegadinha')}</span>
            </div>
          </>
        )}
      </div>

      <section className={s.box}>
        <h2 className={s.h2}>Votos</h2>
        {R.mode === 'dupla' ? (
          <ul className={s.list}>
            {R.names.map((nm, i) => (
              <li key={nm}><span>{nm}</span><span className={s.muted}>{R.votes[i] === 'igual' ? 'Iguais' : 'Diferentes'}</span></li>
            ))}
          </ul>
        ) : (
          <div className={s.bars}>
            {tally.map(({ nm, count }) => (
              <div key={nm} className={s.barRow}>
                <span className={s.barName}>{nm}</span>
                <span className={s.barTrack}><span className={cx(s.barFill, count === maxVotes && count > 0 && s.barTop)} style={{ width: `${(count / maxVotes) * 100}%` }} /></span>
                <span className={s.barCount}>{count}</span>
              </div>
            ))}
            {R.chaos && (
              <div className={s.barRow}>
                <span className={s.barName}>Ninguém</span>
                <span className={s.barTrack}><span className={s.barFill} style={{ width: `${(noneVotes / maxVotes) * 100}%` }} /></span>
                <span className={s.barCount}>{noneVotes}</span>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={s.box}>
        <h2 className={s.h2}>Placar</h2>
        <ol className={s.rank}>
          {ranked.map(([nm, p], i) => (
            <li key={nm}>
              <span className={cx(s.pos, i === 0 && s.posFirst)}>{i + 1}</span>
              <span className={s.rankName}>{nm}{outcome.gains[nm] ? <span className={s.plus}>+{outcome.gains[nm]}</span> : null}</span>
              <span className={s.pts}>{p}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className={s.stack}>
        <button className={cx(s.btn, s.hot, s.big)} onClick={() => newRound()}>Nova rodada</button>
        <button className={s.btn} onClick={() => setScreen('setup')}>Mudar jogadores ou temas</button>
      </div>
      <Burst trigger={burst} />
    </main>
  );
}
