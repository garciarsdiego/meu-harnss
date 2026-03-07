import type { UIMessage } from "../../types";

export function finalizeQueuedMessage(messages: UIMessage[], messageId: string): UIMessage[] {
  const index = messages.findIndex((message) => message.id === messageId);
  if (index < 0) return messages;

  const sentMessage = { ...messages[index], isQueued: false };
  const rest = messages.filter((message) => message.id !== messageId);
  const nonQueued = rest.filter((message) => !message.isQueued);
  const queued = rest.filter((message) => message.isQueued);
  return [...nonQueued, sentMessage, ...queued];
}

export function removeQueuedMessage(messages: UIMessage[], messageId: string): UIMessage[] {
  const nextMessages = messages.filter((message) => message.id !== messageId);
  return nextMessages.length === messages.length ? messages : nextMessages;
}
