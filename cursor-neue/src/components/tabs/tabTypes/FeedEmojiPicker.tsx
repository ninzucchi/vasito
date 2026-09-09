import { EmojiPicker, type Emoji } from "frimousse";

/** Headless frimousse picker, styled with chrome tokens. */
export function FeedEmojiPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <EmojiPicker.Root
      className="isolate flex h-[320px] w-[280px] flex-col overflow-hidden rounded-lg bg-elevated text-primary shadow-popover"
      onEmojiSelect={(emoji: Emoji) => onPick(emoji.emoji)}
    >
      <EmojiPicker.Search
        className="mx-2 mt-2 appearance-none rounded-md bg-tertiary px-2 py-1.5 text-sm text-primary outline-none placeholder:text-quaternary"
        placeholder="Search emoji"
      />
      <EmojiPicker.Viewport className="relative min-h-0 flex-1 outline-none">
        <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-sm text-tertiary">
          Loading…
        </EmojiPicker.Loading>
        <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-sm text-tertiary">
          No emoji found.
        </EmojiPicker.Empty>
        <EmojiPicker.List
          className="select-none pb-1.5"
          components={{
            CategoryHeader: ({ category, ...props }) => (
              <div
                className="sticky top-0 bg-elevated px-3 pb-1 pt-2 text-xs text-tertiary"
                {...props}
              >
                {category.label}
              </div>
            ),
            Row: ({ children, ...props }) => (
              <div className="scroll-my-1.5 px-1.5" {...props}>
                {children}
              </div>
            ),
            Emoji: ({ emoji, ...props }) => (
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-tertiary data-[active]:bg-tertiary"
                {...props}
              >
                {emoji.emoji}
              </button>
            ),
          }}
        />
      </EmojiPicker.Viewport>
    </EmojiPicker.Root>
  );
}
