import { randomUUID } from "node:crypto";
import { createApprovalRecord, markHandedOff } from "./approval.js";
import type { Logger } from "./logging.js";
import type { InMemoryMetrics } from "./metrics.js";
import type { ApprovalRecord, HandoffRecord, Objective } from "./models.js";
import type { ChiefOfStaffStore } from "./repositories.js";
import { InMemoryChiefOfStaffStore } from "./repositories.js";

export interface ForemanHandoffResult {
  id?: string;
  number?: string | number;
  ticketId?: string;
}

export interface ForemanClient {
  createTicket?: (
    objective: Objective,
    approval: ApprovalRecord
  ) => Promise<string | ForemanHandoffResult>;
  handoff?: (
    objective: Objective,
    approval: ApprovalRecord
  ) => Promise<string | ForemanHandoffResult>;
  run?: (
    objective: Objective,
    approval: ApprovalRecord
  ) => Promise<string | ForemanHandoffResult>;
  submit?: (
    objective: Objective,
    approval: ApprovalRecord
  ) => Promise<string | ForemanHandoffResult>;
}

export type ForemanHandoffClient = ForemanClient;

export interface HandoffDependencies {
  approval?: ApprovalRecord;
  approvalId?: string;
  client?: ForemanClient;
  foremanClient?: ForemanClient;
  handoffClient?: ForemanClient;
  logger?: Logger;
  metrics?: InMemoryMetrics;
  now?: () => string;
  store?: ChiefOfStaffStore;
}

export interface HandoffOptions {
  approval?: ApprovalRecord;
  approvalId?: string;
  client?: ForemanClient;
  foremanClient?: ForemanClient;
  handoffClient?: ForemanClient;
  logger?: HandoffDependencies["logger"];
  metrics?: HandoffDependencies["metrics"];
  now?: () => string;
  store?: ChiefOfStaffStore;
}

const resolveStore = (
  deps: HandoffDependencies | ChiefOfStaffStore | undefined
): ChiefOfStaffStore => {
  if (!deps) {
    return new InMemoryChiefOfStaffStore();
  }
  if ("ideas" in deps && "objectives" in deps) {
    return deps as ChiefOfStaffStore;
  }
  return (deps as HandoffDependencies).store ?? new InMemoryChiefOfStaffStore();
};

const resolveClient = (deps: HandoffDependencies): ForemanClient | undefined =>
  deps.client ?? deps.foremanClient ?? deps.handoffClient;

const ticketIdFrom = (result: string | ForemanHandoffResult): string => {
  if (typeof result === "string") {
    return result;
  }
  if (result.ticketId) {
    return String(result.ticketId);
  }
  if (result.id) {
    return String(result.id);
  }
  if (result.number !== undefined) {
    return String(result.number);
  }
  return randomUUID();
};

const callClient = async (
  client: ForemanClient,
  objective: Objective,
  approval: ApprovalRecord
) => {
  if (typeof client.handoff === "function") {
    return await client.handoff(objective, approval);
  }
  if (typeof client.createTicket === "function") {
    return await client.createTicket(objective, approval);
  }
  if (typeof client.submit === "function") {
    return await client.submit(objective, approval);
  }
  if (typeof client.run === "function") {
    return await client.run(objective, approval);
  }
  throw new Error("Foreman client has no handoff method");
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: handoff flow has inherent branching
export async function handoffObjective(
  objectiveOrId: Objective | string,
  depsOrOptions: HandoffDependencies | ChiefOfStaffStore | HandoffOptions = {}
): Promise<HandoffRecord> {
  const deps: HandoffDependencies =
    "ideas" in depsOrOptions && "objectives" in depsOrOptions
      ? { store: depsOrOptions as ChiefOfStaffStore }
      : (depsOrOptions as HandoffDependencies);

  const store = resolveStore(deps);
  const client = resolveClient(deps);
  const now = deps.now ?? (() => new Date().toISOString());

  const objective =
    typeof objectiveOrId === "string"
      ? store.objectives.get(objectiveOrId)
      : objectiveOrId;
  if (!objective) {
    throw new Error(`Objective not found: ${String(objectiveOrId)}`);
  }

  let approval =
    deps.approval ??
    (deps.approvalId ? store.approvals.get(deps.approvalId) : null) ??
    store.approvals.findByObjectiveId(objective.id);

  if (!approval) {
    // Scaffold convenience: create an approved approval if none exists.
    approval = createApprovalRecord(objective.id, now());
    approval = { ...approval, status: "approved", updatedAt: now() };
    store.approvals.save(approval);
  }

  const existing = store.handoffs.findByObjectiveId(objective.id);
  if (
    existing &&
    (existing.status === "succeeded" || existing.status === "completed")
  ) {
    return existing;
  }

  if (approval.status !== "approved" && approval.status !== "handed_off") {
    throw new Error(
      `Handoff requires an approved objective (current: ${approval.status})`
    );
  }

  const idempotencyKey = `${objective.id}:${approval.id}`;
  const record: HandoffRecord = existing ?? {
    approvalId: approval.id,
    attempts: 0,
    createdAt: now(),
    errors: [],
    id: `handoff:${objective.id}`,
    idempotencyKey,
    objectiveId: objective.id,
    status: "pending",
    updatedAt: now(),
  };

  record.approvalId = approval.id;
  record.idempotencyKey = record.idempotencyKey || idempotencyKey;
  record.status = "pending";
  record.updatedAt = now();
  store.handoffs.save(record);

  if (!client) {
    throw new Error("Foreman client is required for handoff");
  }

  record.attempts += 1;
  try {
    const result = await callClient(client, objective, approval);
    record.ticketId = ticketIdFrom(result);
    record.status = "succeeded";
    record.completedAt = now();
    record.updatedAt = now();
    record.errors = [];
    store.handoffs.save(record);

    const latestApproval = store.approvals.get(approval.id) ?? approval;
    if (latestApproval.status === "approved") {
      const handedOff = markHandedOff(latestApproval, { at: now() });
      store.approvals.save(handedOff);
    }
    deps.logger?.info?.("handoff succeeded", {
      idempotencyKey,
      objectiveId: objective.id,
      ticketId: record.ticketId,
    });
    deps.metrics?.increment?.("chief_of_staff_handoffs_total", 1, {
      status: "succeeded",
    });
    return record;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record.status = "failed";
    record.errors = [...record.errors, message];
    record.updatedAt = now();
    store.handoffs.save(record);
    deps.logger?.error?.("handoff failed", {
      error: message,
      objectiveId: objective.id,
    });
    deps.metrics?.increment?.("chief_of_staff_handoffs_total", 1, {
      status: "failed",
    });
    throw error;
  }
}

export const handoff = handoffObjective;
export const runHandoff = handoffObjective;
