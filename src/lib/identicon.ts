import { drawDiscs } from "@/lib/identiconDiscs";
import { drawGrammar, type GrammarInk, type GrammarShape } from "@/lib/identiconGrammar";
import { hashName, mulberry32 } from "@/lib/identiconRandom";
import type { IdenticonStyleMode } from "@/store/useFeatureFlags";
import { PROJECT_COLOR_STROKE, type ProjectColor } from "@/types";

// Grid v4 hex-flat + blob-melt identicon, ported from Sand-Toolkit
// (`web/src/identicon/render.ts` + `model.ts`). Same name hash, same
// mirrored deal, same kissing-hex geometry. Ink is the project-icon
// stroke token. Discs keep their own spectrum.

const GRID = 5;
const SCALE = 0.88;
/** Default Grid v4 combo seed. Same as the Sand-Toolkit starting value. */
export const DEFAULT_BOT_IDENTICON_SEED = 1;
const ON_CHANCE = 0.55;

function markSeed(name: string, comboSeed = DEFAULT_BOT_IDENTICON_SEED): number {
  return (hashName(name) ^ Math.imul(comboSeed, 0x85ebca6b)) >>> 0;
}

/** Next combo seed. Color stays on the agent; only the mark changes. */
export function nextBotIdenticonSeed(current = DEFAULT_BOT_IDENTICON_SEED): number {
  return (current + 1) >>> 0;
}

interface V4Model {
  n: number;
  rows: boolean[][];
  dyRows: number;
}

function deriveV4(seed: number): V4Model {
  const n = GRID;
  const strips = n;
  const rnd = mulberry32(seed);
  const rows: boolean[][] = [];
  for (let s = 0; s < strips; s++) rows.push(new Array<boolean>(n - (s % 2)).fill(false));
  for (let row = 0; row < strips; row++) {
    const arr = rows[row];
    const m = arr.length;
    const half = Math.ceil(m / 2);
    for (let col = 0; col < half; col++) {
      const on = rnd() < ON_CHANCE;
      arr[col] = on;
      arr[m - 1 - col] = on;
    }
  }
  if (!rows.some((r) => r.some(Boolean))) {
    const m = Math.floor(strips / 2);
    rows[m][Math.floor(rows[m].length / 2)] = true;
  }
  let rMin = strips;
  let rMax = -1;
  for (let row = 0; row < strips; row++) {
    if (rows[row].some(Boolean)) {
      rMin = Math.min(rMin, row);
      rMax = Math.max(rMax, row);
    }
  }
  return { n, rows, dyRows: (strips - 1 - rMax - rMin) / 2 };
}

function hexGeometry(model: V4Model, size: number) {
  const { n, rows, dyRows } = model;
  const box = size * SCALE;
  const cell = box / n;
  const pitch = (cell * Math.sqrt(3)) / 2;
  const strips = rows.length;
  const inkP = (strips - 1) * pitch + cell;
  const x0 = (size - box) / 2;
  const y0 = (size - inkP) / 2 + dyRows * pitch;
  const ctr = (row: number, col: number) => ({
    x: x0 + (col + 0.5 + (row % 2) * 0.5) * cell,
    y: y0 + cell / 2 + row * pitch,
  });
  const on = (row: number, col: number) =>
    row >= 0 && row < strips && col >= 0 && col < rows[row].length && rows[row][col];
  const pairs: { a: { x: number; y: number }; b: { x: number; y: number } }[] = [];
  const push = (r1: number, c1: number, r2: number, c2: number) =>
    pairs.push({ a: ctr(r1, c1), b: ctr(r2, c2) });
  for (let row = 0; row < strips; row++) {
    for (let col = 0; col < rows[row].length; col++) {
      if (!rows[row][col]) continue;
      if (on(row, col + 1)) push(row, col, row, col + 1);
      const off = row % 2 === 0 ? -1 : 0;
      for (const dc of [0, 1] as const) {
        if (on(row + 1, col + off + dc)) push(row, col, row + 1, col + off + dc);
      }
    }
  }
  return { cell, ctr, pairs };
}

function bridgeRect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  r: number,
): { x: number; y: number }[] {
  const d = Math.hypot(b.x - a.x, b.y - a.y);
  const nx = (-(b.y - a.y) / d) * r;
  const ny = ((b.x - a.x) / d) * r;
  return [
    { x: a.x + nx, y: a.y + ny },
    { x: b.x + nx, y: b.y + ny },
    { x: b.x - nx, y: b.y - ny },
    { x: a.x - nx, y: a.y - ny },
  ];
}

function circleSubpath(cx: number, cy: number, r: number, f: (v: number) => number): string {
  return `M ${f(cx + r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 1 ${f(cx - r)} ${f(cy)} A ${f(r)} ${f(r)} 0 1 1 ${f(cx + r)} ${f(cy)} Z`;
}

function polySubpath(pts: { x: number; y: number }[], f: (v: number) => number): string {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    area += a.x * b.y - b.x * a.y;
  }
  const seq = area < 0 ? [...pts].reverse() : pts;
  return `M ${seq.map((p) => `${f(p.x)} ${f(p.y)}`).join(" L ")} Z`;
}

function inkFill(color: ProjectColor): string {
  return PROJECT_COLOR_STROKE[color];
}

const DRAW_SIZE = 64;

/** SVG mark for a bot name. Shape is deterministic. Hue comes from `color`. */
export function botIdenticonSvg(
  name: string,
  color: ProjectColor,
  comboSeed = DEFAULT_BOT_IDENTICON_SEED,
): string {
  const model = deriveV4(markSeed(name.trim() || "bot", comboSeed));
  const { cell, ctr, pairs } = hexGeometry(model, DRAW_SIZE);
  const r = cell / 2;
  const f = (v: number) => +v.toFixed(2);
  const parts: string[] = [];
  for (let row = 0; row < model.rows.length; row++) {
    for (let col = 0; col < model.rows[row].length; col++) {
      if (!model.rows[row][col]) continue;
      const q = ctr(row, col);
      parts.push(circleSubpath(q.x, q.y, r, f));
    }
  }
  for (const { a, b } of pairs) {
    parts.push(polySubpath(bridgeRect(a, b, r), f));
  }
  const fill = inkFill(color);
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${DRAW_SIZE} ${DRAW_SIZE}" width="100%" height="100%" aria-hidden="true">`,
    `<path fill="${fill}" fill-rule="nonzero" d="${parts.join(" ")}"/>`,
    `</svg>`,
  ].join("");
}

const BOT_HUES: ProjectColor[] = [
  "yellow",
  "purple",
  "red",
  "blue",
  "orange",
  "green",
  "cyan",
  "magenta",
];

/** Deal a family token from the name. Same hash as the mark. */
export function botColorFromName(name: string): ProjectColor {
  const rnd = mulberry32(markSeed(name.trim() || "bot"));
  return BOT_HUES[Math.floor(rnd() * BOT_HUES.length)] ?? "blue";
}

/** Sand-Toolkit IdenticonApp name seed. Used by styles 2–6. */
function grammarSeed(name: string, comboSeed: number): number {
  return (hashName(name) ^ Math.imul(comboSeed, 0x9e3779b9)) >>> 0;
}

const GRAMMAR_DIALS: Record<
  Exclude<IdenticonStyleMode, "1" | "4">,
  { shape: GrammarShape; complexity: number; weight: number; background: boolean }
> = {
  "2": { shape: "orbit", complexity: 2, weight: 1.8, background: false },
  "3": { shape: "wire", complexity: 1, weight: 1.8, background: false },
  "5": { shape: "sensor", complexity: 3, weight: 1, background: false },
};

/** Canvas mark for styles 2–5. Style 1 stays on `botIdenticonSvg`. */
export function drawBotIdenticon(
  ctx: CanvasRenderingContext2D,
  name: string,
  color: ProjectColor,
  comboSeed: number | undefined,
  style: IdenticonStyleMode,
  size: number,
  ink: GrammarInk,
): void {
  const seed = grammarSeed(name.trim() || "bot", comboSeed ?? DEFAULT_BOT_IDENTICON_SEED);
  switch (style) {
    case "1":
      return;
    case "2":
    case "3":
    case "5": {
      const dials = GRAMMAR_DIALS[style];
      drawGrammar(
        ctx,
        seed,
        dials.shape,
        {
          complexity: dials.complexity,
          weight: dials.weight,
          ink,
          background: dials.background,
        },
        size,
      );
      return;
    }
    case "4":
      drawDiscs(ctx, seed, size, color);
      return;
    default: {
      const _exhaustive: never = style;
      return _exhaustive;
    }
  }
}
