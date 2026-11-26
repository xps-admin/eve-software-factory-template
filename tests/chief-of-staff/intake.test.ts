import { describe, expect, test } from "vitest";
import { intakeIdea } from "#lib/chief-of-staff/intake.js";
import { createLogger } from "#lib/chief-of-staff/logging.js";
import { InMemoryMetrics } from "#lib/chief-of-staff/metrics.js";
import { InMemoryChiefOfStaffStore } from "#lib/chief-of-staff/repositories.js";

describe("chief-of-staff intake", () => {
  test("validates, creates idea/objective/approval", async () => {
    const store = new InMemoryChiefOfStaffStore();
    const logger = createLogger("test");
    const metrics = new InMemoryMetrics();
    const result = await intakeIdea(
      {
        source: "manual",
        text: "Need a dashboard for metrics",
        title: "Dashboard",
      },
      { logger, metrics, store }
    );
    expect(result.idea.id).toBeTruthy();
    expect(result.objective.ideaId).toBe(result.idea.id);
    expect(result.approval.status).toBe("draft");
    expect(store.ideas.list()).toHaveLength(1);
    expect(store.objectives.list()).toHaveLength(1);
    expect(store.approvals.list()).toHaveLength(1);
    expect(metrics.get("chief_of_staff_ideas_intaken_total")).toBe(1);
  });

  test("rejects invalid raw idea", async () => {
    const store = new InMemoryChiefOfStaffStore();
    await expect(
      intakeIdea({ source: "", text: "x" }, { store })
    ).rejects.toThrow();
  });
});
