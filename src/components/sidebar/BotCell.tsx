import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import clsx from "clsx";
import { isAgentPinned, type Agent } from "@/types";
import { useWindowId } from "@/components/window/WindowContext";
import { useWindow, useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useTabDragStore, type TabDragSource } from "@/store/tabDrag";
import { SidebarCell } from "@/components/sidebar/SidebarCell";
import { applySidebarAgentClick } from "@/components/sidebar/sidebarAgentSelection";
import { Icon } from "@/components/ui/Icon";
import { beginTabDrag } from "@/components/tile/tabDragInteraction";
import { isOutsideWindows, newWindowGeo } from "@/components/desktop/geometry";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSection,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

/** Singular bot row. Same open/drag path as a project; never a folder. */
export function BotCell({ bot, selected }: { bot: Agent; selected: boolean }) {
  const windowId = useWindowId();
  const activeAgentId = useWindow()?.activeAgentId;
  const archiveAgent = useWorkspaceStore((s) => s.archiveAgent);
  const setActiveAgent = useWorkspaceStore((s) => s.setActiveAgent);
  const updateAgentMeta = useWorkspaceStore((s) => s.updateAgentMeta);
  const togglePinnedAgent = useWorkspaceStore((s) => s.togglePinnedAgent);
  const pinned = useWorkspaceStore((s) => isAgentPinned(s.pinnedAgents, bot.id));
  const openAgentInTile = useWorkspaceStore((s) => s.openAgentInTile);
  const openAgentAtChatRoot = useWorkspaceStore((s) => s.openAgentAtChatRoot);
  const openAgentInNewWindow = useWorkspaceStore((s) => s.openAgentInNewWindow);
  const dragging = useTabDragStore((s) => {
    const ids = s.source?.agentIds ?? (s.source?.agentId ? [s.source.agentId] : []);
    return ids.includes(bot.id);
  });
  const didDragRef = useRef(false);

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) =>
    beginTabDrag(e, {
      createSource: (): TabDragSource => ({
        tileId: "",
        tabId: "",
        title: bot.title,
        icon: "agent",
        pane: "chat",
        tabType: "chat",
        agentId: bot.id,
        agentIds: [bot.id],
      }),
      suppressSelfTile: false,
      didDragRef,
      onDrop: (_source, target, pointer) => {
        if (target?.scope === "sidebar-section") {
          if (target.section === "pinned" && !pinned) togglePinnedAgent(bot.id);
          if (target.section === "chats" && pinned) togglePinnedAgent(bot.id);
          return;
        }
        if (target) {
          if (target.scope === "tile") {
            openAgentInTile(bot.id, target.tileId, target.zone);
          } else if (target.scope === "chat-root") {
            openAgentAtChatRoot(bot.id, target.windowId, target.side);
          }
        } else if (isOutsideWindows(pointer.x, pointer.y)) {
          openAgentInNewWindow(bot.id, newWindowGeo(pointer));
        }
      },
    });

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div data-sidebar-agent-id={bot.id} className={clsx(dragging && "opacity-40")}>
          <SidebarCell
            label={bot.title}
            leading={{
              kind: "bot",
              color: bot.color ?? "blue",
              name: bot.title,
              seed: bot.identiconSeed,
            }}
            selected={selected}
            onPointerDown={onPointerDown}
            onRename={(title) => updateAgentMeta(bot.id, { title })}
            onClick={(e) => {
              if (didDragRef.current) {
                didDragRef.current = false;
                return;
              }
              applySidebarAgentClick({
                windowId,
                agentId: bot.id,
                event: e,
                fromEl: e.currentTarget,
                activeAgentId,
                setActiveAgent,
              });
            }}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuSection>
          <ContextMenuItem onSelect={() => togglePinnedAgent(bot.id)}>
            <Icon name={pinned ? "pin-slash" : "pin"} size="base" color="tertiary" />
            {pinned ? "Unpin" : "Pin"}
          </ContextMenuItem>
        </ContextMenuSection>
        <ContextMenuSeparator />
        <ContextMenuSection>
          <ContextMenuItem onSelect={() => archiveAgent(bot.id)}>
            <Icon name="archive" size="base" color="tertiary" />
            Archive
          </ContextMenuItem>
        </ContextMenuSection>
      </ContextMenuContent>
    </ContextMenu>
  );
}
