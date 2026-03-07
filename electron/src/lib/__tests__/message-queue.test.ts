import { describe, expect, it } from "vitest";
import type { UIMessage } from "../../../../src/types";
import {
  collectQueuedMessageIds,
  finalizeQueuedMessage,
  prioritizeQueuedEntry,
  removeQueuedEntry,
  removeQueuedMessage,
} from "../../../../src/hooks/session/message-queue-utils";
import type { QueuedMessage } from "../../../../src/hooks/session/types";

describe("finalizeQueuedMessage", () => {
  it("keeps other queued messages queued while moving the sent message into the sent section", () => {
    const messages: UIMessage[] = [
      {
        id: "assistant-1",
        role: "assistant",
        content: "Working on it",
        timestamp: 1,
      },
      {
        id: "queued-1",
        role: "user",
        content: "First queued",
        timestamp: 2,
        isQueued: true,
      },
      {
        id: "queued-2",
        role: "user",
        content: "Second queued",
        timestamp: 3,
        isQueued: true,
      },
    ];

    const updated = finalizeQueuedMessage(messages, "queued-1");

    expect(updated).toEqual([
      {
        id: "assistant-1",
        role: "assistant",
        content: "Working on it",
        timestamp: 1,
      },
      {
        id: "queued-1",
        role: "user",
        content: "First queued",
        timestamp: 2,
        isQueued: false,
      },
      {
        id: "queued-2",
        role: "user",
        content: "Second queued",
        timestamp: 3,
        isQueued: true,
      },
    ]);
  });

  it("returns the original array when the queued message is missing", () => {
    const messages: UIMessage[] = [
      {
        id: "queued-1",
        role: "user",
        content: "Queued",
        timestamp: 1,
        isQueued: true,
      },
    ];

    expect(finalizeQueuedMessage(messages, "missing-id")).toBe(messages);
  });
});

describe("removeQueuedMessage", () => {
  it("removes a queued message when sending fails", () => {
    const messages: UIMessage[] = [
      {
        id: "queued-1",
        role: "user",
        content: "Queued",
        timestamp: 1,
        isQueued: true,
      },
      {
        id: "assistant-1",
        role: "assistant",
        content: "Done",
        timestamp: 2,
      },
    ];

    expect(removeQueuedMessage(messages, "queued-1")).toEqual([
      {
        id: "assistant-1",
        role: "assistant",
        content: "Done",
        timestamp: 2,
      },
    ]);
  });

  it("returns the original array when the message is missing", () => {
    const messages: UIMessage[] = [
      {
        id: "queued-1",
        role: "user",
        content: "Queued",
        timestamp: 1,
        isQueued: true,
      },
    ];

    expect(removeQueuedMessage(messages, "missing-id")).toBe(messages);
  });
});

describe("prioritizeQueuedEntry", () => {
  it("moves the selected queued message to the front without dropping entries", () => {
    const queue: QueuedMessage[] = [
      { messageId: "queued-1", text: "First" },
      { messageId: "queued-2", text: "Second" },
      { messageId: "queued-3", text: "Third" },
    ];

    expect(prioritizeQueuedEntry(queue, "queued-3")).toEqual([
      { messageId: "queued-3", text: "Third" },
      { messageId: "queued-1", text: "First" },
      { messageId: "queued-2", text: "Second" },
    ]);
  });

  it("returns the original queue when the message is already first or missing", () => {
    const queue: QueuedMessage[] = [
      { messageId: "queued-1", text: "First" },
      { messageId: "queued-2", text: "Second" },
    ];

    expect(prioritizeQueuedEntry(queue, "queued-1")).toBe(queue);
    expect(prioritizeQueuedEntry(queue, "missing-id")).toBe(queue);
  });
});

describe("removeQueuedEntry", () => {
  it("removes only the completed queued entry from the queue", () => {
    const queue: QueuedMessage[] = [
      { messageId: "queued-1", text: "First" },
      { messageId: "queued-2", text: "Second" },
    ];

    expect(removeQueuedEntry(queue, "queued-1")).toEqual([
      { messageId: "queued-2", text: "Second" },
    ]);
  });

  it("returns the original queue when the entry is missing", () => {
    const queue: QueuedMessage[] = [
      { messageId: "queued-1", text: "First" },
    ];

    expect(removeQueuedEntry(queue, "missing-id")).toBe(queue);
  });
});

describe("collectQueuedMessageIds", () => {
  it("includes queued entries and the current in-flight queued message", () => {
    const queue: QueuedMessage[] = [
      { messageId: "queued-2", text: "Second" },
      { messageId: "queued-3", text: "Third" },
    ];

    expect(Array.from(collectQueuedMessageIds(queue, "queued-1"))).toEqual([
      "queued-2",
      "queued-3",
      "queued-1",
    ]);
  });
});
