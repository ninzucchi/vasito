import { isBot, isTrackerOwner, type Agent } from "@/types";
import { useBotsEnabled } from "@/store/useFeatureFlags";
import { useWindowId } from "@/components/window/WindowContext";
import { useStatusFocused, useWindow } from "@/store/useWorkspaceStore";
import { useUiStore } from "@/store/useUiStore";
import { AgentCell } from "@/components/sidebar/AgentCell";
import { BotCell } from "@/components/sidebar/BotCell";
import { ProjectGroup } from "@/components/sidebar/ProjectGroup";

/** A flat list of agent rows. Highlight follows the sidebar multi-select when
 *  it is non-empty; otherwise it follows the window's active agent. */
export function AgentList({
  agents,
  nested,
  nestLevel,
  demoteOnHide = false,
}: {
  agents: Agent[];
  nested?: boolean;
  nestLevel?: number;
  /** Folders mode: show a hover X that hides the row. */
  demoteOnHide?: boolean;
}) {
  const botsOn = useBotsEnabled();
  const windowId = useWindowId();
  const activeAgentId = useWindow()?.activeAgentId;
  const statusFocused = useStatusFocused();
  const selectedIds = useUiStore((s) => s.sidebarAgentSelection[windowId]?.ids);
  const multi = (selectedIds?.length ?? 0) > 1;
  const agentSelected = (id: string) =>
    multi ? !!selectedIds?.includes(id) : !statusFocused && id === activeAgentId;
  return (
    <>
      {agents.map((a, i) =>
        !botsOn && isBot(a) ? null : isTrackerOwner(a) ? (
          <ProjectGroup
            key={a.id}
            project={a}
            padded={i < agents.length - 1}
            nestLevel={nestLevel ?? (nested ? 1 : 0)}
          />
        ) : isBot(a) ? (
          <BotCell
            key={a.id}
            bot={a}
            selected={agentSelected(a.id)}
          />
        ) : (
          <AgentCell
            key={a.id}
            agent={a}
            selected={agentSelected(a.id)}
            nested={nested}
            nestLevel={nestLevel}
            demoteOnHide={demoteOnHide}
          />
        ),
      )}
    </>
  );
}
