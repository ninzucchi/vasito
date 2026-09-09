import clsx from "clsx";
import { Icon } from "@/components/ui/Icon";
import {
  PROJECT_COLOR_LABEL,
  PROJECT_COLOR_SWATCH,
  PROJECT_COLORS,
  type ProjectColor,
} from "@/types";

const CELL =
  "relative flex size-[34px] shrink-0 items-center justify-center rounded-lg hover:bg-quaternary";

const PICKER_COLORS = PROJECT_COLORS.filter((id) => id !== "brand");

/** 3×3 color swatches. Clicks write through and stay open. */
export function BotIdentityPicker({
  color,
  onPickColor,
}: {
  color: ProjectColor;
  onPickColor: (color: ProjectColor) => void;
}) {
  return (
    <div className="p-2">
      <div
        role="group"
        aria-label="Bot color"
        className="grid grid-cols-3 items-center justify-items-center gap-[2px]"
      >
        {PICKER_COLORS.map((id) => {
          const selected = id === color;
          return (
            <button
              key={id}
              type="button"
              aria-label={PROJECT_COLOR_LABEL[id]}
              aria-pressed={selected}
              onClick={() => onPickColor(id)}
              className={clsx(CELL, selected && "bg-quaternary")}
            >
              <span
                className="pointer-events-none block size-5 rounded-full"
                style={{
                  background: PROJECT_COLOR_SWATCH[id],
                  boxShadow:
                    id === "default" ? "inset 0 0 0 1px var(--border-secondary)" : undefined,
                }}
              />
              {selected && (
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <Icon
                    name="check"
                    size="xs"
                    color="inherit"
                    style={{
                      color:
                        id === "default" ? "var(--text-primary)" : "var(--text-inverted)",
                    }}
                  />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
