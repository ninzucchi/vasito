// Grammar identicons, ported from Sand-Toolkit `web/src/identicon/grammar.ts`.
// Geometry, variant deal, and stroke rules stay the same. Ink is this
// project's family tokens. Hosts for Single sensor keep the Baby Grok roster.

import { mulberry32 } from "@/lib/identiconRandom";

export interface GrammarInk {
  bg: string;
  fg: string;
  accent: string;
}

export type GrammarShape = "orbit" | "wire" | "sensor";

interface Ctl {
  rnd: () => number;
  n: number;
  w: number;
  /** CSS pixel size of the canvas. Stroke uses this so large marks stay thin. */
  size: number;
  variant: string;
  ink: GrammarInk;
}

/** Sidebar BotIdenticon size. Linear unit stroke is too heavy above this. */
const STROKE_REF = 18;

function strokeWidth(c: Ctl): number {
  return (0.026 * c.w * STROKE_REF) / Math.max(c.size, 1);
}

type Draw = (ctx: CanvasRenderingContext2D, c: Ctl) => void;
type Pt = { x: number; y: number };
type V3 = [number, number, number];

const TAU = Math.PI * 2;
const pt = (x: number, y: number): Pt => ({ x, y });
const pick = <T,>(rnd: () => number, list: readonly T[]): T =>
  list[Math.floor(rnd() * list.length)];
const between = (rnd: () => number, a: number, b: number) => a + (b - a) * rnd();
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

function assertNever(x: never): never {
  throw new Error(`unhandled variant ${String(x)}`);
}

function chooseVariant<T extends string>(c: Ctl, variants: readonly T[]): T {
  const dealt = pick(c.rnd, variants);
  return (variants as readonly string[]).includes(c.variant) ? (c.variant as T) : dealt;
}

function regular(k: number, r: number, rot: number): Pt[] {
  return Array.from({ length: k }, (_, i) => {
    const a = rot + (i / k) * TAU;
    return pt(Math.cos(a) * r, Math.sin(a) * r);
  });
}

function circlePts(x: number, y: number, r: number, k = 48): Pt[] {
  return Array.from({ length: k }, (_, i) => {
    const a = (i / k) * TAU;
    return pt(x + Math.cos(a) * r, y + Math.sin(a) * r);
  });
}

function arcPts(x: number, y: number, r: number, a0: number, a1: number, k: number): Pt[] {
  return Array.from({ length: k + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / k;
    return pt(x + Math.cos(a) * r, y + Math.sin(a) * r);
  });
}

function circlePath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.arc(x, y, r, 0, TAU);
}

function polyPath(ctx: CanvasRenderingContext2D, pts: Pt[], close = true) {
  pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  if (close) ctx.closePath();
}

function roundedPolygon(pts: Pt[], r: number, steps = 6): Pt[] {
  const k = pts.length;
  const out: Pt[] = [];
  for (let i = 0; i < k; i++) {
    const p = pts[(i - 1 + k) % k];
    const q = pts[i];
    const s = pts[(i + 1) % k];
    const ax = p.x - q.x;
    const ay = p.y - q.y;
    const bx = s.x - q.x;
    const by = s.y - q.y;
    const la = Math.hypot(ax, ay) || 1;
    const lb = Math.hypot(bx, by) || 1;
    const ux = ax / la;
    const uy = ay / la;
    const vx = bx / lb;
    const vy = by / lb;
    const cosT = clamp(ux * vx + uy * vy, -1, 1);
    const theta = Math.acos(cosT);
    const d = Math.min(r / Math.tan(theta / 2), la * 0.45, lb * 0.45);
    const rr = d * Math.tan(theta / 2);
    const t1 = pt(q.x + ux * d, q.y + uy * d);
    const t2 = pt(q.x + vx * d, q.y + vy * d);
    const bxn = ux + vx;
    const byn = uy + vy;
    const bl = Math.hypot(bxn, byn) || 1;
    const cx = q.x + (bxn / bl) * (rr / Math.sin(theta / 2));
    const cy = q.y + (byn / bl) * (rr / Math.sin(theta / 2));
    const a1 = Math.atan2(t1.y - cy, t1.x - cx);
    let a2 = Math.atan2(t2.y - cy, t2.x - cx);
    let delta = a2 - a1;
    while (delta <= -Math.PI) delta += TAU;
    while (delta > Math.PI) delta -= TAU;
    a2 = a1 + delta;
    for (let j = 0; j <= steps; j++) {
      const a = a1 + ((a2 - a1) * j) / steps;
      out.push(pt(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr));
    }
  }
  return out;
}

function pointInPoly(p: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

function strokeSetup(ctx: CanvasRenderingContext2D, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
}

function projector(yaw: number, pitch: number) {
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return (p: V3): Pt & { z: number } => {
    const x = p[0] * cy - p[2] * sy;
    const z = p[0] * sy + p[2] * cy;
    const y = p[1] * cp - z * sp;
    return { x, y, z: p[1] * sp + z * cp };
  };
}

function fitScale(pts: Pt[], radius: number): number {
  let m = 0;
  for (const p of pts) m = Math.max(m, Math.hypot(p.x, p.y));
  return m > 0 ? radius / m : 1;
}

interface Solid {
  verts: V3[];
  faces: number[][];
}

function faceNormal(s: Solid, face: number[]): V3 {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < face.length; i++) {
    const a = s.verts[face[i]];
    const b = s.verts[face[(i + 1) % face.length]];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const l = Math.hypot(nx, ny, nz) || 1;
  return [nx / l, ny / l, nz / l];
}

function fixWinding(s: Solid, inside: V3): Solid {
  const faces = s.faces.map((f) => {
    const n = faceNormal(s, f);
    const a = s.verts[f[0]];
    const toIn = [inside[0] - a[0], inside[1] - a[1], inside[2] - a[2]];
    const dot = n[0] * toIn[0] + n[1] * toIn[1] + n[2] * toIn[2];
    return dot > 0 ? [...f].reverse() : f;
  });
  return { verts: s.verts, faces };
}

function box(w: number, h: number, d: number, cx = 0, cy = 0, cz = 0): Solid {
  const x = w / 2;
  const y = h / 2;
  const z = d / 2;
  const verts: V3[] = [
    [cx - x, cy - y, cz - z],
    [cx + x, cy - y, cz - z],
    [cx + x, cy + y, cz - z],
    [cx - x, cy + y, cz - z],
    [cx - x, cy - y, cz + z],
    [cx + x, cy - y, cz + z],
    [cx + x, cy + y, cz + z],
    [cx - x, cy + y, cz + z],
  ];
  const faces = [
    [0, 1, 2, 3],
    [5, 4, 7, 6],
    [4, 5, 1, 0],
    [3, 2, 6, 7],
    [4, 0, 3, 7],
    [1, 5, 6, 2],
  ];
  return fixWinding({ verts, faces }, [cx, cy, cz]);
}

function pyramidSolid(base: number, height: number): Solid {
  const b = base / 2;
  const verts: V3[] = [
    [-b, height / 2, -b],
    [b, height / 2, -b],
    [b, height / 2, b],
    [-b, height / 2, b],
    [0, -height / 2, 0],
  ];
  const faces = [[0, 1, 2, 3], [0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4]];
  return fixWinding({ verts, faces }, [0, 0, 0]);
}

function d10Solid(): Solid {
  const verts: V3[] = [
    [0, -1.15, 0],
    [0, 1.15, 0],
  ];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    verts.push([Math.cos(a), -0.16, Math.sin(a)]);
  }
  for (let i = 0; i < 5; i++) {
    const a = ((i + 0.5) / 5) * TAU;
    verts.push([Math.cos(a), 0.16, Math.sin(a)]);
  }
  const faces: number[][] = [];
  for (let i = 0; i < 5; i++) {
    const A = 2 + i;
    const A2 = 2 + ((i + 1) % 5);
    const B = 7 + i;
    const B0 = 7 + ((i + 4) % 5);
    faces.push([0, A, B, A2]);
    faces.push([1, B0, A, B]);
  }
  return fixWinding({ verts, faces }, [0, 0, 0]);
}

function viewSolid(
  s: Solid,
  proj: (p: V3) => Pt & { z: number },
  minDihedralDeg: number,
): { seams: [Pt, Pt][]; rims: [Pt, Pt][] } {
  const projected = s.verts.map(proj);
  const normals = s.faces.map((f) => faceNormal(s, f));
  const visible = normals.map((n) => proj(n).z < 0);
  const edgeFaces = new Map<string, number[]>();
  s.faces.forEach((f, fi) => {
    for (let i = 0; i < f.length; i++) {
      const u = f[i];
      const v = f[(i + 1) % f.length];
      const key = u < v ? `${u}:${v}` : `${v}:${u}`;
      (edgeFaces.get(key) ?? edgeFaces.set(key, []).get(key)!).push(fi);
    }
  });
  const seams: [Pt, Pt][] = [];
  const rims: [Pt, Pt][] = [];
  for (const [key, fs] of edgeFaces) {
    const [u, v] = key.split(":").map(Number);
    const vis = fs.filter((fi) => visible[fi]);
    if (vis.length === 2) {
      const n1 = normals[vis[0]];
      const n2 = normals[vis[1]];
      const ang =
        (Math.acos(clamp(n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2], -1, 1)) * 180) / Math.PI;
      if (ang >= minDihedralDeg) seams.push([projected[u], projected[v]]);
    } else if (vis.length === 1 && fs.length >= 1) {
      rims.push([projected[u], projected[v]]);
    }
  }
  return { seams, rims };
}

// ---- Single sensor hosts (Baby Grok roster) ----

const HOSTS = [
  "blob",
  "cloud",
  "square",
  "sparkle",
  "clover",
  "heart",
  "flower",
  "teardrop",
  "tablet",
  "wedge",
  "hex",
  "arch",
  "house",
  "ring",
] as const;
type Host = (typeof HOSTS)[number];

const HOST_PATH: Record<
  Exclude<Host, "cloud" | "square" | "clover" | "wedge" | "hex" | "ring" | "arch">,
  string
> = {
  blob: "M228.541 114.228C228.541 130.133 225.184 145.994 218.738 160.534C212.674 174.217 203.904 186.669 193.065 196.988C155.933 232.34 99.497 238.596 55.5255 212.24C45.097 205.99 35.6851 198.072 27.7451 188.866C19.1926 178.953 12.3686 167.569 7.65781 155.351C2.60712 142.264 0 128.257 0 114.228C0 98.3219 3.35751 82.4611 9.80315 67.9215C15.8672 54.2382 24.6377 41.7862 35.4767 31.4668C72.6081 -3.88483 129.044 -10.1413 173.016 16.2153C183.444 22.4653 192.856 30.3829 200.796 39.5896C209.349 49.5018 216.173 60.8859 220.883 73.1037C225.934 86.1906 228.541 100.198 228.541 114.228Z",
  sparkle:
    "M155.086 92.9218C158.178 109.308 135.028 118.638 99.8452 115.182C89.7934 137.343 76.6572 152.843 64.8098 155.078C48.4228 158.171 39.0925 135.017 42.55 99.8337H42.5469C10.3522 85.2353 -5.03658 65.5765 5.83351 52.9304C13.6923 43.7877 33.683 40.1603 57.8996 42.5351C72.4979 10.34 92.1556 -5.04403 104.801 5.82563C113.943 13.684 117.571 33.6745 115.197 57.8891C137.355 67.9406 152.853 81.0755 155.086 92.9218Z",
  heart:
    "M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z",
  flower:
    "M58.9439 9.25317C63.2493 -3.08446 80.6975 -3.08447 85.0029 9.25317L91.7613 28.6206C94.0137 35.0751 100.652 38.9077 107.368 37.6311L127.52 33.8004C140.357 31.3601 149.081 46.4707 140.549 56.3681L127.156 71.9048C122.692 77.0826 122.692 84.7479 127.156 89.9257L140.549 105.462C149.081 115.36 140.357 130.47 127.52 128.03L107.368 124.199C100.652 122.923 94.0137 126.755 91.7613 133.21L85.0029 152.577C80.6975 164.915 63.2493 164.915 58.9439 152.577L52.1854 133.21C49.9331 126.756 43.2947 122.923 36.5789 124.199L16.4269 128.03C3.58953 130.47 -5.13458 115.36 3.39745 105.462L16.7909 89.9257C21.2544 84.7479 21.2544 77.0826 16.7909 71.9048L3.39745 56.3681C-5.13458 46.4707 3.58952 31.3601 16.4269 33.8004L36.5789 37.6311C43.2947 38.9077 49.9331 35.0751 52.1854 28.6206L58.9439 9.25317Z",
  teardrop:
    "M56.8031 0C54.8156 1.01118 52.6654 1.75503 50.8406 3.04516C49.7597 3.81226 49.0856 5.04427 48.2371 6.0787C46.5867 8.08943 44.9711 10.1234 43.3323 12.1458C34.3363 23.2804 25.3403 34.415 16.3443 45.5496C9.92852 53.4879 5.20968 59.9037 2.28075 69.8411C-4.75102 93.6794 4.84937 120.202 25.9447 133.615C32.5115 137.788 42.17 141.821 49.7364 142.727C60.441 144.006 65.3342 142.902 75.1089 139.694C82.6637 137.207 89.6141 132.918 95.4487 127.548C100.168 123.201 104.108 118.029 107.095 112.357C109.617 107.592 111.418 102.455 112.499 97.1778C114.975 84.9275 113.325 71.9332 107.757 60.7405C104.979 55.1383 101.167 50.3846 97.2619 45.5496C89.0795 35.4261 80.9087 25.3144 72.7262 15.1909C70.2738 12.1458 67.8447 9.08899 65.369 6.0787C64.5206 5.04427 63.8465 3.81226 62.7655 3.04516C60.9408 1.75503 58.7906 1.01118 56.8031 0Z",
  tablet:
    "M142.44 46.2475C142.44 67.6475 127.53 86.4075 106.71 91.2675C103.56 92.0075 100.34 92.4075 97.11 92.4675C93.95 92.5275 95.6 92.3975 92.5 92.4075C86.01 92.4375 79.52 92.3075 73.04 92.4475C67.43 92.5575 61.82 92.4475 56.22 92.4075C50.19 92.3675 44.12 92.8275 38.15 91.7675C26.95 89.7775 16.69 83.5875 9.72 74.5975C6.9 70.9675 4.63 66.9275 3 62.6275C1.02 57.4075 0 51.8275 0 46.2475C0 24.8475 14.91 6.08753 35.73 1.22753C38.88 0.487526 42.1 0.0875252 45.33 0.0275252C48.49 -0.0324748 46.84 0.0975266 49.94 0.0875266C56.43 0.0575266 62.92 0.187526 69.4 0.0475257C75.01 -0.0624743 80.62 0.0475266 86.22 0.0875266C92.25 0.127527 98.32 -0.332474 104.29 0.727526C115.49 2.71753 125.75 8.90753 132.72 17.8975C135.54 21.5275 137.81 25.5675 139.44 29.8675C141.42 35.0875 142.44 40.6675 142.44 46.2475Z",
  house:
    "M138.697 121.726C138.697 130.845 131.305 138.238 122.186 138.238H16.5116C7.3925 138.238 0 130.845 0 121.726V54.1567C0 48.8172 2.58197 43.8074 6.93057 40.7091L59.7676 3.06406C65.5017 -1.02136 73.1956 -1.02135 78.9297 3.06406L131.767 40.7091C136.115 43.8074 138.697 48.8172 138.697 54.1567V121.726Z",
};

interface Disc {
  x: number;
  y: number;
  r: number;
}

interface HostGeo {
  outline: Pt[];
  hole?: Pt[];
  paint?: (ctx: CanvasRenderingContext2D) => void;
}

function bboxOf(pts: readonly Pt[]): { cx: number; cy: number; reach: number } {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (const p of pts) {
    if (p.x < x0) x0 = p.x;
    if (p.x > x1) x1 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.y > y1) y1 = p.y;
  }
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  let reach = 0;
  for (const p of pts) reach = Math.max(reach, Math.hypot(p.x - cx, p.y - cy));
  return { cx, cy, reach };
}

function distToPoly(poly: Pt[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy || 1;
    const t = clamp(((x - a.x) * dx + (y - a.y) * dy) / len2, 0, 1);
    best = Math.min(best, Math.hypot(x - (a.x + t * dx), y - (a.y + t * dy)));
  }
  return best;
}

function inflateClosed(poly: Pt[], pad: number, samples = 240): Pt[] {
  const { cx, cy, reach } = bboxOf(poly);
  const hi0 = reach + pad + 0.08;
  const inside = (x: number, y: number) =>
    pointInPoly(pt(x, y), poly) || distToPoly(poly, x, y) <= pad;
  const out: Pt[] = [];
  for (let i = 0; i < samples; i++) {
    const a = (i / samples) * TAU;
    const c = Math.cos(a);
    const s = Math.sin(a);
    let lo = 0;
    let hi = hi0;
    for (let k = 0; k < 24; k++) {
      const mid = (lo + hi) / 2;
      if (inside(cx + c * mid, cy + s * mid)) lo = mid;
      else hi = mid;
    }
    out.push(pt(cx + c * lo, cy + s * lo));
  }
  return out;
}

function scaleDiscs(raw: readonly (readonly [number, number, number])[], R: number): Disc[] {
  const pts: Pt[] = [];
  for (const [x, y, r] of raw) {
    pts.push(pt(x - r, y - r), pt(x + r, y + r));
  }
  const { cx, cy, reach } = bboxOf(pts);
  const k = reach > 0 ? R / reach : 1;
  return raw.map(([x, y, r]) => ({ x: (x - cx) * k, y: (y - cy) * k, r: r * k }));
}

function discsOutline(discs: Disc[], steps = 72): Pt[] {
  const out: Pt[] = [];
  discs.forEach((d, i) => {
    for (let k = 0; k < steps; k++) {
      const a = (k / steps) * TAU;
      const p = pt(d.x + Math.cos(a) * d.r, d.y + Math.sin(a) * d.r);
      if (discs.every((o, j) => j === i || Math.hypot(p.x - o.x, p.y - o.y) >= o.r - 1e-5)) {
        out.push(p);
      }
    }
  });
  const { cx, cy } = bboxOf(out.length ? out : [pt(0, 0)]);
  out.sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
  return out;
}

function hostFromDiscs(raw: readonly (readonly [number, number, number])[], R: number): HostGeo {
  const discs = scaleDiscs(raw, R);
  const outline = discsOutline(discs);
  return {
    outline,
    paint(ctx) {
      ctx.beginPath();
      for (const d of discs) circlePath(ctx, d.x, d.y, d.r);
      ctx.fill();
    },
  };
}

function flattenPath(d: string, step = 3): Pt[] {
  const toks = d.match(/[MLCQHVZmlcqhvz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const out: Pt[] = [];
  let i = 0;
  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const num = () => parseFloat(toks[i++]);
  const walk = (f: (u: number) => Pt, len: number) => {
    const n = Math.max(2, Math.ceil(len / step));
    for (let k = 1; k <= n; k++) out.push(f(k / n));
  };
  while (i < toks.length) {
    if (/[a-z]/i.test(toks[i])) cmd = toks[i++].toUpperCase();
    if (cmd === "Z") {
      if (Math.hypot(sx - x, sy - y) > 0.01) {
        walk((u) => pt(x + (sx - x) * u, y + (sy - y) * u), Math.hypot(sx - x, sy - y));
      }
      x = sx;
      y = sy;
      continue;
    }
    if (i >= toks.length) break;
    if (cmd === "M") {
      x = num();
      y = num();
      sx = x;
      sy = y;
      out.push(pt(x, y));
      cmd = "L";
    } else if (cmd === "H") {
      const nx = num();
      walk((u) => pt(x + (nx - x) * u, y), Math.abs(nx - x));
      x = nx;
    } else if (cmd === "V") {
      const ny = num();
      walk((u) => pt(x, y + (ny - y) * u), Math.abs(ny - y));
      y = ny;
    } else if (cmd === "L") {
      const nx = num();
      const ny = num();
      walk((u) => pt(x + (nx - x) * u, y + (ny - y) * u), Math.hypot(nx - x, ny - y));
      x = nx;
      y = ny;
    } else if (cmd === "C") {
      const x1 = num();
      const y1 = num();
      const x2 = num();
      const y2 = num();
      const nx = num();
      const ny = num();
      const px = x;
      const py = y;
      walk((u) => {
        const m = 1 - u;
        return pt(
          m * m * m * px + 3 * m * m * u * x1 + 3 * m * u * u * x2 + u * u * u * nx,
          m * m * m * py + 3 * m * m * u * y1 + 3 * m * u * u * y2 + u * u * u * ny,
        );
      }, Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(nx - x2, ny - y2));
      x = nx;
      y = ny;
    } else {
      i++;
    }
  }
  return out;
}

function heartGeo(R: number): HostGeo {
  const outline = flattenPath(HOST_PATH.heart, 1.2);
  const { cx, cy, reach } = bboxOf(outline.length ? outline : [pt(0, 0)]);
  const k = reach > 0 ? R / reach : 1;
  return {
    outline: outline.map((p) => pt((p.x - cx) * k, (p.y - cy) * k)),
    paint(ctx) {
      ctx.save();
      ctx.scale(k, k);
      ctx.translate(-cx, -cy);
      ctx.beginPath();
      ctx.moveTo(12, 21.35);
      ctx.lineTo(10.55, 20.03);
      ctx.bezierCurveTo(5.4, 15.36, 2, 12.28, 2, 8.5);
      ctx.bezierCurveTo(2, 5.42, 4.42, 3, 7.5, 3);
      ctx.bezierCurveTo(9.24, 3, 10.91, 3.81, 12, 5.09);
      ctx.bezierCurveTo(13.09, 3.81, 14.76, 3, 16.5, 3);
      ctx.bezierCurveTo(19.58, 3, 22, 5.42, 22, 8.5);
      ctx.bezierCurveTo(22, 12.28, 18.6, 15.36, 13.45, 20.03);
      ctx.lineTo(12, 21.35);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    },
  };
}

function hostFromPath(d: string, R: number): HostGeo {
  const pts = flattenPath(d, 3);
  const { cx, cy, reach } = bboxOf(pts.length ? pts : [pt(0, 0)]);
  const k = reach > 0 ? R / reach : 1;
  const outline = pts.map((p) => pt((p.x - cx) * k, (p.y - cy) * k));
  return {
    outline,
    paint(ctx) {
      ctx.save();
      ctx.scale(k, k);
      ctx.translate(-cx, -cy);
      ctx.fill(new Path2D(d));
      ctx.restore();
    },
  };
}

function hostGeo(host: Host, R: number): HostGeo {
  const simple = (outline: Pt[]): HostGeo => ({ outline });
  switch (host) {
    case "square":
      return simple(
        roundedPolygon(
          [
            pt(-0.9 * R, -0.9 * R),
            pt(0.9 * R, -0.9 * R),
            pt(0.9 * R, 0.9 * R),
            pt(-0.9 * R, 0.9 * R),
          ],
          0.26 * R,
        ),
      );
    case "wedge":
      return simple(roundedPolygon(regular(3, 1.15 * R, -Math.PI / 2), 0.28 * R));
    case "hex":
      return simple(roundedPolygon(regular(6, 1.02 * R, -Math.PI / 2), 0.24 * R));
    case "cloud": {
      const discs = scaleDiscs(
        [
          [-62, 26, 56],
          [62, 26, 54],
          [0, 34, 62],
          [-24, -30, 62],
          [38, -26, 54],
        ],
        R,
      );
      const outline = inflateClosed(discsOutline(discs), 0.08 * R);
      return {
        outline,
        paint(ctx) {
          ctx.beginPath();
          polyPath(ctx, outline);
          ctx.fill();
        },
      };
    }
    case "clover":
      return hostFromDiscs(
        [
          [-38, -38, 58],
          [38, -38, 58],
          [38, 38, 58],
          [-38, 38, 58],
        ],
        R,
      );
    case "ring": {
      const outline = circlePts(0, 0, R, 64);
      const hole = circlePts(0, 0, 0.46 * R, 64);
      return {
        outline,
        hole,
        paint(ctx) {
          ctx.beginPath();
          ctx.arc(0, 0, R, 0, TAU);
          ctx.closePath();
          ctx.arc(0, 0, 0.46 * R, 0, TAU, true);
          ctx.closePath();
          ctx.fill("evenodd");
        },
      };
    }
    case "arch": {
      // Figma KK arch (7354:147): semicircle stroke r=53.5, weight=56.8328.
      const mid = 53.5;
      const cap = 56.8328 / 2;
      const outer = mid + cap;
      const inner = mid - cap;
      const outline = [
        ...arcPts(0, 0, outer, Math.PI, TAU, 24),
        ...arcPts(mid, 0, cap, 0, Math.PI, 12),
        ...arcPts(0, 0, inner, TAU, Math.PI, 24),
        ...arcPts(-mid, 0, cap, 0, Math.PI, 12),
      ];
      return {
        outline,
        paint(ctx) {
          ctx.beginPath();
          ctx.moveTo(-outer, 0);
          ctx.arc(0, 0, outer, Math.PI, TAU);
          ctx.arc(mid, 0, cap, 0, Math.PI);
          ctx.arc(0, 0, inner, TAU, Math.PI, true);
          ctx.arc(-mid, 0, cap, 0, Math.PI);
          ctx.closePath();
          ctx.fill();
        },
      };
    }
    case "heart":
      return heartGeo(R);
    case "blob":
    case "sparkle":
    case "flower":
    case "teardrop":
    case "tablet":
    case "house":
      return hostFromPath(HOST_PATH[host], R);
    default:
      return assertNever(host);
  }
}

function hostPath(ctx: CanvasRenderingContext2D, g: HostGeo) {
  ctx.beginPath();
  polyPath(ctx, g.outline);
  if (g.hole) polyPath(ctx, [...g.hole].reverse());
}

const drawSensor: Draw = (ctx, c) => {
  const host = chooseVariant(c, HOSTS);
  const R = 0.3 + 0.02 * c.n;
  const g = hostGeo(host, R);
  ctx.fillStyle = c.ink.fg;
  if (g.paint) g.paint(ctx);
  else {
    hostPath(ctx, g);
    ctx.fill(g.hole ? "evenodd" : "nonzero");
  }
};

const WIRE_V = ["pyramid", "d10", "sphere", "planes", "cube"] as const;
const drawWire: Draw = (ctx, c) => {
  const v = chooseVariant(c, WIRE_V);
  const yaw = between(c.rnd, 0, TAU);
  const pitch = between(c.rnd, 0.3, 0.7);
  const proj = projector(yaw, pitch);
  const R = 0.37;
  strokeSetup(ctx, c.ink.fg, strokeWidth(c));
  if (v === "sphere") {
    const meridians = clamp(Math.ceil(c.n / 2) + 1, 2, 4);
    const parallels = clamp(Math.ceil(c.n / 2), 1, 3);
    ctx.beginPath();
    circlePath(ctx, 0, 0, R);
    ctx.stroke();
    const curves: V3[][] = [];
    for (let m = 0; m < meridians; m++) {
      const lam = (m / meridians) * Math.PI;
      curves.push(
        Array.from({ length: 97 }, (_, i) => {
          const t = (i / 96) * TAU;
          return [Math.sin(t) * Math.cos(lam), Math.cos(t), Math.sin(t) * Math.sin(lam)] as V3;
        }),
      );
    }
    for (let p = 0; p < parallels; p++) {
      const phi = ((p + 1) / (parallels + 1) - 0.5) * Math.PI;
      curves.push(
        Array.from({ length: 97 }, (_, i) => {
          const t = (i / 96) * TAU;
          return [Math.cos(phi) * Math.cos(t), Math.sin(phi), Math.cos(phi) * Math.sin(t)] as V3;
        }),
      );
    }
    ctx.beginPath();
    for (const curve of curves) {
      let pen = false;
      for (const p of curve) {
        const q = proj(p);
        if (q.z > 0) {
          pen = false;
          continue;
        }
        if (!pen) ctx.moveTo(q.x * R, q.y * R);
        else ctx.lineTo(q.x * R, q.y * R);
        pen = true;
      }
    }
    ctx.stroke();
    return;
  }
  let solid: Solid;
  switch (v) {
    case "pyramid":
      solid = pyramidSolid(1.5, 2.05);
      break;
    case "d10":
      solid = d10Solid();
      break;
    case "cube":
      solid = box(1, 1, 1);
      break;
    case "planes": {
      const k = clamp(c.n, 2, 5);
      const verts: V3[] = [];
      const faces: number[][] = [];
      for (let i = 0; i < k; i++) {
        const y = (i - (k - 1) / 2) * (2.2 / k);
        const b = verts.length;
        verts.push([-1, y, -1], [1, y, -1], [1, y, 1], [-1, y, 1]);
        faces.push([b, b + 1, b + 2, b + 3]);
      }
      solid = { verts, faces };
      break;
    }
    default:
      assertNever(v);
  }
  const projected = solid.verts.map(proj);
  const s = fitScale(projected, R);
  const edges = new Set<string>();
  if (v === "planes") {
    for (const f of solid.faces)
      for (let i = 0; i < f.length; i++) {
        const u = f[i];
        const w = f[(i + 1) % f.length];
        edges.add(u < w ? `${u}:${w}` : `${w}:${u}`);
      }
  } else {
    const view = viewSolid(solid, proj, 0);
    ctx.beginPath();
    for (const [a, b] of [...view.seams, ...view.rims]) {
      ctx.moveTo(a.x * s, a.y * s);
      ctx.lineTo(b.x * s, b.y * s);
    }
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  for (const key of edges) {
    const [u, w] = key.split(":").map(Number);
    ctx.moveTo(projected[u].x * s, projected[u].y * s);
    ctx.lineTo(projected[w].x * s, projected[w].y * s);
  }
  ctx.stroke();
};

const ORBIT_V = ["even", "fan"] as const;
const drawOrbit: Draw = (ctx, c) => {
  const v = chooseVariant(c, ORBIT_V);
  const k = 1 + Math.floor(c.rnd() * 5);
  const tilt = c.rnd() * Math.PI;
  const e = between(c.rnd, 0.3, 0.5);
  const a = 0.35;
  strokeSetup(ctx, c.ink.fg, strokeWidth(c));
  ctx.beginPath();
  for (let i = 0; i < k; i++) {
    const rx = a;
    const ry = a * e;
    let rot = tilt;
    switch (v) {
      case "even":
        rot = tilt + (i / k) * Math.PI;
        break;
      case "fan":
        rot = tilt + (k === 1 ? 0 : (i / (k - 1)) * (Math.PI * 0.72));
        break;
      default:
        assertNever(v);
    }
    const cs = Math.cos(rot);
    const sn = Math.sin(rot);
    for (let j = 0; j <= 96; j++) {
      const t = (j / 96) * TAU;
      const x0 = rx * Math.cos(t);
      const y0 = ry * Math.sin(t);
      const x = x0 * cs - y0 * sn;
      const y = x0 * sn + y0 * cs;
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  ctx.stroke();
};

const DRAW: Record<GrammarShape, Draw> = {
  orbit: drawOrbit,
  wire: drawWire,
  sensor: drawSensor,
};

export function drawGrammar(
  ctx: CanvasRenderingContext2D,
  seed: number,
  shape: GrammarShape,
  dials: { complexity: number; weight: number; ink: GrammarInk; background: boolean },
  size: number,
) {
  const c: Ctl = {
    rnd: mulberry32((seed ^ 0x3c6ef372) >>> 0),
    n: clamp(Math.round(dials.complexity), 1, 5),
    w: clamp(dials.weight, 0.4, 2.5),
    size,
    variant: "auto",
    ink: dials.ink,
  };
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, TAU);
  ctx.clip();
  if (dials.background) {
    ctx.fillStyle = c.ink.bg;
    ctx.fillRect(0, 0, size, size);
  }
  ctx.translate(size / 2, size / 2);
  ctx.scale(size, size);
  DRAW[shape](ctx, c);
  ctx.restore();
}
