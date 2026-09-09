import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { JSONContent } from "@tiptap/core";
import { AgentStatusIcon } from "@/components/ui/AgentStatusIcon";
import { Icon } from "@/components/ui/Icon";
import { useWindowId } from "@/components/window/WindowContext";
import { prStateColor, prStateIcon, type PrState } from "@/data/pullRequests";
import { isAgentStatus } from "@/lib/agentStatusVisual";
import { isPrState } from "@/lib/prStateVisual";
import { useWorkspaceStore } from "@/store/useWorkspaceStore";
import type { AgentStatus } from "@/types";
import "@/components/tiptap-node/agent-link-node/agent-link-node.scss";
import "@/components/tiptap-node/heading-node/heading-node.scss";
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss";
import "@/components/tiptap-node/pr-link-node/pr-link-node.scss";
import "@/components/tabs/tabTypes/feed-doc.scss";

function statusFromAttr(value: unknown): AgentStatus {
  return isAgentStatus(value) ? value : "idle";
}

function stateFromAttr(value: unknown): PrState {
  return isPrState(value) ? value : "open";
}

function FeedAgentChip({
  id,
  label,
  status,
}: {
  id: string;
  label: string;
  status: AgentStatus;
}) {
  const windowId = useWindowId();
  const setActiveAgent = useWorkspaceStore((s) => s.setActiveAgent);
  const liveStatus = useWorkspaceStore((s) => {
    const agent = s.agents[id];
    return agent && isAgentStatus(agent.status) ? agent.status : undefined;
  });
  const resolved = liveStatus ?? status;

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!id) return;
    setActiveAgent(windowId, id);
  };

  return (
    <span className="agent-link-node">
      <a href={`#agent/${id}`} className="agent-link-node__link" onClick={onClick}>
        {resolved === "running" && (
          <AgentStatusIcon status={resolved} className="agent-link-node__icon" />
        )}
        <span className="agent-link-node__label">{label}</span>
      </a>
    </span>
  );
}

function FeedPrChip({ id, label, state }: { id: string; label: string; state: PrState }) {
  const windowId = useWindowId();
  const openPrTab = useWorkspaceStore((s) => s.openPrTab);

  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (id) openPrTab(windowId, id);
  };

  const done = state === "merged" || state === "closed";

  return (
    <span className="pr-link-node">
      <a
        href={`#pr/${id}`}
        className={`pr-link-node__link${done ? " pr-link-node__link--done" : ""}`}
        style={{ "--pr-status": prStateColor(state) } as CSSProperties}
        onClick={onClick}
      >
        <span className="pr-link-node__icon">
          <Icon
            name={prStateIcon(state)}
            size="base"
            color="inherit"
            style={{ color: prStateColor(state) }}
          />
        </span>
        <span className="pr-link-node__label">{label}</span>
      </a>
    </span>
  );
}

function renderMarks(text: string, marks: JSONContent["marks"], key: string): ReactNode {
  let node: ReactNode = text;
  for (const mark of marks ?? []) {
    switch (mark.type) {
      case "bold":
        node = <strong key={`${key}-b`}>{node}</strong>;
        break;
      case "italic":
        node = <em key={`${key}-i`}>{node}</em>;
        break;
      case "strike":
        node = <s key={`${key}-s`}>{node}</s>;
        break;
      case "code":
        node = <code key={`${key}-c`}>{node}</code>;
        break;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "";
        node = (
          <a key={`${key}-a`} href={href || undefined}>
            {node}
          </a>
        );
        break;
      }
      default:
        break;
    }
  }
  return node;
}

function renderInline(nodes: JSONContent[] | undefined, keyPrefix: string): ReactNode[] {
  return (nodes ?? []).map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.type) {
      case "text":
        return (
          <span key={key}>{renderMarks(node.text ?? "", node.marks, key)}</span>
        );
      case "hardBreak":
        return <br key={key} />;
      case "agentLink": {
        const id = typeof node.attrs?.id === "string" ? node.attrs.id : "";
        const label = typeof node.attrs?.label === "string" ? node.attrs.label : "";
        return (
          <FeedAgentChip
            key={key}
            id={id}
            label={label}
            status={statusFromAttr(node.attrs?.status)}
          />
        );
      }
      case "prLink": {
        const id = typeof node.attrs?.id === "string" ? node.attrs.id : "";
        const label = typeof node.attrs?.label === "string" ? node.attrs.label : "";
        return (
          <FeedPrChip
            key={key}
            id={id}
            label={label}
            state={stateFromAttr(node.attrs?.state)}
          />
        );
      }
      default:
        return null;
    }
  });
}

function headingTag(level: number): "h1" | "h2" | "h3" | "h4" {
  switch (level) {
    case 1:
      return "h1";
    case 2:
      return "h2";
    case 3:
      return "h3";
    case 4:
      return "h4";
    default:
      return "h4";
  }
}

function renderBlock(node: JSONContent, key: string): ReactNode {
  switch (node.type) {
    case "doc":
      return (
        <div key={key} className="tiptap ProseMirror feed-doc">
          {(node.content ?? []).map((child, index) => renderBlock(child, `${key}-${index}`))}
        </div>
      );
    case "heading": {
      const Tag = headingTag(typeof node.attrs?.level === "number" ? node.attrs.level : 4);
      return <Tag key={key}>{renderInline(node.content, key)}</Tag>;
    }
    case "paragraph":
      return <p key={key}>{renderInline(node.content, key)}</p>;
    default:
      return null;
  }
}

/** Read-only TipTap JSON. Reuses document chips without a ProseMirror editor. */
export function FeedDoc({ content }: { content: JSONContent }) {
  if (content.type === "doc") return renderBlock(content, "doc");
  return (
    <div className="tiptap ProseMirror feed-doc">{renderBlock(content, "doc")}</div>
  );
}
