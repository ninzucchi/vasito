import { lazy, Suspense, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import * as Popover from "@radix-ui/react-popover";
import clsx from "clsx";
import { ProjectBadge } from "@/components/chat/ProjectBadge";
import { BotBadge } from "@/components/ui/BotBadge";
import { Icon } from "@/components/ui/Icon";
import { IconButton } from "@/components/ui/IconButton";
import { OutlineButton } from "@/components/ui/OutlineButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSection,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { useWindowId } from "@/components/window/WindowContext";
import {
  STATUS_FEED_POSTS,
  type FeedPost,
  type FeedReaction,
} from "@/data/statusFeed";
import { FeedDoc } from "@/lib/feedDoc";
import { isBot, isProject, type Agent } from "@/types";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";

const FeedEmojiPicker = lazy(async () => {
  const mod = await import("./FeedEmojiPicker");
  return { default: mod.FeedEmojiPicker };
});

const AVATAR = 32;

function formatFeedTime(postedAt: number): string {
  const minutes = Math.max(0, Math.round((Date.now() - postedAt) / 60_000));
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(postedAt).toLocaleDateString();
}

function FeedAuthorAvatar({ author }: { author: Agent }) {
  if (isBot(author)) {
    return (
      <BotBadge
        size={AVATAR}
        name={author.title}
        color={author.color ?? "blue"}
        seed={author.identiconSeed}
        circle
      />
    );
  }
  if (isProject(author)) {
    return (
      <ProjectBadge
        size={AVATAR}
        icon={author.icon ?? "folder"}
        color={author.color ?? "default"}
        circle
      />
    );
  }
  return (
    <div className="rounded-full bg-tertiary" style={{ width: AVATAR, height: AVATAR }} />
  );
}

function FeedMediaCard() {
  return (
    <div
      aria-hidden="true"
      className="aspect-[16/10] min-w-0 flex-1 rounded-2xl bg-elevated shadow-[0_0_0_1px_var(--border-secondary)]"
    />
  );
}

function FeedReplyComposer({
  authorName,
  onSend,
}: {
  authorName: string;
  onSend: (text: string) => void;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [empty, setEmpty] = useState(true);
  const placeholder = `Reply to ${authorName}…`;

  const autosize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 80)}px`;
  };

  const submit = () => {
    const el = inputRef.current;
    const value = el?.value.trim() ?? "";
    if (!el || !value) return;
    onSend(value);
    el.value = "";
    setEmpty(true);
    autosize();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submit();
  };

  return (
    <div className="flex flex-col rounded-2xl bg-elevated shadow-[0_0_0_1px_var(--border-secondary)]">
      <div className="relative px-2.5 pt-2.5">
        <textarea
          ref={inputRef}
          rows={1}
          autoFocus
          aria-label={placeholder}
          onInput={() => {
            autosize();
            setEmpty(!inputRef.current?.value.trim());
          }}
          onChange={() => {
            autosize();
            setEmpty(!inputRef.current?.value.trim());
          }}
          onKeyDown={onKeyDown}
          style={{ minHeight: 20, maxHeight: 80 }}
          className="w-full min-w-0 resize-none overflow-y-auto bg-transparent text-lg leading-[20px] text-primary outline-none"
        />
        {empty && (
          <div className="pointer-events-none absolute inset-x-2.5 top-2.5 truncate text-lg leading-[20px] text-quaternary">
            {placeholder}
          </div>
        )}
      </div>
      <div className="flex items-center justify-end p-2">
        <button
          type="button"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral"
          aria-label="Send reply"
          onClick={submit}
        >
          <Icon
            name="arrow-up-filled"
            size="base"
            color="inherit"
            style={{ color: "var(--text-inverted)", opacity: empty ? 0.4 : 1 }}
          />
        </button>
      </div>
    </div>
  );
}

function FeedPostCard({
  post,
  author,
  reactions,
  commenting,
  onToggleComment,
  onReply,
  onReact,
  onOpenAuthor,
}: {
  post: FeedPost;
  author: Agent;
  reactions: FeedReaction[];
  commenting: boolean;
  onToggleComment: () => void;
  onReply: (text: string) => void;
  onReact: (emoji: string) => void;
  onOpenAuthor: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}${window.location.pathname}#status/${post.id}`;
    await navigator.clipboard.writeText(url);
  };

  return (
    <article
      id={`status-${post.id}`}
      className="flex gap-3 border-b border-[var(--border-tertiary)] px-4 py-3"
    >
      <div className="w-8 shrink-0">
        <button type="button" aria-label={author.title} onClick={onOpenAuthor}>
          <FeedAuthorAvatar author={author} />
        </button>
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenAuthor}
            className="truncate text-[length:var(--font-size-chat)] font-medium leading-[var(--line-height-chat)] text-primary"
          >
            {author.title}
          </button>
          <span className="shrink-0 text-[length:var(--font-size-chat)] leading-[var(--line-height-chat)] text-tertiary">
            {formatFeedTime(post.postedAt)}
          </span>
          <div className="ml-auto shrink-0">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <IconButton
                  name="dots-3-horizontal"
                  size="sm"
                  color="tertiary"
                  aria-label="Post actions"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSection>
                  <DropdownMenuItem onSelect={() => void copyLink()}>
                    <Icon name="link" size="base" color="secondary" />
                    Copy link
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onOpenAuthor}>
                    <Icon name="chat-bubble" size="base" color="secondary" />
                    Go to message
                  </DropdownMenuItem>
                </DropdownMenuSection>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-2">
          <FeedDoc content={post.body} />
        </div>
        {post.media && post.media.length > 0 && (
          <div className={clsx("mt-2.5 flex gap-2", post.media.length > 1 && "flex-row")}>
            {post.media.map((item) => (
              <FeedMediaCard key={item.title} />
            ))}
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <OutlineButton
            size="md"
            aria-label="Comment"
            aria-expanded={commenting}
            aria-pressed={commenting}
            onClick={onToggleComment}
            className="!rounded-full"
          >
            <Icon name="chat-bubble" size="base" color={commenting ? "primary" : "tertiary"} />
          </OutlineButton>
          {reactions.length === 0 ? (
            <Popover.Root open={pickerOpen} onOpenChange={setPickerOpen}>
              <Popover.Trigger asChild>
                <OutlineButton size="md" aria-label="React" className="!rounded-full">
                  <Icon name="smiley-plus" size="base" color="tertiary" />
                </OutlineButton>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content align="start" sideOffset={6} className="z-menu">
                  {pickerOpen && (
                    <Suspense fallback={null}>
                      <FeedEmojiPicker
                        onPick={(emoji) => {
                          onReact(emoji);
                          setPickerOpen(false);
                        }}
                      />
                    </Suspense>
                  )}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          ) : (
            reactions.map((item) => (
              <OutlineButton
                key={item.emoji}
                size="md"
                aria-label={`${item.emoji} ${item.count}`}
                onClick={() => onReact(item.emoji)}
                className="gap-1 !rounded-full"
              >
                <span>{item.emoji}</span>
                <span>{item.count}</span>
              </OutlineButton>
            ))
          )}
        </div>
        {commenting && (
          <div className="mt-2">
            <FeedReplyComposer authorName={author.title} onSend={onReply} />
          </div>
        )}
      </div>
    </article>
  );
}

export function StatusFeed({ includeBots }: { includeBots: boolean }) {
  const windowId = useWindowId();
  const agents = useWorkspaceStore((s) => s.agents);
  const setActiveAgent = useWorkspaceStore((s) => s.setActiveAgent);
  const sendMessage = useWorkspaceStore((s) => s.sendMessage);
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [extraReactions, setExtraReactions] = useState<Record<string, FeedReaction[]>>({});

  const posts = useMemo(
    () =>
      STATUS_FEED_POSTS.filter((item) => includeBots || item.authorKind === "project").sort(
        (a, b) => b.postedAt - a.postedAt,
      ),
    [includeBots],
  );

  return (
    <div className="mx-auto min-h-full w-full max-w-[640px] shadow-[0_0_0_1px_var(--border-secondary)] pb-8">
      {posts.map((post) => {
        const author = agents[post.authorId];
        if (!author) return null;
        const reactions = extraReactions[post.id] ?? post.reactions;
        return (
          <FeedPostCard
            key={post.id}
            post={post}
            author={author}
            reactions={reactions}
            commenting={commentingId === post.id}
            onToggleComment={() =>
              setCommentingId((current) => (current === post.id ? null : post.id))
            }
            onReply={(text) => {
              sendMessage(post.authorId, text);
              setCommentingId(null);
            }}
            onReact={(emoji) => {
              setExtraReactions((current) => {
                const base = current[post.id] ?? post.reactions;
                const next = base.map((item) => ({ ...item }));
                const found = next.find((item) => item.emoji === emoji);
                if (found) found.count += 1;
                else next.push({ emoji, count: 1 });
                return { ...current, [post.id]: next };
              });
            }}
            onOpenAuthor={() => setActiveAgent(windowId, post.authorId)}
          />
        );
      })}
    </div>
  );
}
