import type { Dispatch, SetStateAction } from "react";
import type { VibeAgentStreamEvent } from "./vibeProspectingAgentStream";

export interface AgentChatBubble {
  role: "user" | "assistant";
  text: string;
  downloadUrl?: string;
  rowCount?: number;
}

// A request may send incremental deltas, a complete message, and a final
// result with the same reply. Keep one bubble for the current partial reply.
export function createAgentReplyAccumulator(setMessages: Dispatch<SetStateAction<AgentChatBubble[]>>) {
  let partialText = "";
  let hasPartialBubble = false;
  const shownReplies = new Set<string>();

  const replaceLastBubble = (text: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role !== "assistant") return [...prev, { role: "assistant", text }];
      return [...prev.slice(0, -1), { ...last, text }];
    });
  };

  return {
    onEvent(event: VibeAgentStreamEvent): boolean {
      if (event.type === "message_delta") {
        if (!event.text) return true;
        if (!hasPartialBubble) partialText = "";
        partialText += event.text;
        const nextText = partialText;
        if (hasPartialBubble) replaceLastBubble(nextText);
        else setMessages((prev) => [...prev, { role: "assistant", text: nextText }]);
        hasPartialBubble = true;
        return true;
      }
      if (event.type === "message") {
        if (!event.text) return true;
        if (hasPartialBubble) replaceLastBubble(event.text);
        else setMessages((prev) => [...prev, { role: "assistant", text: event.text }]);
        hasPartialBubble = false;
        shownReplies.add(event.text);
        return true;
      }
      return false;
    },
    showFinalReply(reply?: string) {
      if (!reply) return;
      if (hasPartialBubble) replaceLastBubble(reply);
      else if (!shownReplies.has(reply)) setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      hasPartialBubble = false;
    },
  };
}
