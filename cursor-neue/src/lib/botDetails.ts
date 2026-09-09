import type { JSONContent } from "@tiptap/core";
import type { BotRoutine, BotSkill } from "@/types";

export type { BotRoutine, BotSkill };

export interface BotProfile {
  instructions: JSONContent;
  memories: JSONContent;
  skills: BotSkill[];
  routines: BotRoutine[];
}

const text = (value: string): JSONContent => ({ type: "text", text: value });

const heading = (level: 1 | 2 | 3 | 4, value: string): JSONContent => ({
  type: "heading",
  attrs: { level },
  content: [text(value)],
});

const paragraph = (value: string): JSONContent => ({
  type: "paragraph",
  content: value ? [text(value)] : [],
});

const bulletList = (items: string[]): JSONContent => ({
  type: "bulletList",
  content: items.map((item) => ({
    type: "listItem",
    content: [paragraph(item)],
  })),
});

const orderedList = (items: string[]): JSONContent => ({
  type: "orderedList",
  content: items.map((item) => ({
    type: "listItem",
    content: [paragraph(item)],
  })),
});

const doc = (...nodes: JSONContent[]): JSONContent => ({
  type: "doc",
  content: nodes,
});

const skill = (name: string, description: string): BotSkill => ({
  id: name,
  name,
  description,
});

export const emptyBotDoc = (): JSONContent => doc(paragraph(""));

/** First paragraph in a TipTap doc. Used as the bot description. */
export function firstParagraphText(node: JSONContent | undefined): string {
  if (!node) return "";
  if (node.type === "text") return node.text ?? "";
  if (node.type === "paragraph") {
    return (node.content ?? []).map((child) => firstParagraphText(child)).join("").trim();
  }
  for (const child of node.content ?? []) {
    if (child.type === "heading") continue;
    const value = firstParagraphText(child);
    if (value) return value;
  }
  return "";
}

export function defaultBotProfile(title: string, description: string): BotProfile {
  const role = description.trim() || `${title} follows the brief you give it.`;
  return {
    instructions: doc(
      paragraph(role),
      heading(4, "Operating rules"),
      bulletList([
        "Stay on the assigned beat.",
        "Ask before you expand scope.",
        "Report once. Do not drip comments.",
      ]),
      heading(4, "Out of scope"),
      bulletList(["Do not invent process.", "Do not file nits unless asked."]),
    ),
    memories: doc(
      bulletList([
        "No learned preferences yet.",
        "This bot is new. Facts collect as it works.",
      ]),
    ),
    skills: [skill("status-report", "Send one status report when the work is done.")],
    routines: [
      { id: "r-brief", title: "Morning briefing", schedule: "Every day at 8:00 AM" },
    ],
  };
}

const PROFILES: Record<string, BotProfile> = {
  "b-pr-tracker": {
    skills: [
      skill("pr-watch", "Watch open PRs across the workspace."),
      skill("check-flakes", "Flag checks that look flaky."),
      skill("review-queue", "Track reviews that wait on a person."),
      skill("merge-blockers", "Surface reviews that block merge."),
      skill("draft-silence", "Keep drafts quiet unless asked."),
    ],
    routines: [
      { id: "prt-brief", title: "Morning briefing", schedule: "Every day at 8:00 AM" },
      { id: "prt-checks", title: "Failing-check sweep", schedule: "Weekdays at 9:00 AM" },
      { id: "prt-block", title: "Blocking-review ping", schedule: "Weekdays at 4:00 PM" },
      { id: "prt-drafts", title: "Draft silence audit", schedule: "Fridays at 3:00 PM" },
    ],
    instructions: doc(
      paragraph("Watches open PRs and flags failing checks and blocking reviews."),
      heading(4, "Watch order"),
      orderedList([
        "Failing checks first.",
        "Reviews that block merge next.",
        "Drafts last, and only if asked.",
      ]),
      heading(4, "Rules"),
      bulletList([
        "Do not nag on draft PRs.",
        "If a check looks flaky, say so. Do not treat it as a hard blocker.",
        "Ping only when a review is actually blocking merge.",
        "Keep one status report. Do not drip comments.",
      ]),
      heading(4, "Report shape"),
      bulletList([
        "What is red.",
        "What is waiting on a person.",
        "What you parked.",
      ]),
      heading(4, "Out of scope"),
      bulletList(["Do not open review comments for style.", "Do not merge anything."]),
    ),
    memories: doc(
      bulletList([
        "Start with failing checks.",
        "One ping when a review blocks merge. Not a stream.",
        "Everysphere hosts most Glass work.",
        "Draft PRs are common on feature branches and should stay quiet.",
        "Flaky checks should be labeled, not treated as blockers.",
        "The user wants merge-blockers, not a full PR digest.",
      ]),
    ),
  },
  "b-qa-team": {
    skills: [
      skill("smoke-pass", "Open, click, and leave without getting stuck."),
      skill("keyboard-pass", "Tab order, names, and focus restore."),
      skill("empty-states", "Missing names, blank hit targets, silent chrome."),
      skill("focus-traps", "Menus and dialogs that trap focus."),
      skill("hit-targets", "Broken or missing click targets."),
    ],
    routines: [
      { id: "qa-stand", title: "Daily standup notes", schedule: "Weekdays at 10:00 AM" },
      { id: "qa-smoke", title: "Smoke the header", schedule: "Weekdays at 11:00 AM" },
      { id: "qa-keys", title: "Keyboard pass", schedule: "Tuesdays at 2:00 PM" },
      { id: "qa-empty", title: "Empty-state sweep", schedule: "Thursdays at 3:00 PM" },
    ],
    instructions: doc(
      paragraph("Runs smoke and keyboard passes, and files only what breaks a path."),
      heading(4, "Coverage"),
      bulletList([
        "Smoke path: can a person open, click, and leave without getting stuck.",
        "Keyboard pass: tab order, names, and focus restore.",
        "Empty-state sweep: missing names, blank hit targets, silent chrome.",
      ]),
      heading(4, "Rules"),
      bulletList([
        "Do not file copy nits.",
        "One report when you are done. Not a drip of comments.",
        "Broken hit targets and missing names come first.",
        "Ask which surface to cover before you start.",
      ]),
      heading(4, "Report shape"),
      orderedList([
        "What you covered.",
        "What broke a path.",
        "What you skipped on purpose.",
      ]),
    ),
    memories: doc(
      bulletList([
        "One report at the end.",
        "Copy nits stay off the list unless the user asks.",
        "Project header and the Bots section were the last smoke scope.",
        "Focus traps in menus are a known keyboard risk.",
        "The user cares about path breaks, not polish notes.",
      ]),
    ),
  },
  "b-bug-watcher": {
    skills: [
      skill("error-stream", "Read incoming errors as they land."),
      skill("repeat-detect", "File errors that happen more than once."),
      skill("volume-watch", "Ping when volume jumps."),
      skill("sentry-triage", "Sort Sentry noise from signal."),
      skill("park-one-offs", "Hold first sightings until they repeat."),
    ],
    routines: [
      { id: "bw-metrics", title: "Metrics digest", schedule: "Every day at 7:00 AM" },
      { id: "bw-triage", title: "Bug triage sweep", schedule: "Weekdays at 1:00 PM" },
      { id: "bw-volume", title: "Volume jump watch", schedule: "Weekdays at 4:30 PM" },
      { id: "bw-inbox", title: "Inbox cleanup", schedule: "Weekdays at 6:00 PM" },
    ],
    instructions: doc(
      paragraph("Reads the error stream, files repeats, and parks one-offs."),
      heading(4, "Triage"),
      orderedList([
        "Repeats get a ticket.",
        "One-offs stay on watch until they happen twice more.",
        "Volume jumps get a ping before any bulk file.",
      ]),
      heading(4, "Rules"),
      bulletList([
        "Signal over a flood of tickets.",
        "Say so before you file a pile.",
        "New unique errors still come through.",
        "Do not page on a first sighting unless it is a crash loop.",
      ]),
      heading(4, "Out of scope"),
      bulletList(["Do not rewrite the failing code.", "Do not close tickets you did not file."]),
    ),
    memories: doc(
      bulletList([
        "File repeats. Park one-offs.",
        "Ping on Sentry volume jumps before filing a pile.",
        "Island-close null is filed.",
        "Stale tab title after rename stays on watch until a second reproduce.",
        "The user wants signal, not a ticket flood.",
      ]),
    ),
  },
  "b-docs": {
    skills: [
      skill("brief-sync", "Keep briefs aligned with the sidebar."),
      skill("stub-pages", "Write short stubs for new surfaces."),
      skill("drop-stale", "Remove lines that no longer match the UI."),
      skill("sidebar-rules", "Describe what the sidebar does now."),
      skill("no-invent", "Do not invent a create dialog."),
    ],
    routines: [
      { id: "doc-cal", title: "Content calendar check", schedule: "Mondays at 11:00 AM" },
      { id: "doc-brief", title: "Brief drift pass", schedule: "Wednesdays at 10:00 AM" },
      { id: "doc-stub", title: "Missing-page sweep", schedule: "Fridays at 2:00 PM" },
    ],
    instructions: doc(
      paragraph("Keeps briefs aligned with what the sidebar actually does."),
      heading(4, "Voice"),
      bulletList([
        "Short stubs. One idea per sentence.",
        "Describe what the product does now, not what it might do.",
        "Bots are singular. No folder chrome.",
      ]),
      heading(4, "Rules"),
      bulletList([
        "Do not invent a create-bot dialog. Plus makes one and we rename.",
        "Tracker for a bot is tasks and PRs only.",
        "Drop lines that no longer match the sidebar.",
      ]),
      heading(4, "When to write"),
      orderedList([
        "A new surface ships with no page.",
        "A brief and the UI disagree.",
        "The user asks for a stub.",
      ]),
    ),
    memories: doc(
      bulletList([
        "Short stubs over long guides.",
        "Do not invent create dialogs.",
        "Bots share the project chat path and stay one row.",
        "The bot tracker lists the bot’s own tasks. PRs are the only pill.",
        "Plus creates a bot. Rename happens after.",
      ]),
    ),
  },
  "b-research": {
    skills: [
      skill("prior-art", "Pull marks and density from other products."),
      skill("identicon-read", "Judge identicons at sidebar size."),
      skill("density-check", "Note what collapses at 18px."),
      skill("sidebar-scan", "Scan always-on rows and folder chrome."),
      skill("mark-lock", "Report before the user locks a mark."),
    ],
    routines: [
      { id: "rs-comp", title: "Competitor scan", schedule: "Tuesdays at 9:00 AM" },
      { id: "rs-size", title: "Sidebar-size read", schedule: "Thursdays at 11:00 AM" },
      { id: "rs-brief", title: "Weekly team update", schedule: "Mondays at 9:00 AM" },
    ],
    instructions: doc(
      paragraph("Pulls prior art and reports what still reads at sidebar size."),
      heading(4, "How to look"),
      bulletList([
        "Judge marks at 18px first. If it fails there, it fails in the row.",
        "Note what collapses: interior detail, two-tone ink, animation.",
        "Compare to marks the user already locked.",
      ]),
      heading(4, "Rules"),
      bulletList([
        "No animation in the sidebar.",
        "One muted family token is enough.",
        "Do not lock a mark. Report, then wait.",
      ]),
      heading(4, "Report shape"),
      orderedList([
        "What you compared.",
        "What reads at 18px.",
        "What you would drop.",
      ]),
    ),
    memories: doc(
      bulletList([
        "Identicons first when the user is choosing a mark.",
        "No animation in the sidebar.",
        "Grid v4 hex-flat + blob melt. Grid 5. No tile ground.",
        "At 18px the melt mass reads. Interior dots do not.",
        "Two-tone ink collapses. One muted family token is enough.",
        "The user wants prior art before they lock a density.",
      ]),
    ),
  },
  "b-release": {
    skills: [
      skill("cut-hold", "Hold the cut until the user says ship."),
      skill("green-watch", "Watch the sidebar pass stay green."),
      skill("ship-gate", "Track agreed gates before a cut."),
      skill("blocker-ping", "Say so when something blocks the hold."),
      skill("no-slip", "Do not slip a release silently."),
    ],
    routines: [
      { id: "rc-hold", title: "Hold the cut", schedule: "Every day at 6:00 PM" },
      { id: "rc-green", title: "Sidebar pass watch", schedule: "Weekdays at 3:00 PM" },
      { id: "rc-prep", title: "Meeting prep", schedule: "Weekdays at 8:30 AM" },
    ],
    instructions: doc(
      paragraph("Holds the cut until you say ship."),
      heading(4, "Hold rules"),
      bulletList([
        "Nothing ships until the user says so.",
        "If something blocks the hold, say so. Do not silently slip the cut.",
        "Watch for a green sidebar pass and a bot chat that opens without forcing the tracker.",
      ]),
      heading(4, "When to ping"),
      orderedList([
        "A blocker appears on a hold.",
        "The user asks for a cut.",
        "The last agreed gate turns green.",
      ]),
      heading(4, "Out of scope"),
      bulletList(["Do not write the changelog unless asked.", "Do not tag a release on your own."]),
    ),
    memories: doc(
      bulletList([
        "Hold until Bots is in and identicons look settled.",
        "Tell the user if something blocks the hold.",
        "Last ship was the debug-bar label rename.",
        "Need a green sidebar pass and a bot chat that opens without a tracker.",
        "A hold must stay a hold. No silent slip.",
      ]),
    ),
  },
};

export function botProfileFor(id: string, title: string, description: string): BotProfile {
  return PROFILES[id] ?? defaultBotProfile(title, description);
}
