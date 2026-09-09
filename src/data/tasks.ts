import type { IconName } from "@/icons/iconNames";

export type TaskStatus = "not-started" | "in-progress" | "for-review" | "completed";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  agentId?: string;
  prId?: string;
}

/** Native order: Done is last. Empty columns still go after filled ones. */
export const TASK_BOARD_STATUSES: TaskStatus[] = [
  "in-progress",
  "for-review",
  "not-started",
  "completed",
];

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  "not-started": "Up Next",
  "in-progress": "In Progress",
  "for-review": "For Review",
  completed: "Done",
};

const STATUS_ICON: Record<TaskStatus, IconName> = {
  "not-started": "circle-dashed",
  "in-progress": "spinner",
  "for-review": "circle",
  completed: "check-circle",
};

export const taskStatusIcon = (status: TaskStatus): IconName => STATUS_ICON[status];

const task = (
  id: string,
  title: string,
  status: TaskStatus,
  links?: { agentId?: string; prId?: string },
): Task => {
  const agentId = links?.agentId;
  const prId = links?.prId;
  if ((status === "in-progress" || status === "for-review") && !agentId) {
    throw new Error(`Task ${id} is ${status} and must have an agent`);
  }
  if (status === "completed" && prId && !agentId) {
    throw new Error(`Task ${id} has a PR and must have an agent`);
  }
  if (status === "completed" && !prId && agentId) {
    throw new Error(`Task ${id} is canceled and must not have an agent`);
  }
  return { id, title, status, ...links };
};

/** Seed tasks keyed by project or bot id. Up Next has no agent. In Progress
 *  and For Review always have an agent (a bot row uses that bot). Completed
 *  work with a PR has an agent. Completed without a PR is canceled. */
export const TASKS_BY_PROJECT: Record<string, Task[]> = {
  "p-sidebar": [
    task(
      "t-sb-1",
      "Swap the folder glyph for a hover chevron",
      "completed",
      { agentId: "a-sb-1", prId: "pr-sb-1" },
    ),
    task(
      "t-sb-2",
      "Pin a project without flattening its children",
      "for-review",
      { agentId: "a-sb-2", prId: "pr-sb-2" },
    ),
    task(
      "t-sb-3",
      "Move compact unread into the trailing slot",
      "in-progress",
      { agentId: "a-sb-3", prId: "pr-sb-3" },
    ),
    task("t-sb-4", "Keep the collapse chevron off the unread badge", "not-started"),
    task("t-sb-5", "Group recents into day buckets", "not-started"),
  ],
  "p-keyboard": [
    task(
      "t-kb-1",
      "Put composer accessories in one tab sequence",
      "in-progress",
      { agentId: "a-kb-1", prId: "pr-kb-1" },
    ),
    task(
      "t-kb-2",
      "Trap focus inside dropdown menus",
      "for-review",
      { agentId: "a-kb-2", prId: "pr-kb-2" },
    ),
    task("t-kb-3", "Walk sidebar rows with arrow keys", "not-started"),
    task(
      "t-kb-4",
      "Close context menus with Escape",
      "completed",
      { agentId: "a-kb-5", prId: "pr-kb-4" },
    ),
    task(
      "t-kb-5",
      "Add a skip link into the transcript",
      "completed",
      { agentId: "a-kb-3", prId: "pr-kb-5" },
    ),
    task(
      "t-kb-6",
      "Make the tab bar one tab stop",
      "in-progress",
      { agentId: "a-kb-6" },
    ),
    task(
      "t-kb-7",
      "Keep focus rings visible on glass",
      "for-review",
      { agentId: "a-kb-7", prId: "pr-kb-6" },
    ),
    task("t-kb-8", "Announce agent status to VoiceOver", "not-started"),
    task(
      "t-kb-9",
      "Restore focus after a tile closes",
      "completed",
      { agentId: "a-kb-9", prId: "pr-kb-8" },
    ),
    task("t-kb-10", "Typeahead in the project agents menu", "not-started"),
  ],
  "p-base-ui": [
    task(
      "t-bu-1",
      "Port dock and tab menus to Base Menu",
      "in-progress",
      { agentId: "a-bu-1", prId: "pr-bu-1" },
    ),
    task(
      "t-bu-2",
      "Move workspace hovers onto Base Tooltip",
      "completed",
      { agentId: "a-bu-2", prId: "pr-bu-2" },
    ),
    task("t-bu-3", "Share one Base Dialog for customize and composer", "not-started"),
    task("t-bu-4", "Map Base color ramps onto glass tokens", "not-started"),
    task(
      "t-bu-5",
      "Drive IconButton sizes from Base Button",
      "completed",
      { agentId: "a-bu-4", prId: "pr-bu-5" },
    ),
    task(
      "t-bu-6",
      "Anchor the agents menu on Base Popover",
      "for-review",
      { agentId: "a-bu-6", prId: "pr-bu-6" },
    ),
    task(
      "t-bu-7",
      "Hold the Base Select port for debug chips",
      "completed",
      { agentId: "a-bu-7", prId: "pr-bu-7" },
    ),
    task(
      "t-bu-8",
      "Wrap the sidebar list in Base Scroll Area",
      "completed",
      { agentId: "a-bu-8", prId: "pr-bu-8" },
    ),
    task(
      "t-bu-9",
      "Replace settings checks with Base Checkbox",
      "in-progress",
      { agentId: "a-bu-9", prId: "pr-bu-9" },
    ),
    task("t-bu-10", "Turn the wallpaper picker into Base Radio", "not-started"),
    task(
      "t-bu-11",
      "Switch light and dark with Base Switch",
      "completed",
      { agentId: "a-bu-11", prId: "pr-bu-11" },
    ),
    task("t-bu-12", "Drive project folders with Base Collapsible", "not-started"),
    task("t-bu-13", "Share Base Context Menu on sidebar and tabs", "not-started"),
    task(
      "t-bu-14",
      "Filter the workspace switcher with Base Combobox",
      "for-review",
      { agentId: "a-bu-14", prId: "pr-bu-14" },
    ),
    task(
      "t-bu-15",
      "Stack copy and screenshot toasts on Base Toast",
      "completed",
      { agentId: "a-bu-15", prId: "pr-bu-15" },
    ),
    task(
      "t-bu-16",
      "Leave appearance sections as a static stack",
      "completed",
      { agentId: "a-bu-16", prId: "pr-bu-16" },
    ),
    task(
      "t-bu-17",
      "Share one segmented primitive for Agents, PRs, and debug chips",
      "not-started",
    ),
    task("t-bu-18", "Build the new-project name field on Base Field", "not-started"),
    task(
      "t-bu-19",
      "Confirm project delete with Base Alert Dialog",
      "completed",
      { agentId: "a-bu-19", prId: "pr-bu-19" },
    ),
    task(
      "t-bu-20",
      "Keep the composer doc off Base Input",
      "completed",
      { agentId: "a-bu-20", prId: "pr-bu-20" },
    ),
  ],
  "b-pr-tracker": [
    task("t-prt-1", "Suppress nags on draft PRs", "completed", {
      agentId: "b-pr-tracker",
      prId: "pr-prt-1",
    }),
    task("t-prt-2", "Watch failing checks on open PRs", "in-progress", {
      agentId: "b-pr-tracker",
      prId: "pr-prt-2",
    }),
    task("t-prt-3", "Flag flaky checks instead of blockers", "for-review", {
      agentId: "b-pr-tracker",
      prId: "pr-prt-3",
    }),
    task("t-prt-4", "Escalate only reviews that block merge", "in-progress", {
      agentId: "b-pr-tracker",
    }),
    task("t-prt-5", "Group review waits by repo", "not-started"),
    task("t-prt-6", "Mute volume spikes until they persist", "not-started"),
  ],
  "b-qa-team": [
    task("t-qa-1", "Smoke the project header", "completed", {
      agentId: "b-qa-team",
      prId: "pr-qa-1",
    }),
    task("t-qa-2", "Smoke the Bots section", "in-progress", {
      agentId: "b-qa-team",
      prId: "pr-qa-2",
    }),
    task("t-qa-3", "Keyboard pass on bot rows", "for-review", {
      agentId: "b-qa-team",
      prId: "pr-qa-3",
    }),
    task("t-qa-4", "File only path-breaking bugs", "in-progress", { agentId: "b-qa-team" }),
    task("t-qa-5", "Empty-state sweep for a new bot", "not-started"),
    task("t-qa-6", "Skip copy nits on bot briefs", "completed"),
  ],
  "b-bug-watcher": [
    task("t-bw-1", "Park one-off errors", "completed", {
      agentId: "b-bug-watcher",
      prId: "pr-bw-1",
    }),
    task("t-bw-2", "File the island-close null", "for-review", {
      agentId: "b-bug-watcher",
      prId: "pr-bw-2",
    }),
    task("t-bw-3", "Dedup repeat Sentry fingerprints", "in-progress", {
      agentId: "b-bug-watcher",
      prId: "pr-bw-3",
    }),
    task("t-bw-4", "Watch stale tab title after rename", "in-progress", {
      agentId: "b-bug-watcher",
    }),
    task("t-bw-5", "Alert on volume jumps before filing a pile", "not-started"),
    task("t-bw-6", "Ignore paging noise from closed windows", "not-started"),
  ],
  "b-docs": [
    task("t-dc-1", "Stub the Bots section page", "completed", {
      agentId: "b-docs",
      prId: "pr-dc-1",
    }),
    task("t-dc-2", "Document singular bot rows", "in-progress", {
      agentId: "b-docs",
      prId: "pr-dc-2",
    }),
    task("t-dc-3", "Align project briefs with sidebar rules", "for-review", {
      agentId: "b-docs",
      prId: "pr-dc-3",
    }),
    task("t-dc-4", "Tracker surfaces for bots: tasks and PRs only", "in-progress", {
      agentId: "b-docs",
    }),
    task("t-dc-5", "No create-bot dialog in the brief", "completed"),
    task("t-dc-6", "Drop the stale no-tracker line", "not-started"),
  ],
  "b-research": [
    task("t-rs-1", "Grid v4 hex melt at 18px", "completed", {
      agentId: "b-research",
      prId: "pr-rs-1",
    }),
    task("t-rs-2", "Compare lattices for sidebar density", "in-progress", {
      agentId: "b-research",
      prId: "pr-rs-2",
    }),
    task("t-rs-3", "Prior art: always-on agents vs bots", "for-review", {
      agentId: "b-research",
      prId: "pr-rs-3",
    }),
    task("t-rs-4", "What still reads on glass at 18px", "in-progress", {
      agentId: "b-research",
    }),
    task("t-rs-5", "No animation in the sidebar", "completed"),
    task("t-rs-6", "Folder chrome vs singular rows", "not-started"),
  ],
  "b-release": [
    task("t-rc-1", "Bot chat opens with the pane closed", "completed", {
      agentId: "b-release",
      prId: "pr-rc-1",
    }),
    task("t-rc-2", "Hold the cut until Bots look settled", "in-progress", {
      agentId: "b-release",
      prId: "pr-rc-2",
    }),
    task("t-rc-3", "Green sidebar pass before ship", "for-review", {
      agentId: "b-release",
      prId: "pr-rc-3",
    }),
    task("t-rc-4", "Checklist: identicons and tracker tab", "in-progress", {
      agentId: "b-release",
    }),
    task("t-rc-5", "Do not slip a silent cut", "completed"),
    task("t-rc-6", "Announce the hold in standup", "not-started"),
  ],
};

export const tasksFor = (projectId: string): Task[] => TASKS_BY_PROJECT[projectId] ?? [];
