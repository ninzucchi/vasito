import type { Task } from "@/data/tasks";

const PROJECT_TICKET_PREFIX: Record<string, string> = {
  "p-sidebar": "SB",
  "p-keyboard": "KB",
  "p-base-ui": "BU",
  "b-pr-tracker": "PR",
  "b-qa-team": "QA",
  "b-bug-watcher": "BW",
  "b-docs": "DC",
  "b-research": "RS",
  "b-release": "RC",
};

function ticketPrefix(projectId?: string): string {
  if (projectId && PROJECT_TICKET_PREFIX[projectId]) return PROJECT_TICKET_PREFIX[projectId];
  const letters = (projectId ?? "GL").replace(/^p-/, "").replace(/[^a-zA-Z]/g, "");
  return letters.slice(0, 2).toUpperCase() || "GL";
}

function ticketNumber(task: Pick<Task, "id">): number {
  const match = task.id.match(/(\d+)$/);
  return match ? Number(match[1]) : 1;
}

export function taskTicketId(projectId: string | undefined, task: Pick<Task, "id">): string {
  return `${ticketPrefix(projectId)}-${ticketNumber(task)}`;
}
