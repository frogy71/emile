"use client";

import { useEffect, useRef } from "react";

const COLORS = ["#c8f76f", "#ffe066", "#a3d5ff", "#ffa3d1", "#d4b5ff"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  shape: "rect" | "circle";
  life: number;
};

/**
 * Lightweight zero-dep canvas confetti. Mounts a fullscreen, pointer-events:none
 * canvas, fires a burst, then unmounts itself via onComplete after ~2s.
 *
 * Triggered by setting `active=true` from the parent — we keep state out of the
 * canvas itself so re-firing is just a re-mount.
 */
export function Confetti({
  active,
  onComplete,
  particleCount = 120,
}: {
  active: boolean;
  onComplete?: () => void;
  particleCount?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = window.innerWidth;
    const h = window.innerHeight;
    const originX = w / 2;
    const originY = h * 0.35;

    const particles: Particle[] = Array.from({ length: particleCount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 6 + Math.random() * 9;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4,
        size: 6 + Math.random() * 6,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        shape: Math.random() > 0.5 ? "rect" : "circle",
        life: 1,
      };
    });

    const gravity = 0.28;
    const friction = 0.985;
    const fadeStart = 90; // frames
    let frame = 0;
    let raf = 0;

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of particles) {
        p.vx *= friction;
        p.vy = p.vy * friction + gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;

        if (frame > fadeStart) {
          p.life -= 0.02;
        }

        if (p.life > 0 && p.y < h + 40) {
          alive++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.strokeStyle = "#1a1a1a";
          ctx.lineWidth = 1;
          if (p.shape === "rect") {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
            ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.55);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      frame++;
      if (alive > 0 && frame < 220) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [active, particleCount, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[200]"
    />
  );
}
