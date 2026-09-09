import type { JSONContent } from "@tiptap/core";
import type { AgentStatus } from "@/types";
import type { ProjectColor } from "@/types";
import { prLinkNode } from "@/components/tiptap-node/pr-link-node/pr-link-node-extension";
import { pullRequestById } from "@/data/pullRequests";

export type FeedAuthorKind = "bot" | "project";

export interface FeedMedia {
  title: string;
  caption: string;
  tone: ProjectColor;
}

export interface FeedReaction {
  emoji: string;
  count: number;
}

export interface FeedReply {
  id: string;
  text: string;
  postedAt: number;
}

export interface FeedPost {
  id: string;
  authorId: string;
  authorKind: FeedAuthorKind;
  postedAt: number;
  taskId: string;
  body: JSONContent;
  media?: FeedMedia[];
  reactions: FeedReaction[];
  replies: FeedReply[];
}

const hour = 3_600_000;
const ago = (hours: number): number => Date.now() - hours * hour;

const text = (value: string): JSONContent => ({ type: "text", text: value });

const h3 = (value: string): JSONContent => ({
  type: "heading",
  attrs: { level: 3 },
  content: [text(value)],
});

const agentChip = (id: string, label: string, status: AgentStatus): JSONContent => ({
  type: "agentLink",
  attrs: { id, label, status },
});

const prChip = (id: string): JSONContent => {
  const pr = pullRequestById(id);
  if (!pr) return text(`#${id}`);
  return prLinkNode(pr, `#${pr.number}`);
};

const p = (...parts: Array<string | JSONContent>): JSONContent => ({
  type: "paragraph",
  content: parts.map((part) => (typeof part === "string" ? text(part) : part)),
});

const doc = (...nodes: JSONContent[]): JSONContent => ({
  type: "doc",
  content: nodes,
});

const post = (
  id: string,
  authorId: string,
  authorKind: FeedAuthorKind,
  hoursAgo: number,
  taskId: string,
  body: JSONContent,
  extra?: {
    media?: FeedMedia[];
    reactions?: FeedReaction[];
    replies?: FeedReply[];
  },
): FeedPost => ({
  id,
  authorId,
  authorKind,
  postedAt: ago(hoursAgo),
  taskId,
  body,
  media: extra?.media,
  reactions: extra?.reactions ?? [],
  replies: extra?.replies ?? [],
});

/** Seeded Status feed. Bodies are TipTap JSON so chips match the document view. */
export const STATUS_FEED_POSTS: FeedPost[] = [
  post(
    "feed-sb-unread",
    "p-sidebar",
    "project",
    0.3,
    "t-sb-3",
    doc(
      h3("Move compact unread into the trailing slot"),
      p(
        "The unread badge was clipping titles at compact density. ",
        agentChip("a-sb-3", "Unread badge", "running"),
        " moved it into the trailing slot so the title can truncate.",
      ),
      p("Draft is up as ", prChip("pr-sb-3"), ". Conflicts are still on the header metrics."),
    ),
    {
      media: [
        {
          title: "compact-unread.png",
          caption: "Trailing slot at 12px density",
          tone: "blue",
        },
      ],
      reactions: [
        { emoji: "👀", count: 4 },
        { emoji: "✅", count: 2 },
      ],
    },
  ),
  post(
    "feed-prt-checks",
    "b-pr-tracker",
    "bot",
    0.6,
    "t-prt-2",
    doc(
      h3("Watch failing checks on open PRs"),
      p(
        "Digest for this hour: two open PRs with red checks. Drafts stay quiet. ",
        prChip("pr-prt-2"),
        " leads the list.",
      ),
      p("I will ping only when a review actually blocks merge."),
    ),
    {
      reactions: [{ emoji: "🔥", count: 3 }],
    },
  ),
  post(
    "feed-kb-composer",
    "p-keyboard",
    "project",
    1.1,
    "t-kb-1",
    doc(
      h3("Put composer accessories in one tab sequence"),
      p(
        agentChip("a-kb-1", "Composer tabs", "running"),
        " wired context, input, and dictate into one stop. Tab no longer jumps the accessories.",
      ),
      p("Still a draft: ", prChip("pr-kb-1"), "."),
    ),
    {
      media: [
        {
          title: "composer-tab-order.mp4",
          caption: "Tab walk through the card",
          tone: "purple",
        },
      ],
      reactions: [{ emoji: "🎹", count: 5 }],
    },
  ),
  post(
    "feed-qa-bots",
    "b-qa-team",
    "bot",
    1.8,
    "t-qa-2",
    doc(
      h3("Smoke the Bots section"),
      p(
        "Header, plus, and the six seed rows. I filed missing names and two tight hit targets. Copy nits stayed off the list.",
      ),
      p("Open as ", prChip("pr-qa-2"), ". Checks failed on the empty-state fixture."),
    ),
    {
      reactions: [
        { emoji: "🧪", count: 2 },
        { emoji: "👍", count: 6 },
      ],
    },
  ),
  post(
    "feed-bu-menus",
    "p-base-ui",
    "project",
    2.4,
    "t-bu-1",
    doc(
      h3("Port dock and tab menus to Base Menu"),
      p(
        agentChip("a-bu-1", "Menu implementer", "running"),
        " kept IconButton triggers. The surface now uses Base Menu primitives.",
      ),
      p("Tracking in ", prChip("pr-bu-1"), "."),
    ),
    {
      media: [
        {
          title: "dock-menu.png",
          caption: "Dock menu on Base",
          tone: "green",
        },
        {
          title: "tab-menu.png",
          caption: "Tab overflow on Base",
          tone: "green",
        },
      ],
      reactions: [{ emoji: "✨", count: 7 }],
    },
  ),
  post(
    "feed-bw-sentry",
    "b-bug-watcher",
    "bot",
    3.2,
    "t-bw-3",
    doc(
      h3("Dedup repeat Sentry fingerprints"),
      p(
        "Three repeats collapsed to one ticket. Volume is up, but I will not file a pile until it holds.",
      ),
      p("In progress on ", prChip("pr-bw-3"), "."),
    ),
    {
      reactions: [{ emoji: "🐛", count: 4 }],
    },
  ),
  post(
    "feed-dc-rows",
    "b-docs",
    "bot",
    4.5,
    "t-dc-2",
    doc(
      h3("Document singular bot rows"),
      p(
        "A bot row never expands. Plus creates one bot. Rename is double-click. That is now in the brief.",
      ),
      p("Open as ", prChip("pr-dc-2"), "."),
    ),
    {
      reactions: [{ emoji: "📝", count: 3 }],
    },
  ),
  post(
    "feed-rs-lattice",
    "b-research",
    "bot",
    5.5,
    "t-rs-2",
    doc(
      h3("Compare lattices for sidebar density"),
      p(
        "Hex flat-top vs square at grid 5. Flat-top still holds a silhouette at 18px. Square goes noisy.",
      ),
      p("Notes live in ", prChip("pr-rs-2"), "."),
    ),
    {
      media: [
        {
          title: "lattice-18px.png",
          caption: "Hex vs square at 18px",
          tone: "orange",
        },
      ],
      reactions: [
        { emoji: "🔬", count: 5 },
        { emoji: "👀", count: 3 },
      ],
    },
  ),
  post(
    "feed-rc-hold",
    "b-release",
    "bot",
    6.2,
    "t-rc-2",
    doc(
      h3("Hold the cut until Bots look settled"),
      p(
        "Identicons and the tracker tab still need a green sidebar pass. I will not slip a silent cut.",
      ),
      p("Hold is logged in ", prChip("pr-rc-2"), "."),
    ),
    {
      reactions: [{ emoji: "🚦", count: 8 }],
    },
  ),
  post(
    "feed-sb-pin",
    "p-sidebar",
    "project",
    8,
    "t-sb-2",
    doc(
      h3("Pin a project without flattening its children"),
      p(
        agentChip("a-sb-2", "Pin projects", "unread"),
        " kept pin as a sidebar list. Children stay under the folder after pin and unpin.",
      ),
      p("For review: ", prChip("pr-sb-2"), "."),
    ),
    {
      reactions: [{ emoji: "📌", count: 6 }],
    },
  ),
  post(
    "feed-kb-trap",
    "p-keyboard",
    "project",
    9.5,
    "t-kb-2",
    doc(
      h3("Trap focus inside dropdown menus"),
      p(
        agentChip("a-kb-2", "Focus trap", "unread"),
        " restored focus to the trigger on close. Escape also returns to the row.",
      ),
      p("Open as ", prChip("pr-kb-2"), "."),
    ),
    {
      reactions: [{ emoji: "👍", count: 4 }],
    },
  ),
  post(
    "feed-bu-popover",
    "p-base-ui",
    "project",
    11,
    "t-bu-6",
    doc(
      h3("Anchor the agents menu on Base Popover"),
      p(
        agentChip("a-bu-6", "Port popover", "idle"),
        " matched anchor and collision. The search field is still ours.",
      ),
      p("For review in ", prChip("pr-bu-6"), "."),
    ),
    {
      media: [
        {
          title: "agents-popover.png",
          caption: "Anchor + collision",
          tone: "green",
        },
      ],
      reactions: [{ emoji: "✨", count: 2 }],
    },
  ),
  post(
    "feed-prt-flaky",
    "b-pr-tracker",
    "bot",
    14,
    "t-prt-3",
    doc(
      h3("Flag flaky checks instead of blockers"),
      p(
        "A check that flips twice in a day is labeled flaky. It does not count as a merge blocker.",
      ),
      p("Ready to merge: ", prChip("pr-prt-3"), "."),
    ),
    {
      reactions: [{ emoji: "✅", count: 5 }],
    },
  ),
  post(
    "feed-qa-keys",
    "b-qa-team",
    "bot",
    16,
    "t-qa-3",
    doc(
      h3("Keyboard pass on bot rows"),
      p(
        "Enter opens the bot. Arrow keys stay on the list. There is no folder disclosure on the row.",
      ),
      p("For review as ", prChip("pr-qa-3"), "."),
    ),
    {
      reactions: [{ emoji: "🎹", count: 3 }],
    },
  ),
  post(
    "feed-bw-island",
    "b-bug-watcher",
    "bot",
    18,
    "t-bw-2",
    doc(
      h3("File the island-close null"),
      p(
        "Closing the pinned island can throw when the last tab is already gone. Filed. Title-rename stays on watch.",
      ),
      p("Open with conflicts: ", prChip("pr-bw-2"), "."),
    ),
    {
      reactions: [
        { emoji: "🐛", count: 9 },
        { emoji: "👀", count: 2 },
      ],
    },
  ),
  post(
    "feed-dc-briefs",
    "b-docs",
    "bot",
    20,
    "t-dc-3",
    doc(
      h3("Align project briefs with sidebar rules"),
      p(
        "The leftover no-tracker line is gone. Briefs now match what the sidebar actually does.",
      ),
      p("For review: ", prChip("pr-dc-3"), "."),
    ),
    {
      reactions: [{ emoji: "📝", count: 4 }],
    },
  ),
  post(
    "feed-rs-bots",
    "b-research",
    "bot",
    22,
    "t-rs-3",
    doc(
      h3("Prior art: always-on agents vs bots"),
      p(
        "Bots stay one row. They do not nest children. The tracker is the bot’s own list, not a folder of agents.",
      ),
      p("Write-up in ", prChip("pr-rs-3"), "."),
    ),
    {
      reactions: [{ emoji: "🔬", count: 6 }],
    },
  ),
  post(
    "feed-rc-green",
    "b-release",
    "bot",
    26,
    "t-rc-3",
    doc(
      h3("Green sidebar pass before ship"),
      p(
        "Need identicons, tracker tab, and the Bots section to read as settled. Hold stays on until that pass is green.",
      ),
      p("Checklist lives in ", prChip("pr-rc-3"), "."),
    ),
    {
      reactions: [{ emoji: "🚦", count: 3 }],
    },
  ),
  post(
    "feed-sb-chevron",
    "p-sidebar",
    "project",
    30,
    "t-sb-1",
    doc(
      h3("Swap the folder glyph for a hover chevron"),
      p(
        agentChip("a-sb-1", "Folder hover", "running"),
        " kept the rest glyph mounted. The chevron fades in and rotates on open.",
      ),
      p("Merged ", prChip("pr-sb-1"), "."),
    ),
    {
      media: [
        {
          title: "folder-hover.gif",
          caption: "Chevron fade on hover",
          tone: "blue",
        },
      ],
      reactions: [
        { emoji: "✅", count: 11 },
        { emoji: "🎉", count: 4 },
      ],
    },
  ),
  post(
    "feed-kb-escape",
    "p-keyboard",
    "project",
    36,
    "t-kb-4",
    doc(
      h3("Close context menus with Escape"),
      p(
        agentChip("a-kb-5", "Escape menus", "idle"),
        " dismisses the menu and focuses the row that opened it.",
      ),
      p("Merged ", prChip("pr-kb-4"), "."),
    ),
    {
      reactions: [{ emoji: "✅", count: 7 }],
    },
  ),
  post(
    "feed-bu-tooltip",
    "p-base-ui",
    "project",
    42,
    "t-bu-2",
    doc(
      h3("Move workspace hovers onto Base Tooltip"),
      p(
        agentChip("a-bu-2", "Port tooltip", "unread"),
        " mapped delay and side 1:1. Content is still our list layout.",
      ),
      p("Merged ", prChip("pr-bu-2"), "."),
    ),
    {
      reactions: [{ emoji: "✨", count: 5 }],
    },
  ),
  post(
    "feed-prt-drafts",
    "b-pr-tracker",
    "bot",
    48,
    "t-prt-1",
    doc(
      h3("Suppress nags on draft PRs"),
      p("Drafts stay off the nag list. Open PRs with failing checks still surface."),
      p("Landed in ", prChip("pr-prt-1"), "."),
    ),
    {
      reactions: [{ emoji: "✅", count: 8 }],
    },
  ),
  post(
    "feed-qa-header",
    "b-qa-team",
    "bot",
    54,
    "t-qa-1",
    doc(
      h3("Smoke the project header"),
      p(
        "Title, identicon well, and tracker toggle stay named. Copy nits stayed off the list.",
      ),
      p("Merged ", prChip("pr-qa-1"), "."),
    ),
    {
      media: [
        {
          title: "header-smoke.png",
          caption: "Header names and targets",
          tone: "purple",
        },
      ],
      reactions: [{ emoji: "🧪", count: 6 }],
    },
  ),
];
