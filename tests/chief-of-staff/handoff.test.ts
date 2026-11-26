import { describe, expect, test, vi } from "vitest";
import { approve, submitForApproval } from "#lib/chief-of-staff/approval.js";
import { handoffObjective } from "#lib/chief-of-staff/handoff.js";
import { intakeIdea } from "#lib/chief-of-staff/intake.js";
import { InMemoryChiefOfStaffStore } from "#lib/chief-of-staff/repositories.js";

describe("chief-of-staff handoff idempotency", () => {
  test("repeated handoffs do not call client twice", async () => {
    const store = new InMemoryChiefOfStaffStore();
    const { objective, approval } = await intakeIdea(
      { source: "manual", text: "Ship feature", title: "Ship" },
      { store }
    );
    const pending = submitForApproval(approval);
    const approved = approve(pending);
    store.approvals.save(approved);

    const client = { handoff: vi.fn(async () => ({ ticketId: "TICKET-1" })) };
    const first = await handoffObjective(objective, { client, store });
    const second = await handoffObjective(objective, { client, store });
    expect(first.ticketId).toBe("TICKET-1");
    expect(second.ticketId).toBe("TICKET-1");
    expect(client.handoff).toHaveBeenCalledTimes(1);
  });

  test("handoff requires approved", async () => {
    const store = new InMemoryChiefOfStaffStore();
    const { objective } = await intakeIdea(
      { source: "manual", text: "Ship feature", title: "Ship" },
      { store }
    );
    const client = { handoff: vi.fn(async () => "T-2") };
    await expect(
      handoffObjective(objective, { client, store })
    ).rejects.toThrow();
  });
});
