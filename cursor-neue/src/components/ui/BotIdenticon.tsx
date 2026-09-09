import { useLayoutEffect, useMemo, useRef } from "react";
import { botIdenticonSvg, drawBotIdenticon } from "@/lib/identicon";
import { useAppearanceStore } from "@/store/useAppearanceStore";
import { type IdenticonStyleMode, useFeatureFlags } from "@/store/useFeatureFlags";
import { PROJECT_COLOR_STROKE, type ProjectColor } from "@/types";

function readCssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function resolveToken(token: string): string {
  const key = token.match(/var\((--[\w-]+)/)?.[1];
  if (!key) return token;
  return readCssVar(key) || token;
}

function grammarInk(color: ProjectColor) {
  const stroke = resolveToken(PROJECT_COLOR_STROKE[color]);
  const chrome = readCssVar("--chrome") || "#141414";
  return {
    fg: stroke,
    bg: `color-mix(in oklab, ${stroke} 22%, ${chrome})`,
    accent: stroke,
  };
}

function BotIdenticonCanvas({
  name,
  color,
  size,
  seed,
  style,
}: {
  name: string;
  color: ProjectColor;
  size: number;
  seed?: number;
  style: IdenticonStyleMode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme = useAppearanceStore((s) => s.theme);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(size * dpr));
    canvas.height = Math.max(1, Math.round(size * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    drawBotIdenticon(ctx, name, color, seed, style, size, grammarInk(color));
  }, [name, color, size, seed, style, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      aria-hidden="true"
      className="block"
      style={{ width: size, height: size }}
    />
  );
}

/** Bot mark. Size is the CSS box. Style 1 is SVG; styles 2–5 draw on canvas. */
export function BotIdenticon({
  name,
  color,
  size,
  seed,
}: {
  name: string;
  color: ProjectColor;
  size: number;
  seed?: number;
}) {
  const style = useFeatureFlags((s) => s.identiconStyle);
  const svg = useMemo(
    () => (style === "1" ? botIdenticonSvg(name, color, seed) : ""),
    [style, name, color, seed],
  );
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {style === "1" ? (
        <span
          className="block size-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <BotIdenticonCanvas
          name={name}
          color={color}
          size={size}
          seed={seed}
          style={style}
        />
      )}
    </span>
  );
}
