import type { UIMessage } from "../../types";
import type { QueuedMessage } from "./types";

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

export function prioritizeQueuedEntry(queue: QueuedMessage[], messageId: string): QueuedMessage[] {
  const index = queue.findIndex((entry) => entry.messageId === messageId);
  if (index <= 0) return queue;

  const nextQueue = [...queue];
  const [selected] = nextQueue.splice(index, 1);
  nextQueue.unshift(selected);
  return nextQueue;
}

export function removeQueuedEntry(queue: QueuedMessage[], messageId: string): QueuedMessage[] {
  const nextQueue = queue.filter((entry) => entry.messageId !== messageId);
  return nextQueue.length === queue.length ? queue : nextQueue;
}

export function collectQueuedMessageIds(queue: QueuedMessage[], inFlightMessageId?: string | null): Set<string> {
  const ids = new Set(queue.map((entry) => entry.messageId));
  if (inFlightMessageId) ids.add(inFlightMessageId);
  return ids;
}
