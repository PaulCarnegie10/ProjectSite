import { useEffect, useRef } from 'react';

// Fixed full-viewport atmosphere: drifting aurora blobs + a twinkling
// canvas starfield with occasional shooting stars. Sits behind the
// entire app; sections stay transparent so the aurora flows through.
export default function AuroraBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    let stars = [];
    let meteor = null;
    let nextMeteorAt = 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const seed = () => {
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(180, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        base: Math.random() * 0.5 + 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 1.2 + 0.3,
        hue: Math.random() < 0.18 ? '167,139,250' : Math.random() < 0.5 ? '125,211,252' : '244,242,255',
      }));
    };

    const drawStatic = () => {
      const { innerWidth: w, innerHeight: h } = window;
      ctx.clearRect(0, 0, w, h);
      stars.forEach((s) => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue},${s.base})`;
        ctx.fill();
      });
    };

    const frame = (t) => {
      const { innerWidth: w, innerHeight: h } = window;
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;

      stars.forEach((s) => {
        const tw = s.base + Math.sin(time * s.speed + s.phase) * 0.25;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue},${Math.max(0.05, tw)})`;
        ctx.fill();
      });

      // Occasional shooting star
      if (!meteor && t > nextMeteorAt) {
        meteor = {
          x: Math.random() * w * 0.7 + w * 0.15,
          y: Math.random() * h * 0.3,
          vx: -(Math.random() * 6 + 7),
          vy: Math.random() * 3 + 2.5,
          life: 1,
        };
      }
      if (meteor) {
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life -= 0.018;
        const grad = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - meteor.vx * 12, meteor.y - meteor.vy * 12
        );
        grad.addColorStop(0, `rgba(196,181,253,${meteor.life})`);
        grad.addColorStop(1, 'rgba(196,181,253,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * 12, meteor.y - meteor.vy * 12);
        ctx.stroke();
        if (meteor.life <= 0 || meteor.x < -100 || meteor.y > h + 100) {
          meteor = null;
          nextMeteorAt = t + 6000 + Math.random() * 9000;
        }
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      if (reduced) {
        drawStatic();
      } else {
        raf = requestAnimationFrame(frame);
      }
    };

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else start();
    };

    seed();
    start();
    window.addEventListener('resize', () => { seed(); if (reduced) drawStatic(); });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Aurora blobs — slow drifting color fields */}
      <div
        className="aurora-blob"
        style={{
          top: '-20%', left: '-10%', width: '55vw', height: '55vw',
          background: 'radial-gradient(circle, rgba(124,58,237,0.22), transparent 65%)',
          animation: 'aurora-a 90s ease-in-out infinite',
        }}
      />
      <div
        className="aurora-blob"
        style={{
          top: '20%', right: '-15%', width: '60vw', height: '60vw',
          background: 'radial-gradient(circle, rgba(37,99,235,0.16), transparent 65%)',
          animation: 'aurora-b 110s ease-in-out infinite',
        }}
      />
      <div
        className="aurora-blob"
        style={{
          bottom: '-25%', left: '15%', width: '50vw', height: '50vw',
          background: 'radial-gradient(circle, rgba(56,189,248,0.10), transparent 65%)',
          animation: 'aurora-c 130s ease-in-out infinite',
        }}
      />
      {/* Starfield */}
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="grain" />
    </div>
  );
}
