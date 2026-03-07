import { describe, expect, it } from "vitest";
import type { UIMessage } from "../../../../src/types";
import { finalizeQueuedMessage } from "../../../../src/hooks/session/message-queue-utils";

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

    expect(updated.map((message) => ({
      id: message.id,
      isQueued: message.isQueued ?? false,
    }))).toEqual([
      { id: "assistant-1", isQueued: false },
      { id: "queued-1", isQueued: false },
      { id: "queued-2", isQueued: true },
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
