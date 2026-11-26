import type {
  ApprovalHistoryEntry,
  ApprovalRecord,
  ApprovalStatus,
} from "./models.js";

export class ApprovalTransitionError extends Error {
  readonly code = "APPROVAL_TRANSITION";
  readonly from: ApprovalStatus;
  readonly to: ApprovalStatus;

  constructor(from: ApprovalStatus, to: ApprovalStatus, message?: string) {
    super(message ?? `Invalid approval transition: ${from} -> ${to}`);
    this.name = "ApprovalTransitionError";
    this.from = from;
    this.to = to;
  }
}

export const APPROVAL_TRANSITIONS: Record<
  ApprovalStatus,
  readonly ApprovalStatus[]
> = {
  approved: ["handed_off"],
  cancelled: [],
  changes_requested: ["pending", "cancelled"],
  draft: ["pending", "cancelled"],
  handed_off: [],
  pending: ["approved", "rejected", "changes_requested", "cancelled"],
  rejected: [],
};

export function canTransition(
  from: ApprovalStatus,
  to: ApprovalStatus
): boolean {
  return APPROVAL_TRANSITIONS[from].includes(to);
}

export interface TransitionOptions {
  actor?: string;
  at?: string;
  reason?: string;
}

export function transitionApproval(
  approval: ApprovalRecord,
  to: ApprovalStatus,
  options: TransitionOptions = {}
): ApprovalRecord {
  if (!canTransition(approval.status, to)) {
    throw new ApprovalTransitionError(approval.status, to);
  }
  const at = options.at ?? new Date().toISOString();
  const entry: ApprovalHistoryEntry = {
    actor: options.actor,
    at,
    from: approval.status,
    reason: options.reason,
    to,
  };
  return {
    ...approval,
    actor: options.actor ?? approval.actor,
    history: [...approval.history, entry],
    reason: options.reason ?? approval.reason,
    status: to,
    updatedAt: at,
  };
}

const transition = (
  approval: ApprovalRecord,
  to: ApprovalStatus,
  options?: TransitionOptions
) => transitionApproval(approval, to, options);

export function submitForApproval(
  approval: ApprovalRecord,
  options: TransitionOptions = {}
): ApprovalRecord {
  return transition(approval, "pending", options);
}

export function submit(
  approval: ApprovalRecord,
  options: TransitionOptions = {}
): ApprovalRecord {
  return submitForApproval(approval, options);
}

export function approve(
  approval: ApprovalRecord,
  actor?: string,
  reason?: string,
  at?: string
): ApprovalRecord {
  return transitionApproval(approval, "approved", { actor, at, reason });
}

export function reject(
  approval: ApprovalRecord,
  actor?: string,
  reason?: string,
  at?: string
): ApprovalRecord {
  return transitionApproval(approval, "rejected", { actor, at, reason });
}

export function requestChanges(
  approval: ApprovalRecord,
  actor?: string,
  reason?: string,
  at?: string
): ApprovalRecord {
  return transitionApproval(approval, "changes_requested", {
    actor,
    at,
    reason,
  });
}

export function revise(
  approval: ApprovalRecord,
  options: TransitionOptions = {}
): ApprovalRecord {
  return transition(approval, "pending", options);
}

export function resubmit(
  approval: ApprovalRecord,
  options: TransitionOptions = {}
): ApprovalRecord {
  return revise(approval, options);
}

export function cancel(
  approval: ApprovalRecord,
  options: TransitionOptions = {}
): ApprovalRecord {
  return transition(approval, "cancelled", options);
}

export function markHandedOff(
  approval: ApprovalRecord,
  options: TransitionOptions = {}
): ApprovalRecord {
  return transition(approval, "handed_off", options);
}

export function createApprovalRecord(
  objectiveId: string,
  now: string = new Date().toISOString()
): ApprovalRecord {
  return {
    actor: undefined,
    createdAt: now,
    history: [],
    id: `approval:${objectiveId}`,
    objectiveId,
    reason: undefined,
    status: "draft",
    updatedAt: now,
  };
}

export const createApproval = createApprovalRecord;
export const newApproval = createApprovalRecord;
