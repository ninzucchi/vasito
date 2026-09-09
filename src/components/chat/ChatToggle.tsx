import { IconButton } from "@/components/ui/IconButton";
import { useWindowId } from "@/components/window/WindowContext";
import { useActiveContent, useWindow, useWorkspaceStore } from "@/store/useWorkspaceStore";

/** Show/hide the chat (agent) panel. Lives left of the content split toggle
 *  in the window's top-right, and only while the content pane is open.
 *  Expand hides the chat so content is fullscreen; contract restores the chat. */
export function ChatToggle() {
  const windowId = useWindowId();
  const contentOpen = useActiveContent().open;
  const chatCollapsed = useWindow()?.chatCollapsed ?? false;
  const toggleChat = useWorkspaceStore((s) => s.toggleChat);
  const fullscreen = chatCollapsed;
  if (!contentOpen) return null;
  return (
    <IconButton
      name={fullscreen ? "arrows-contract-simple" : "arrows-expand-simple"}
      size="lg"
      color="tertiary"
      onClick={() => toggleChat(windowId)}
      aria-label={fullscreen ? "Show agent panel" : "Hide agent panel"}
      aria-pressed={!fullscreen}
    />
  );
}
