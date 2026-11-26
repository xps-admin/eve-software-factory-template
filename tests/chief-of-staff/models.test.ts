import { describe, expect, test } from "vitest";
import {
  handoffSchema,
  ideaSchema,
  prioritySchema,
  rawIdeaSchema,
} from "#lib/chief-of-staff/models.js";

describe("chief-of-staff models", () => {
  test("rawIdeaSchema validates a minimal idea", () => {
    const result = rawIdeaSchema.parse({
      source: "manual",
      text: "Build a thing",
    });
    expect(result.source).toBe("manual");
    expect(result.context).toBe("");
  });

  test("rawIdeaSchema rejects unknown fields", () => {
    expect(() =>
      rawIdeaSchema.parse({ foo: 1, source: "manual", text: "x" })
    ).toThrow();
  });

  test("prioritySchema accepts known priorities", () => {
    expect(prioritySchema.parse("urgent")).toBe("urgent");
  });

  test("ideaSchema requires id and createdAt", () => {
    expect(() =>
      ideaSchema.parse({
        createdAt: "not-a-date",
        source: "manual",
        text: "x",
        title: "t",
      })
    ).toThrow();
  });

  test("handoffSchema defaults attempts and errors", () => {
    const h = handoffSchema.parse({
      createdAt: new Date().toISOString(),
      id: "h1",
      idempotencyKey: "k",
      objectiveId: "o1",
      status: "pending",
      updatedAt: new Date().toISOString(),
    });
    expect(h.attempts).toBe(0);
    expect(h.errors).toEqual([]);
  });
});
