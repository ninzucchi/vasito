import { BotBadge } from "@/components/ui/BotBadge";
import { OutlineButton } from "@/components/ui/OutlineButton";
import { useWindowId } from "@/components/window/WindowContext";
import { useActiveContent, useWorkspaceStore } from "@/store/useWorkspaceStore";
import type { Agent } from "@/types";

/** Centered hero at the top of a bot conversation. */
export function BotThreadHeader({ bot }: { bot: Agent }) {
  const color = bot.color ?? "blue";
  const windowId = useWindowId();
  const contentOpen = useActiveContent().open;
  const openPinnedTab = useWorkspaceStore((s) => s.openPinnedTab);
  const remixBotIdenticon = useWorkspaceStore((s) => s.remixBotIdenticon);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <BotBadge
        name={bot.title}
        color={color}
        seed={bot.identiconSeed}
        onRemix={() => remixBotIdenticon(bot.id)}
      />
      <div className="flex max-w-[322px] flex-col items-center gap-2">
        <p className="text-center text-3xl font-medium text-primary">{bot.title}</p>
        {bot.description && (
          <p className="text-center text-base text-tertiary">{bot.description}</p>
        )}
      </div>
      <OutlineButton
        aria-pressed={contentOpen}
        aria-label="Show bot info"
        onClick={() => openPinnedTab(windowId, "bot")}
      >
        View Bot Info
      </OutlineButton>
    </div>
  );
}
