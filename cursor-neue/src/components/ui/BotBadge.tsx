import type { CSSProperties } from "react";
import clsx from "clsx";
import { BotIdenticon } from "@/components/ui/BotIdenticon";
import { useFeatureFlags } from "@/store/useFeatureFlags";
import { PROJECT_COLOR_STROKE, type ProjectColor } from "@/types";

const DEFAULT_SIZE = 80;

function wellStyle(color: ProjectColor, size: number, circle: boolean): CSSProperties {
  const key = PROJECT_COLOR_STROKE[color];
  const fillFrom = `color-mix(in oklab, ${key} 18%, var(--bg-chrome))`;
  const fillTo = `color-mix(in oklab, ${key} 8%, var(--bg-chrome))`;
  const strokeFrom = `color-mix(in oklab, ${key} 48%, transparent)`;
  const strokeTo = `color-mix(in oklab, ${key} 20%, transparent)`;
  return {
    width: size,
    height: size,
    borderRadius: circle ? size / 2 : Math.round(size * 0.2),
    border: "1px solid transparent",
    backgroundImage: `linear-gradient(var(--badge-angle), ${fillFrom}, ${fillTo}), linear-gradient(var(--badge-angle), ${strokeFrom}, ${strokeTo})`,
    backgroundOrigin: "padding-box, border-box",
    backgroundClip: "padding-box, border-box",
  };
}

const WELL_CLASS =
  "flex items-center justify-center [--badge-angle:0deg] dark:[--badge-angle:180deg]";

/** Identicon in a tinted well. Shared by the bot chat header and tracker cover. */
export function BotBadge({
  name,
  color,
  size = DEFAULT_SIZE,
  seed,
  onRemix,
  circle = false,
}: {
  name: string;
  color: ProjectColor;
  size?: number;
  seed?: number;
  onRemix?: () => void;
  /** Circular well. The mark shrinks so it stays inside the clip. */
  circle?: boolean;
}) {
  const identiconStyle = useFeatureFlags((s) => s.identiconStyle);
  const markScale =
    (identiconStyle === "2" || identiconStyle === "3" || identiconStyle === "4"
      ? 0.92
      : identiconStyle === "5"
        ? 0.78
        : 0.62) * (circle ? 0.82 : 1);
  const mark = (
    <BotIdenticon name={name} color={color} size={Math.round(size * markScale)} seed={seed} />
  );
  const well = wellStyle(color, size, circle);
  const wellClass = clsx(WELL_CLASS, circle && "overflow-hidden");
  if (onRemix) {
    return (
      <button
        type="button"
        aria-label="Remix icon"
        onClick={onRemix}
        className={clsx(wellClass, "cursor-pointer")}
        style={well}
      >
        {mark}
      </button>
    );
  }
  return (
    <div className={wellClass} style={well}>
      {mark}
    </div>
  );
}
