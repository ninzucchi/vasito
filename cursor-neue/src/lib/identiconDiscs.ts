// Discs identicon, ported from Sand-Toolkit `web/src/identicon/cube.ts`
// `drawDiscs` plus `palette.ts`. Two solid discs on perpendicular planes.
// Family ramp stays the Sand spectrum; the bot color pins the family.

import { mulberry32 } from "@/lib/identiconRandom";
import type { ProjectColor } from "@/types";

const SPECTRUM: Record<string, string[]> = {
  Pink: ["#fcecf8", "#f9d6f0", "#f5bfe7", "#f1a8de", "#ee93d7", "#eb7fcf", "#c355a3", "#9a337a", "#721a54", "#490932", "#2b031d"],
  Orange: ["#ffede8", "#ffdace", "#ffc5b3", "#ffaf97", "#ff9d7e", "#ff8a66", "#e2592e", "#c53101", "#8d2301", "#501907", "#2f0d02"],
  Red: ["#fde6e7", "#fbc9cb", "#f9abae", "#f68c90", "#f47176", "#f2565c", "#d82a30", "#be060b", "#880408", "#4d0406", "#2a0203"],
  Green: ["#e0f8eb", "#bdefd4", "#98e6bd", "#72dda5", "#51d58f", "#30cd7a", "#24a962", "#19854b", "#106035", "#093c20", "#042312"],
  Teal: ["#e2f6f9", "#c1ebf1", "#9ee1ea", "#7ad6e2", "#5bccdb", "#3cc2d4", "#1ba3b2", "#038590", "#025f67", "#023d42", "#012226"],
  Lavender: ["#f0f0fe", "#e0e0fc", "#cfcffb", "#bdbdfa", "#aeaef8", "#9e9ef7", "#7e74cf", "#6351a7", "#473a77", "#2f2447", "#1b142a"],
  Blue: ["#e4f3fe", "#c6e6fc", "#a6d8fb", "#85caf9", "#69bdf7", "#4cb1f6", "#368ed4", "#246db2", "#1a4e7f", "#142f47", "#0a1b2a"],
};

const NEIGHBOR: Record<string, string> = {
  Pink: "Orange",
  Orange: "Red",
  Red: "Orange",
  Green: "Teal",
  Teal: "Green",
  Lavender: "Blue",
  Blue: "Lavender",
};

const COLOR_FAMILY: Record<ProjectColor, string> = {
  default: "Blue",
  brand: "Blue",
  green: "Green",
  cyan: "Teal",
  blue: "Blue",
  purple: "Lavender",
  magenta: "Pink",
  orange: "Orange",
  yellow: "Orange",
  red: "Red",
};

type Pt = [number, number];

export function drawDiscs(
  ctx: CanvasRenderingContext2D,
  seed: number,
  size: number,
  color: ProjectColor,
) {
  const rand = mulberry32(seed >>> 0);
  rand();
  const family = COLOR_FAMILY[color] ?? "Blue";

  // No tile: same no-background deal as Sand-Toolkit (`S` grows, light
  // panel rungs only). Scale so the pair almost fills the clip circle.
  rand();
  const C = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(C, C, size / 2, 0, Math.PI * 2);
  ctx.clip();

  const turn = ((25 + rand() * 40) * Math.PI) / 180;
  const pitch = ((52 + rand() * 20) * Math.PI) / 180;
  const lean = rand() * Math.PI * 2;
  const r = 0.86 + rand() * 0.18;

  const spread = [5, 6, 7];
  const accent = SPECTRUM[NEIGHBOR[family]][8];
  const palette = [...spread.map((s) => SPECTRUM[family][s]), accent];
  for (let i = palette.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [palette[i], palette[j]] = [palette[j], palette[i]];
  }

  const u: [number, number][] = [
    [Math.cos(turn), Math.sin(turn)],
    [-Math.sin(turn), Math.cos(turn)],
  ];

  const projectUnit = (x: number, y: number, z: number): Pt => {
    const sx = x;
    const sy = y * Math.cos(pitch) - z * Math.sin(pitch);
    return [
      sx * Math.cos(lean) - sy * Math.sin(lean),
      -(sx * Math.sin(lean) + sy * Math.cos(lean)),
    ];
  };

  const STEPS = 48;
  const panelPts = [0, 1].flatMap((i) =>
    [1, -1].flatMap((side) => {
      const [ux, uz] = u[i];
      const pts: Pt[] = [];
      for (let s = 0; s <= STEPS; s++) {
        const th = -Math.PI / 2 + (Math.PI * s) / STEPS;
        const c = Math.cos(th) * side * r;
        pts.push(projectUnit(c * ux, Math.sin(th) * r, c * uz));
      }
      return pts;
    }),
  );
  let reach = 0;
  for (const [x, y] of panelPts) reach = Math.max(reach, Math.hypot(x, y));
  const S = reach > 0 ? ((size / 2) * 0.94) / reach : size * 0.4;

  const project = (x: number, y: number, z: number): Pt => {
    const [px, py] = projectUnit(x, y, z);
    return [C + S * px, C + S * py];
  };

  const panels = [0, 1].flatMap((i) =>
    [1, -1].map((side) => ({
      i,
      side,
      depth: side * u[i][1] * Math.cos(pitch),
    })),
  );
  panels.sort((a, b) => a.depth - b.depth);

  panels.forEach((p, idx) => {
    const [ux, uz] = u[p.i];
    ctx.beginPath();
    for (let s = 0; s <= STEPS; s++) {
      const th = -Math.PI / 2 + (Math.PI * s) / STEPS;
      const c = Math.cos(th) * p.side * r;
      const pt = project(c * ux, Math.sin(th) * r, c * uz);
      if (s === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    }
    ctx.closePath();
    ctx.fillStyle = palette[idx];
    ctx.strokeStyle = palette[idx];
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}
