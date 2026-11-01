'use client';

import { useEffect, useState } from 'react';

type Piece = { left: number; delay: number; color: string };

/** Chuva de confete. Dispara toda vez que `trigger` muda para um valor maior que zero. */
export default function Burst({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[] | null>(null);

  useEffect(() => {
    if (!trigger) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const root = getComputedStyle(document.documentElement);
    const colors = ['--tape', '--label', '--accent'].map(v => root.getPropertyValue(v).trim());
    setPieces(
      Array.from({ length: 40 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        color: colors[i % 3],
      })),
    );
    const t = window.setTimeout(() => setPieces(null), 2400);
    return () => window.clearTimeout(t);
  }, [trigger]);

  if (!pieces) return null;
  return (
    <div className="burst" key={trigger} aria-hidden="true">
      {pieces.map((p, i) => (
        <i key={i} style={{ left: `${p.left}vw`, background: p.color, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  );
}
