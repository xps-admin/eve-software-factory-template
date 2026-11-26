import { describe, expect, test } from "vitest";
import { approve, submitForApproval } from "#lib/chief-of-staff/approval.js";
import { ChiefOfStaffService } from "#lib/chief-of-staff/service.js";

describe("chief-of-staff integration", () => {
  test("intake -> approve -> handoff with fake foreman", async () => {
    const service = new ChiefOfStaffService();
    const { objective, approval } = await service.intake({
      source: "manual",
      text: "Automate reporting",
      title: "Reporting",
    });
    service.store.approvals.save(approve(submitForApproval(approval)));

    const client = {
      async handoff() {
        return { ticketId: "FOREMAN-42" };
      },
    };
    const handoff = await service.handoffObjective(objective.id, { client });
    expect(handoff.status).toBe("succeeded");
    expect(handoff.ticketId).toBe("FOREMAN-42");
  });
});
