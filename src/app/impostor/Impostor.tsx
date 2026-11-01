'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Burst from '@/components/Burst';
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
  const label = running ? '⏸ Pausar' : ended ? '↺ De novo' : left === seconds ? '▶ Iniciar tempo' : '▶ Continuar';
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
        {label}
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
      setR(round); setIdx(idx + 1); setOptsShown(false);
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
    const chips = [...themes.map(t => ({ id: t.id, label: `${t.icon} ${t.name}` })), { id: 'custom', label: '✏️ Personalizado' }];

    return (
      <main className={s.main}>
        <h1 className={s.title}><span className={s.a}>Impos</span><span className={s.b}>tor</span></h1>
        <p className={s.sub}>Um celular, várias pessoas, alguém mentindo.</p>

        <div className={s.seg}>
          {(['grupo', 'dupla'] as Mode[]).map(m => (
            <button key={m} className={cx(S.mode === m && s.on)} onClick={() => { setErr(''); update({ mode: m }); }}>
              {m === 'grupo' ? '👥 Grupo (3+)' : '💞 Dupla'}
            </button>
          ))}
        </div>

        <details className={s.rules}>
          <summary>Como joga</summary>
          <ol>{rules.map(r => <li key={r}>{r}</li>)}</ol>
        </details>

        <div className={s.box}>
          <h2 className={s.h2}>Jogadores</h2>
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
                    onClick={() => update({ names: names.filter((_, j) => j !== i) })}>×</button>
                )}
              </div>
            ))}
          </div>
          {S.mode === 'grupo' && names.length < maxPlayers && (
            <button className={s.add} onClick={() => update({ names: [...names, ''] })}>+ Adicionar jogador</button>
          )}
        </div>

        <div className={s.box}>
          <h2 className={s.h2}>Temas</h2>
          <div className={s.chips}>
            {chips.map(c => {
              const on = S.themes.includes(c.id);
              return (
                <button key={c.id} className={cx(s.chip, on && s.on)} aria-pressed={on}
                  onClick={() => update({ themes: on ? S.themes.filter(x => x !== c.id) : [...S.themes, c.id] })}>
                  {c.label}
                </button>
              );
            })}
          </div>
          {S.themes.includes('custom') && (
            <textarea className={s.custom} value={S.custom} onChange={e => update({ custom: e.target.value })}
              placeholder="Suas palavras, separadas por vírgula ou uma por linha. Ex.: tia Neide, churrasco do Beto, viagem pra Ubatuba" />
          )}
        </div>

        <div className={s.box}>
          <h2 className={s.h2}>Opções</h2>
          {S.mode === 'grupo' && (
            <>
              <label className={cx(s.opt, S.similar && s.dim)}>
                <span><b>Dica pro impostor</b><small>O impostor vê o nome do tema.</small></span>
                <span className={s.sw}><input type="checkbox" checked={S.hint} onChange={e => update({ hint: e.target.checked })} /><span /></span>
              </label>
              <label className={s.opt}>
                <span><b>Palavra parecida</b><small>O impostor recebe uma palavra parecida e nem sabe que é o impostor.</small></span>
                <span className={s.sw}><input type="checkbox" checked={S.similar} onChange={e => update({ similar: e.target.checked })} /><span /></span>
              </label>
              <label className={s.opt}>
                <span><b>Modo caos</b><small>Às vezes tem 2 impostores (com 5+ jogadores), às vezes nenhum.</small></span>
                <span className={s.sw}><input type="checkbox" checked={S.chaos} onChange={e => update({ chaos: e.target.checked })} /><span /></span>
              </label>
            </>
          )}
          <div className={s.timerRow} style={S.mode === 'dupla' ? { borderTop: 0, paddingTop: 0 } : undefined}>
            <b>Tempo de conversa</b>
            <div className={s.seg}>
              {TIMERS.map(([t, label]) => (
                <button key={t} className={cx(S.timer === t && s.on)} onClick={() => update({ timer: t })}>{label}</button>
              ))}
            </div>
          </div>
        </div>

        {err && <div className={s.err} role="alert" ref={errRef}>{err}</div>}
        <button className={cx(s.btn, s.hot, s.big)} onClick={start}>Começar</button>
        <button className={s.small} onClick={() => {
          if (!confirm('Zerar o placar de todo mundo?')) return;
          setScores({}); setResetDone(true); window.setTimeout(() => setResetDone(false), 1600);
        }}>{resetDone ? 'Placar zerado ✓' : 'Zerar placar'}</button>
        <Link className={s.linkback} href="/">← Outros jogos</Link>
      </main>
    );
  }

  if (!R) return null;
  const n = R.names.length;

  if (screen === 'reveal') {
    const name = R.names[idx];
    const isImp = R.mode === 'grupo' && R.imp.includes(idx);
    const word = R.mode === 'dupla' ? R.words[idx] : isImp ? R.pair.b : R.pair.a;
    const close = () => setOpen(false);
    const reveal = () => { setOpen(true); setSeen(true); buzz(15); };
    return (
      <main className={s.main}>
        <div className={s.turn}>
          <div className={s.step}>Passe o celular para · {idx + 1} de {n}</div>
          <div className={s.who}>{name}</div>
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
          <div className={s.cover}><span className={s.eye}>👀</span>Só {name} pode olhar.<br />Segure aqui pra ver.</div>
          <div className={s.content}>
            {isImp && !R.similar ? (
              <>
                <span className={s.imp}>🤫</span>
                <div className={s.word}>Você é o impostor</div>
                <span className={s.tag}>{R.hint ? 'Tema: ' + R.pair.theme : 'Sem dica. Boa sorte!'}</span>
              </>
            ) : (
              <>
                <div className={s.word}>{word}</div>
                <span className={s.tag}>{R.pair.theme}</span>
              </>
            )}
          </div>
        </div>
        <button className={cx(s.btn, s.go, s.big)} disabled={!seen} onClick={() => {
          setOpen(false); setSeen(false);
          if (idx + 1 < n) setIdx(idx + 1); else setScreen('talk');
        }}>
          {idx === n - 1 ? 'Pronto, começar' : 'Pronto, passar'}
        </button>
        <p className={cx(s.muted, s.center)} style={{ marginTop: 12 }}>Soltou o dedo, a palavra some.</p>
      </main>
    );
  }

  if (screen === 'talk') {
    return (
      <main className={s.main}>
        <h1 className={cx(s.title, s.titleSm)}><span className={s.a}>Hora das</span> <span className={s.b}>pistas</span></h1>
        <p className={s.starter}>Quem começa: <b>{R.names[R.starter]}</b></p>
        <p className={cx(s.muted, s.center)}>
          {R.mode === 'dupla'
            ? 'Falem pistas sobre a sua palavra, um de cada vez. Sem dizer a palavra!'
            : 'Em roda, cada um fala uma pista sobre a palavra. Pode dar mais de uma volta.'}
        </p>
        <div className={s.stack}>
          {S.timer > 0 && <TalkTimer seconds={S.timer} />}
          <button className={cx(s.btn, s.hot, s.big)} onClick={() => { setIdx(0); setOptsShown(false); setScreen('vote'); }}>Votar</button>
        </div>
      </main>
    );
  }

  if (screen === 'vote') {
    const name = R.names[idx];
    return (
      <main className={s.main}>
        <div className={s.turn}>
          <div className={s.step}>Voto secreto · {idx + 1} de {n}</div>
          <div className={s.who}>{name}</div>
        </div>
        <p className={cx(s.muted, s.center)}>{R.mode === 'dupla' ? 'Vocês têm a mesma palavra?' : 'Quem é o impostor?'}</p>
        {!optsShown ? (
          <button className={cx(s.btn, s.go, s.big)} onClick={() => setOptsShown(true)}>Sou {name}, mostrar opções</button>
        ) : (
          <div className={s.opts}>
            {R.mode === 'dupla' ? (
              <>
                <button className={cx(s.btn, s.alt)} onClick={() => castVote('igual')}>🟰 Somos iguais</button>
                <button className={cx(s.btn, s.hot)} onClick={() => castVote('diferente')}>≠ Somos diferentes</button>
              </>
            ) : (
              <>
                {R.names.map((nm, j) => j !== idx && (
                  <button key={nm} className={s.btn} onClick={() => castVote(j)}>{nm}</button>
                ))}
                {R.chaos && <button className={cx(s.btn, s.none)} onClick={() => castVote('none')}>Ninguém é impostor</button>}
              </>
            )}
          </div>
        )}
      </main>
    );
  }

  // Resultado
  if (guessFor) {
    return (
      <main className={s.main}>
        <div className={s.headline}>{guessFor.name} foi pego!</div>
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
  const voteLabel = (v: Vote) => v === 'none' ? 'Ninguém' : v === 'igual' ? 'Iguais' : v === 'diferente' ? 'Diferentes' : R.names[v];
  const ranked = R.names.map(nm => [nm, scores[nm] || 0] as const).sort((a, b) => b[1] - a[1]);

  return (
    <main className={s.main}>
      <div className={s.headline}>{outcome.head}</div>
      <p className={s.muted}>{outcome.sub}</p>

      {R.mode === 'dupla' ? (
        <>
          <div className={s.reveal}><small>{R.names[0]}</small><strong>{R.words[0]}</strong></div>
          <div className={cx(s.reveal, !R.same && s.pink)}><small>{R.names[1]}</small><strong>{R.words[1]}</strong></div>
        </>
      ) : (
        <>
          <div className={s.reveal}><small>Palavra · {R.pair.theme}</small><strong>{R.pair.a}</strong></div>
          <div className={cx(s.reveal, s.pink)}>
            <small>{R.imp.length > 1 ? 'Impostores' : 'Impostor'}</small>
            <strong>{R.imp.length ? R.imp.map(i => R.names[i]).join(' e ') : 'Ninguém 😈'}</strong>
            {R.similar && R.imp.length > 0 && <small style={{ marginTop: 4, opacity: .9 }}>Palavra dele: {R.pair.b}</small>}
          </div>
        </>
      )}

      <div className={s.box}>
        <h2 className={s.h2}>Votos</h2>
        <ul className={s.list}>
          {R.names.map((nm, i) => (
            <li key={nm}><span>{nm}</span><span className={s.muted}>{voteLabel(R.votes[i])}</span></li>
          ))}
        </ul>
      </div>

      <div className={s.box}>
        <h2 className={s.h2}>Placar</h2>
        <ul className={s.list}>
          {ranked.map(([nm, p]) => (
            <li key={nm}>
              <span>{nm}{outcome.gains[nm] ? <span className={s.plus}>+{outcome.gains[nm]}</span> : null}</span>
              <span className={s.pts}>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={s.stack}>
        <button className={cx(s.btn, s.hot, s.big)} onClick={() => newRound()}>Nova rodada</button>
        <button className={s.btn} onClick={() => setScreen('setup')}>Mudar jogadores ou temas</button>
      </div>
      <Burst trigger={burst} />
    </main>
  );
}
