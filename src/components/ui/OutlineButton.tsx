import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

export type OutlineButtonSize = "sm" | "md";

const SIZE: Record<OutlineButtonSize, string> = {
  sm: "h-6 px-1.5",
  md: "h-8 px-2",
};

/** Figma OutlineButton. Hairline secondary stroke, no fill. `md` is Size 32. */
export function OutlineButton({
  className,
  children,
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: OutlineButtonSize }) {
  return (
    <button
      type="button"
      className={clsx(
        "flex items-center justify-center rounded-md border border-secondary text-base text-primary hover:bg-quaternary",
        SIZE[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
