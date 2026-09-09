import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSection,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { TAB_REGISTRY } from "@/components/tabs/registry";
import { CONTENT_TAB_TYPES, isBot } from "@/types";
import { projectBoardIcon, tabTypeLabel } from "@/lib/mergedLabels";
import { useBotsEnabled, useMergedSidebar } from "@/store/useFeatureFlags";
import { useActiveAgent, useActiveScopeId, useWorkspaceStore } from "@/store/useWorkspaceStore";
import { useUiStore } from "@/store/useUiStore";
import { useWindowId } from "@/components/window/WindowContext";
import { fileIconFor, getRecentFiles } from "@/data/files";

export function AddTabMenu({ tileId }: { tileId: string }) {
  const addTab = useWorkspaceStore((s) => s.addTab);
  const openCustomize = useUiStore((s) => s.openCustomize);
  const windowId = useWindowId();
  // Recents come from the active workspace's file tree (same source as the
  // Files tab), so the menu shows files that actually exist in this workspace.
  const recents = getRecentFiles(useActiveScopeId());
  const merged = useMergedSidebar();
  const botsOn = useBotsEnabled();
  const agent = useActiveAgent();
  const tabTypes = CONTENT_TAB_TYPES.filter(
    (type) => type !== "bot" || (botsOn && isBot(agent)),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IconButton name="plus" size="base" aria-label="Add tab" className="mx-1.5 self-center" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuSection>
          {tabTypes.map((type) => (
            <DropdownMenuItem key={type} onSelect={() => addTab(tileId, type)}>
              <Icon
                name={type === "project" ? projectBoardIcon(merged) : TAB_REGISTRY[type].icon}
                size="base"
                color="tertiary"
              />
              {tabTypeLabel(type, merged)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSection>
        <DropdownMenuSeparator />
        <DropdownMenuSection>
          <DropdownMenuLabel>Recents</DropdownMenuLabel>
          {recents.map((recent, i) => (
            <DropdownMenuItem
              key={`${recent.folder}/${recent.name}-${i}`}
              onSelect={() =>
                addTab(tileId, "files", { title: recent.name, folder: recent.folder })
              }
            >
              <Icon name={fileIconFor(recent.name)} size="base" color="tertiary" />
              {recent.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSection>
        <DropdownMenuSeparator />
        <DropdownMenuSection>
          <DropdownMenuItem onSelect={() => openCustomize(windowId)}>
            <Icon name="extensions" size="base" color="tertiary" />
            Customize
          </DropdownMenuItem>
        </DropdownMenuSection>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
