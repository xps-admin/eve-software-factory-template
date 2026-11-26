import { describe, expect, test } from "vitest";
import {
  ApprovalTransitionError,
  approve,
  cancel,
  createApprovalRecord,
  markHandedOff,
  requestChanges,
  revise,
  submitForApproval,
} from "#lib/chief-of-staff/approval.js";

describe("chief-of-staff approval", () => {
  test("follows the state machine", () => {
    const approval = createApprovalRecord("obj-1");
    expect(approval.status).toBe("draft");
    const pending = submitForApproval(approval, { actor: "alice" });
    expect(pending.status).toBe("pending");
    const approved = approve(pending, "bob", "looks good");
    expect(approved.status).toBe("approved");
    const handedOff = markHandedOff(approved);
    expect(handedOff.status).toBe("handed_off");
  });

  test("rejects invalid transitions", () => {
    const approval = createApprovalRecord("obj-1");
    expect(() => approve(approval, "bob")).toThrow(ApprovalTransitionError);
  });

  test("changes requested can revise to pending", () => {
    const approval = submitForApproval(createApprovalRecord("obj-1"));
    const changed = requestChanges(approval, "bob", "more detail");
    expect(changed.status).toBe("changes_requested");
    const revised = revise(changed);
    expect(revised.status).toBe("pending");
  });

  test("cancel from pending", () => {
    const approval = submitForApproval(createApprovalRecord("obj-1"));
    const cancelled = cancel(approval);
    expect(cancelled.status).toBe("cancelled");
  });
});
