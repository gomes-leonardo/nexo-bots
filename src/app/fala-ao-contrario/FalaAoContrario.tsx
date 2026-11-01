'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import Burst from '@/components/Burst';
import s from './fala.module.css';

type Key = 'a' | 'ar' | 'b' | 'br';
type Step = 1 | 2 | 3;
type Buffers = Record<Key, AudioBuffer | null>;

const MAX_SECONDS = 15;
const EMPTY: Buffers = { a: null, ar: null, b: null, br: null };

const fmt = (sec: number) => Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0');
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };
function setSession(type: string) {
  try {
    const nav = navigator as AudioSessionNavigator;
    if (nav.audioSession) nav.audioSession.type = type;
  } catch {}
}

function pickMime() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  return ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported(t)) || '';
}

function drawWave(canvas: HTMLCanvasElement, buf: AudioBuffer | null) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  canvas.width = w * dpr; canvas.height = h * dpr;
  const g = canvas.getContext('2d');
  if (!g) return;
  g.scale(dpr, dpr);
  g.clearRect(0, 0, w, h);
  const bars = Math.max(12, Math.floor(w / 5)), bw = w / bars;
  g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--label').trim();
  if (!buf) {
    for (let i = 0; i < bars; i++) g.fillRect(i * bw + 1, h / 2 - 1, Math.max(1, bw - 2), 2);
    return;
  }
  const d = buf.getChannelData(0), step = Math.floor(d.length / bars) || 1;
  const vals: number[] = [];
  let peak = 1e-4;
  for (let i = 0; i < bars; i++) {
    let m = 0;
    for (let j = i * step; j < (i + 1) * step && j < d.length; j++) { const v = Math.abs(d[j]); if (v > m) m = v; }
    vals.push(m); if (m > peak) peak = m;
  }
  vals.forEach((v, i) => {
    const bh = Math.max(2, (v / peak) * h);
    g.fillRect(i * bw + 1, (h - bh) / 2, Math.max(1, bw - 2), bh);
  });
}

function Reel() {
  return (
    <svg className={s.reel} viewBox="0 0 60 60" aria-hidden="true">
      <circle cx="30" cy="30" r="28" fill="var(--reel)" />
      <circle cx="30" cy="30" r="11" fill="var(--window)" />
      <g fill="var(--reel)">
        {[0, 60, 120, 180, 240, 300].map(a => (
          <rect key={a} x="27" y="17" width="6" height="7" rx="1" transform={`rotate(${a} 30 30)`} />
        ))}
      </g>
    </svg>
  );
}

function PlayButton({ cls, disabled, onClick, children }: { cls?: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={cx(s.btn, cls)} disabled={disabled} onClick={onClick}>{children}</button>;
}

export default function FalaAoContrario() {
  const [step, setStep] = useState<Step>(1);
  const [bufs, setBufs] = useState<Buffers>(EMPTY);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [playing, setPlaying] = useState<{ key: Key; id: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [msg, setMsg] = useState('');
  const [micOk, setMicOk] = useState(false);
  const [burst, setBurst] = useState(0);

  const ctxRef = useRef<AudioContext | null>(null);
  const srcRef = useRef<AudioBufferSourceNode | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);

  function getCtx() {
    if (!ctxRef.current) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new C();
    }
    if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
    return ctxRef.current;
  }

  function decode(ab: ArrayBuffer) {
    const c = getCtx();
    return new Promise<AudioBuffer>((res, rej) => {
      const p = c.decodeAudioData(ab, res, rej);
      if (p && typeof p.then === 'function') p.then(res, rej);
    });
  }

  function reverse(buf: AudioBuffer) {
    const out = getCtx().createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (let ch = 0; ch < buf.numberOfChannels; ch++) {
      const src = buf.getChannelData(ch), dst = out.getChannelData(ch), n = src.length;
      for (let i = 0; i < n; i++) dst[i] = src[n - 1 - i];
    }
    return out;
  }

  function stopPlay() {
    const src = srcRef.current;
    if (src) {
      src.onended = null;
      try { src.stop(); } catch {}
      srcRef.current = null;
    }
    setPlaying(null);
  }

  function play(key: Key, id: string) {
    const same = playing?.id === id;
    stopPlay();
    const buf = bufs[key];
    if (same || !buf) return;
    setSession('playback');
    const c = getCtx();
    const src = c.createBufferSource();
    src.buffer = buf;
    src.connect(c.destination);
    src.onended = () => {
      if (srcRef.current === src) { srcRef.current = null; setPlaying(null); }
    };
    src.start();
    srcRef.current = src;
    setPlaying({ key, id });
    if (key === 'br') setBurst(b => b + 1);
  }

  function micError(e: unknown) {
    const err = e as { name?: string; message?: string } | null;
    const code = (err && (err.name || err.message)) || 'desconhecido';
    if (window.self !== window.top && (code === 'NotAllowedError' || code === 'SecurityError')) {
      setMsg('A página está dentro de um quadro que não libera o microfone. Abra pelo link direto no Safari. Código: ' + code);
    } else {
      setMsg('Microfone bloqueado. No Safari, toque em “aA”, abra os ajustes do site e mude Microfone para Permitir. Código: ' + code);
    }
  }

  async function toggleRec() {
    setMsg('');
    const current = recRef.current;
    if (current) { if (current.state !== 'inactive') current.stop(); return; }
    stopPlay();
    getCtx();
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setMsg('Este navegador não grava áudio. No iPhone, use o Safari atualizado.');
      return;
    }
    setSession('play-and-record');
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) { micError(e); return; }
    setMicOk(true);

    const key: 'a' | 'b' = step === 1 ? 'a' : 'b';
    const mime = pickMime();
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = async () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      stream.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      recRef.current = null;
      setRecording(false);
      setProcessing(true);
      try {
        const blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/mp4' });
        const buf = await decode(await blob.arrayBuffer());
        const rev = reverse(buf);
        setBufs(prev => (key === 'a' ? { a: buf, ar: rev, b: null, br: null } : { ...prev, b: buf, br: rev }));
      } catch {
        setMsg('Não deu pra ler a gravação. Grave de novo falando por pelo menos um segundo.');
      }
      setProcessing(false);
      setSession('playback');
    };
    rec.start();
    recRef.current = rec;
    streamRef.current = stream;
    setRecording(true);
    setElapsed(0);
    const t0 = Date.now();
    timerRef.current = window.setInterval(() => {
      const sec = (Date.now() - t0) / 1000;
      setElapsed(sec);
      if (sec >= MAX_SECONDS && rec.state !== 'inactive') rec.stop();
    }, 200);
  }

  async function askPermission() {
    setMsg('');
    getCtx();
    if (!navigator.mediaDevices?.getUserMedia) { setMsg('Este navegador não grava áudio.'); return; }
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true });
      st.getTracks().forEach(t => t.stop());
      setMicOk(true);
    } catch (e) { micError(e); }
  }

  function goto(n: Step) {
    stopPlay();
    setMsg('');
    setStep(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function newRound() {
    setBufs(EMPTY);
    goto(1);
  }

  // Microfone já liberado antes?
  useEffect(() => {
    try {
      navigator.permissions?.query({ name: 'microphone' as PermissionName })
        .then(p => { if (p.state === 'granted') setMicOk(true); })
        .catch(() => {});
    } catch {}
  }, []);

  // Limpa áudio e microfone ao sair da página
  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    try { srcRef.current?.stop(); } catch {}
    const rec = recRef.current;
    if (rec) { rec.onstop = null; if (rec.state !== 'inactive') rec.stop(); }
    streamRef.current?.getTracks().forEach(t => t.stop());
    void ctxRef.current?.close();
  }, []);

  const recKey: 'a' | 'b' = step === 1 ? 'a' : 'b';
  const current = step === 3 ? bufs.br : bufs[recKey];
  const waveBuf = recording ? null : playing ? bufs[playing.key] : current;

  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const draw = () => drawWave(canvas, waveBuf);
    draw();
    let t = 0;
    const onResize = () => { window.clearTimeout(t); t = window.setTimeout(draw, 150); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); window.clearTimeout(t); };
  }, [waveBuf]);

  const reversed = !!playing && playing.key.endsWith('r');
  const tapeState = recording ? s.recording : playing ? (reversed ? s.rev : s.fwd) : null;
  const modeTag = recording ? '● gravando' : reversed ? '◀ invertido' : '▶ normal';
  const sideLabel = recording ? (recKey === 'a' ? 'Lado A' : 'Lado B') : step === 1 ? 'Lado A' : step === 2 ? 'Lado B' : 'Final';
  const status = recording ? 'Gravando'
    : processing ? 'Processando…'
    : playing ? (playing.key === 'br' ? 'Revelando…' : 'Tocando')
    : step === 3 ? 'Toque em Revelar'
    : current ? 'Gravado' : 'Pronto pra gravar';
  const clock = recording ? fmt(elapsed)
    : playing ? fmt(bufs[playing.key]?.duration ?? 0)
    : current ? fmt(current.duration) : '0:00';
  const dockLabel = recording ? 'Toque pra parar'
    : bufs[recKey] ? 'Gravar de novo'
    : step === 1 ? 'Gravar frase' : 'Gravar imitação';

  const playBtn = (k: Key, id: string, label: string, cls?: string) => (
    <PlayButton key={id} cls={cx(cls, playing?.id === id && s.playing)} disabled={!bufs[k]} onClick={() => play(k, id)}>
      {label}
    </PlayButton>
  );

  return (
    <>
      <main className={s.main}>
        <h1 className={s.title}>
          <span className={s.tFwd}>Fala ao</span>
          <span className={s.tMirror}>contrário</span>
        </h1>

        <nav className={s.steps} aria-label="Etapas">
          <button className={cx(step === 1 && s.active)} onClick={() => goto(1)}>1 Gravar</button>
          <button className={cx(step === 2 && s.active)} disabled={!bufs.a} onClick={() => goto(2)}>2 Imitar</button>
          <button className={cx(step === 3 && s.active)} disabled={!bufs.b} onClick={() => goto(3)}>3 Resultado</button>
        </nav>

        <button className={s.permit} hidden={micOk} onClick={askPermission}>🎙️ Permitir microfone</button>
        {msg && <div className={s.msg} role="alert">{msg}</div>}

        <div className={cx(s.cassette, tapeState)}>
          <span className={s.modeTag}>{modeTag}</span>
          <div className={s.label}>
            <span className={s.side}>{sideLabel}</span>
            <span className={s.status}>
              <span className={s.clock}>{clock}</span>
              <span>{status}</span>
            </span>
          </div>
          <div className={s.window}>
            <Reel />
            <canvas ref={waveRef} />
            <Reel />
          </div>
          <div className={s.base}><i /><i /><i /><i /></div>
        </div>

        {step === 1 && (
          <section>
            <p className={s.hint}>Grave uma frase curta, tipo “eu amo pão de queijo”. Depois escute ela de trás pra frente.</p>
            <div className={s.btns}>
              {playBtn('a', '1a', '▶ Ouvir')}
              {playBtn('ar', '1ar', '◀ Invertido', s.alt)}
              <button className={cx(s.btn, s.go, s.big, s.wide)} disabled={!bufs.a} onClick={() => goto(2)}>Agora imitar</button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className={s.hint}>Escute o invertido quantas vezes quiser e grave sua melhor imitação dele.</p>
            <div className={s.btns}>
              {playBtn('ar', '2ar', '◀ Invertido', s.alt)}
              {playBtn('b', '2b', '▶ Minha imitação')}
              <button className={cx(s.btn, s.go, s.big, s.wide)} disabled={!bufs.b} onClick={() => goto(3)}>Ver resultado</button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <p className={s.hint}>Agora a sua imitação vai ser invertida. Se você mandou bem, a frase original aparece.</p>
            <div className={s.btns}>
              {playBtn('br', '3br', '🔁 Revelar', cx(s.alt, s.big, s.wide))}
              {playBtn('a', '3a', '▶ Original')}
              {playBtn('b', '3b', '▶ Imitação')}
              <button className={cx(s.btn, s.go, s.wide)} onClick={newRound}>Nova rodada</button>
            </div>
          </section>
        )}

        <p className={s.tip}>Sem som? Tire o iPhone do modo silencioso.</p>
        <Link className={s.back} href="/">← Outros jogos</Link>
      </main>

      <div className={s.dock} hidden={step === 3}>
        <button className={cx(s.recbtn, recording && s.on)} aria-label={recording ? 'Parar gravação' : 'Gravar'} onClick={toggleRec} disabled={processing}>
          <span />
        </button>
        <span className={s.dockLabel}>{dockLabel}</span>
      </div>

      <Burst trigger={burst} />
    </>
  );
}
