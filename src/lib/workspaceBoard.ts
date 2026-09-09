import { pullRequestsFor, type PullRequest } from "@/data/pullRequests";
import { tasksFor, type Task } from "@/data/tasks";
import {
  agentsInWorkspaceBoard,
  isBot,
  isProject,
  projectsInWorkspace,
  type Agent,
} from "@/types";

export type BoardTask = Task & { projectId: string };

/** Tasks from every project and every bot. Regular agents are excluded. */
export function statusBoardTasks(
  agents: Record<string, Agent>,
  projectOrder: string[],
  botOrder: string[],
  includeBots: boolean,
): BoardTask[] {
  const ids = includeBots ? [...projectOrder, ...botOrder] : projectOrder;
  const seen = new Set<string>();
  const tasks: BoardTask[] = [];
  for (const id of ids) {
    const agent = agents[id];
    if (!agent || agent.draft || seen.has(id)) continue;
    if (!isProject(agent) && !(includeBots && isBot(agent))) continue;
    seen.add(id);
    for (const task of tasksFor(id)) {
      tasks.push({ ...task, projectId: id });
    }
  }
  return tasks;
}

export function workspaceBoardTasks(
  agents: Record<string, Agent>,
  agentOrder: string[],
  workspaceId: string,
): BoardTask[] {
  return projectsInWorkspace(agents, agentOrder, workspaceId).flatMap((project) =>
    tasksFor(project.id).map((task) => ({ ...task, projectId: project.id })),
  );
}

export function workspaceBoardPrs(
  agents: Record<string, Agent>,
  agentOrder: string[],
  workspaceId: string,
): PullRequest[] {
  return projectsInWorkspace(agents, agentOrder, workspaceId).flatMap((project) =>
    pullRequestsFor(project.id),
  );
}

export function workspaceBoardAgents(
  agents: Record<string, Agent>,
  agentOrder: string[],
  workspaceId: string,
): Agent[] {
  return agentsInWorkspaceBoard(agents, agentOrder, workspaceId);
}

/** Non-idle agents in the workspace board (running, attention, unread). */
export function workspaceActiveAgentCount(
  agents: Record<string, Agent>,
  agentOrder: string[],
  workspaceId: string,
): number {
  return workspaceBoardAgents(agents, agentOrder, workspaceId).filter(
    (agent) => agent.status !== "idle",
  ).length;
}
