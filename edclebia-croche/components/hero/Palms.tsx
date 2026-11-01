/**
 * Sombras de folhas de coqueiro, geradas proceduralmente (sem imagem).
 * Ficam desfocadas e balançam devagar — a "brisa" do fundo do hero.
 */

function frond(length: number, curve: number, leaflets: number, seed: number) {
  const parts: string[] = [];
  // haste: curva quadrática da base (0,0) até a ponta
  const tipX = length;
  const tipY = curve;
  const cX = length * 0.5;
  const cY = -curve * 0.15;
  const at = (t: number) => {
    const x = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * cX + t * t * tipX;
    const y = (1 - t) * (1 - t) * 0 + 2 * (1 - t) * t * cY + t * t * tipY;
    const dx = 2 * (1 - t) * cX + 2 * t * (tipX - cX);
    const dy = 2 * (1 - t) * cY + 2 * t * (tipY - cY);
    const l = Math.hypot(dx, dy) || 1;
    return { x, y, tx: dx / l, ty: dy / l };
  };
  parts.push(`M0 0 Q${cX.toFixed(1)} ${cY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`);
  let r = seed;
  const rand = () => {
    r = (r * 9301 + 49297) % 233280;
    return r / 233280;
  };
  for (let i = 2; i < leaflets; i++) {
    const t = i / leaflets;
    const p = at(t);
    const len = length * (0.42 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 0.06) * (0.85 + rand() * 0.3);
    const w = len * 0.09;
    for (const side of [-1, 1]) {
      // folíolo inclinado ~55° e caído para baixo
      const ang = Math.atan2(p.ty, p.tx) + side * (0.95 + rand() * 0.25) + 0.25;
      const ex = p.x + Math.cos(ang) * len;
      const ey = p.y + Math.sin(ang) * len + len * 0.25;
      const mx = (p.x + ex) / 2;
      const my = (p.y + ey) / 2;
      const nx = -Math.sin(ang) * w;
      const ny = Math.cos(ang) * w;
      parts.push(
        `M${p.x.toFixed(1)} ${p.y.toFixed(1)} Q${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)} Q${(mx - nx).toFixed(1)} ${(my - ny).toFixed(1)} ${p.x.toFixed(1)} ${p.y.toFixed(1)}Z`,
      );
    }
  }
  return parts.join(' ');
}

const FRONDS = [
  { d: frond(520, 120, 30, 7), x: 1180, y: -40, rot: 150, dur: 9, delay: 0 },
  { d: frond(600, 160, 34, 13), x: 1260, y: 10, rot: 118, dur: 11, delay: -3 },
  { d: frond(480, 90, 28, 21), x: 1320, y: -60, rot: 172, dur: 8, delay: -5 },
  { d: frond(560, 140, 32, 5), x: 980, y: -120, rot: 98, dur: 12, delay: -2 },
  { d: frond(420, 80, 26, 33), x: -60, y: 640, rot: -18, dur: 10, delay: -4 },
  { d: frond(460, 110, 28, 41), x: -80, y: 520, rot: -42, dur: 13, delay: -1 },
];

export function Palms({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <filter id="palm-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <g filter="url(#palm-blur)" fill="currentColor" stroke="currentColor" strokeWidth="4" strokeLinejoin="round">
        {FRONDS.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.rot})`}>
            <path d={f.d} />
          </g>
        ))}
      </g>
    </svg>
  );
}
