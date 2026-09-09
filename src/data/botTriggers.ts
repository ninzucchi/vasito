import type { IconName } from "@/icons/iconNames";
import type { ChatMessage } from "@/types";

const t = (text: string, label: string, icon: IconName): ChatMessage => ({
  role: "trigger",
  text,
  gated: "triggers",
  trigger: { label, icon },
});

const a = (text: string, tool?: string): ChatMessage => ({
  role: "agent",
  text,
  tool,
  gated: "triggers",
});

/** Trigger + reply pairs seeded on every bot. Hidden unless Triggers is on. */
export const BOT_TRIGGERS: Record<string, ChatMessage[]> = {
  "b-pr-tracker": [
    t(
      "Checks just went red on Surface failing checks before review waits.",
      "New event on PR #111202",
      "git-pull-request",
    ),
    a(
      "CI failed on the flake lane, not the real suite.\n\nI'll treat it as flaky, not a merge blocker. The review wait on #111203 is still the only hard block.",
      "Worked 6s",
    ),
    t(
      "@nick: is anyone watching the review on 111203? It's been sitting since yesterday.",
      "New Slack message in #eng-prs",
      "hash",
    ),
    a(
      "That's the blocking review. I already have it as the one ping.\n\nNo second nag. I'll say so again only if it still blocks at 4pm.",
      "Worked 4s",
    ),
    t("Weekday check sweep.", "Every weekday at 9:00 AM", "clock"),
    a(
      "Two open PRs. #111202 has a flaky check. #111203 is ready and waiting on review.\n\nDraft #111204 stays quiet.",
      "Worked 8s",
    ),
  ],
  "b-qa-team": [
    t(
      "Tab from the Bots header skips the first row.",
      "Linear issue opened · QA-7",
      "issue",
    ),
    a(
      "That's a path break. I'll add it to the keyboard report.\n\nCopy stays off the list. One report when the pass is done.",
      "Worked 5s",
    ),
    t(
      "Can someone smoke the empty new-bot state? Plus made one and the tracker looks blank.",
      "New Slack message in #qa",
      "hash",
    ),
    a(
      "Empty-state sweep is on the list. I'll cover the blank tracker and missing names.\n\nI will not file nits on the stub copy.",
      "Worked 7s",
    ),
    t("Review requested on Smoke the Bots section.", "New event on PR #111302", "git-pull-request"),
    a(
      "I'll wait to review until the smoke report is in.\n\nIf the PR only restyles copy, I'll skip it.",
      "Worked 4s",
    ),
  ],
  "b-bug-watcher": [
    t(
      "Island-close null is paging again. Are we treating this as a repeat?",
      "New Slack message in #incidents",
      "hash",
    ),
    a(
      "Yes. Same fingerprint. Already filed.\n\nI will not open a second ticket.",
      "Worked 3s",
    ),
    t(
      "Stale tab title after rename reproduced on a second window.",
      "Linear issue opened · BW-7",
      "issue",
    ),
    a(
      "Second reproduce. I'll escalate the title bug off watch and file it.\n\nNo pile — this is the one I was holding.",
      "Worked 6s",
    ),
    t("Error volume digest.", "Every day at 7:00 AM", "clock"),
    a(
      "Island-close is still the only repeat. Title rename did not fire overnight.\n\nVolume is flat. No pile to file.",
      "Worked 9s",
    ),
  ],
  "b-docs": [
    t("Merged: Stub page for the Bots section.", "New event on PR #111501", "git-pull-request"),
    a(
      "Stub is live. I'll drop the stale no-page line from the brief.\n\nNo extra guide. The stub already says singular rows.",
      "Worked 5s",
    ),
    t(
      "Does the Bots brief mention a create dialog? Design is asking.",
      "New Slack message in #docs",
      "hash",
    ),
    a(
      "No. Plus makes one and we rename. I'll keep that line out.\n\nIf they want a how-to, it is: Plus, then rename.",
      "Worked 4s",
    ),
    t("Content calendar check.", "Mondays at 11:00 AM", "clock"),
    a(
      "Bots stub is in. Tracker surfaces still need a line: tasks and PRs only.\n\nNo other missing pages this week.",
      "Worked 7s",
    ),
  ],
  "b-research": [
    t(
      "Can you check how Linear shows always-on agents in the sidebar?",
      "New Slack message in #design",
      "hash",
    ),
    a(
      "I'll pull that next. At 18px I care about the mark, not the row chrome.\n\nNo animation either way.",
      "Worked 5s",
    ),
    t("Compare lattices at sidebar size.", "Every Tuesday at 9:00 AM", "clock"),
    a(
      "Hex-flat + blob still wins at 18px. Interior dots in the lattice vanish.\n\nI would not lock a denser grid.",
      "Worked 12s",
    ),
    t("Prior art request: bot rows vs agent folders.", "Linear issue opened · RS-7", "issue"),
    a(
      "Folders read as groups. Bot rows should stay singular.\n\nI'll write the compare and wait — I will not lock a mark.",
      "Worked 8s",
    ),
  ],
  "b-release": [
    t("Sidebar pass went green on main.", "New event on PR #111703", "git-pull-request"),
    a(
      "That's one gate. Identicons still look mid-pass.\n\nHold stays. I'll ping when both gates are green.",
      "Worked 3s",
    ),
    t(
      "Are we still holding tonight? Mobile wants a cut for the icon pass.",
      "New Slack message in #release",
      "hash",
    ),
    a(
      "Still holding. Identicons are not settled and I will not slip a silent cut.\n\nI'll say so in standup if they ask again.",
      "Worked 4s",
    ),
    t("Hold check.", "Every day at 6:00 PM", "clock"),
    a(
      "Hold stands. Sidebar pass is green. Bot chat opens without forcing the tracker.\n\nNo cut until you say ship.",
      "Worked 5s",
    ),
  ],
};
