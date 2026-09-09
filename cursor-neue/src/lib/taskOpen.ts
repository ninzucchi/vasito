import type { Task } from "@/data/tasks";

export type TaskOpenTarget =
  | { kind: "pr"; prId: string }
  | { kind: "agent"; agentId: string };

/** PR wins. Then the linked agent. No file open. */
export function taskOpenTarget(task: Pick<Task, "prId" | "agentId">): TaskOpenTarget | null {
  if (task.prId) return { kind: "pr", prId: task.prId };
  if (task.agentId) return { kind: "agent", agentId: task.agentId };
  return null;
}

export function openTaskAssociation(
  task: Pick<Task, "prId" | "agentId">,
  actions: {
    openPr: (prId: string) => void;
    openAgent: (agentId: string) => void;
  },
): boolean {
  const target = taskOpenTarget(task);
  if (!target) return false;
  switch (target.kind) {
    case "pr":
      actions.openPr(target.prId);
      return true;
    case "agent":
      actions.openAgent(target.agentId);
      return true;
    default: {
      const _exhaustive: never = target;
      return _exhaustive;
    }
  }
}
