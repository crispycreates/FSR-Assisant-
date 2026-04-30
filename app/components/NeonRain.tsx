'use client';

import { useEffect, useRef } from 'react';

const PALETTE = ['#00f0ff', '#ff00e0', '#b14aed', '#39ff14', '#ff006e'];
const CHARS =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789'.split(
    '',
  );
const FONT_SIZE = 16;

type Drop = {
  x: number;
  y: number;
  speed: number;
  color: string;
  char: string;
};

export default function NeonRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let drops: Drop[] = [];
    let dpr = Math.max(1, window.devicePixelRatio || 1);

    function pickChar() {
      return CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    function pickColor() {
      return PALETTE[Math.floor(Math.random() * PALETTE.length)];
    }

    function resize() {
      if (!canvas || !ctx) return;
      dpr = Math.max(1, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = Math.floor(w / FONT_SIZE);
      drops = Array.from({ length: cols }, (_, i) => ({
        x: i * FONT_SIZE + FONT_SIZE / 2,
        y: Math.random() * h,
        speed: 0.6 + Math.random() * 2.2,
        color: pickColor(),
        char: pickChar(),
      }));
    }

    function frame() {
      if (!canvas || !ctx) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      ctx.fillStyle = 'rgba(8, 4, 16, 0.18)';
      ctx.fillRect(0, 0, w, h);

      ctx.font = `${FONT_SIZE}px ui-monospace, "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const d of drops) {
        if (Math.random() < 0.04) d.char = pickChar();
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = d.color;
        ctx.fillText(d.char, d.x, d.y);
        d.y += d.speed;
        if (d.y > h + FONT_SIZE) {
          d.y = -FONT_SIZE;
          d.speed = 0.6 + Math.random() * 2.2;
          d.color = pickColor();
        }
      }
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }

    function staticFrame() {
      if (!canvas || !ctx) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.fillStyle = '#080410';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${FONT_SIZE}px ui-monospace, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const d of drops) {
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = d.color;
        ctx.fillText(d.char, d.x, d.y);
      }
      ctx.shadowBlur = 0;
    }

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      staticFrame();
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: '#080410',
      }}
    />
  );
}
