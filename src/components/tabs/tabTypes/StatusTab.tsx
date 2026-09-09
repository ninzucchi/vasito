import { useMemo } from "react";
import clsx from "clsx";
import { EmptyTabSidebar } from "./placeholder";
import { TaskStatusGroups } from "./ProjectTab";
import { StatusFeed } from "./StatusFeed";
import { statusBoardTasks } from "@/lib/workspaceBoard";
import { useWindowId } from "@/components/window/WindowContext";
import { useBotsEnabled } from "@/store/useFeatureFlags";
import { useUiStore } from "@/store/useUiStore";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

function Segmented<T extends string>({
  label,
  value,
  options,
  onSelect,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onSelect: (id: T) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-px rounded-full border border-secondary bg-elevated p-0.5"
    >
      {options.map((option) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(option.id)}
            className={clsx(
              "flex h-6 items-center justify-center rounded-full px-2 text-sm transition-colors duration-base",
              selected ? "bg-tertiary text-primary" : "text-tertiary hover:text-secondary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusContent() {
  const windowId = useWindowId();
  const agents = useWorkspaceStore((s) => s.agents);
  const projectOrder = useWorkspaceStore((s) => s.projectOrder);
  const botOrder = useWorkspaceStore((s) => s.botOrder);
  const setActiveAgent = useWorkspaceStore((s) => s.setActiveAgent);
  const includeBots = useBotsEnabled();
  const layout = useUiStore((s) => s.statusBoardView);
  const setLayout = useUiStore((s) => s.setStatusBoardView);
  const tasks = useMemo(
    () => statusBoardTasks(agents, projectOrder, botOrder, includeBots),
    [agents, botOrder, includeBots, projectOrder],
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-editor">
      <div className="flex shrink-0 items-center px-3 py-4">
        <Segmented
          label="Status layout"
          value={layout}
          onSelect={setLayout}
          options={[
            { id: "rows", label: "List" },
            { id: "columns", label: "Board" },
            { id: "feed", label: "Feed" },
          ]}
        />
      </div>
      <div
        className={clsx(
          "min-h-0 flex-1",
          layout === "columns"
            ? "select-none overflow-x-auto overflow-y-hidden"
            : "overflow-y-auto overflow-x-hidden",
          layout !== "feed" && "select-none",
        )}
      >
        {layout === "feed" ? (
          <StatusFeed includeBots={includeBots} />
        ) : (
          <div
            className={clsx(
              "flex gap-2 px-3 pb-2",
              layout === "rows" ? "flex-col" : "h-full",
            )}
          >
            <TaskStatusGroups
              tasks={tasks}
              layout={layout}
              onOpenAgent={(agentId) => setActiveAgent(windowId, agentId)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const StatusSidebar = () => <EmptyTabSidebar />;
