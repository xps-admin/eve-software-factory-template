import {
  approve,
  cancel,
  reject,
  requestChanges,
  revise,
  submitForApproval,
} from "./approval.js";
import { type HandoffDependencies, handoffObjective } from "./handoff.js";
import { type IntakeDependencies, intakeIdea } from "./intake.js";
import type { Logger } from "./logging.js";
import type { InMemoryMetrics } from "./metrics.js";
import type { ApprovalRecord, Idea, Objective, RawIdea } from "./models.js";
import type { ChiefOfStaffStore } from "./repositories.js";
import { InMemoryChiefOfStaffStore } from "./repositories.js";

export interface ChiefOfStaffServiceDependencies
  extends IntakeDependencies,
    HandoffDependencies {
  logger?: Logger;
  metrics?: InMemoryMetrics;
  store?: ChiefOfStaffStore;
}

export class ChiefOfStaffService {
  readonly deps: ChiefOfStaffServiceDependencies;
  readonly store: ChiefOfStaffStore;

  constructor(deps: ChiefOfStaffServiceDependencies | ChiefOfStaffStore = {}) {
    if ("ideas" in deps && "objectives" in deps) {
      this.store = deps as ChiefOfStaffStore;
      this.deps = { store: this.store };
    } else {
      this.deps = deps as ChiefOfStaffServiceDependencies;
      this.store = this.deps.store ?? new InMemoryChiefOfStaffStore();
      this.deps.store = this.store;
    }
  }

  async intake(
    input: RawIdea | unknown,
    deps: ChiefOfStaffServiceDependencies = {}
  ) {
    return await intakeIdea(input, {
      ...this.deps,
      ...deps,
      store: this.store,
    });
  }

  async intakeIdea(
    input: RawIdea | unknown,
    deps: ChiefOfStaffServiceDependencies = {}
  ) {
    return await this.intake(input, deps);
  }

  getApproval(objectiveId: string): ApprovalRecord | null {
    return this.store.approvals.findByObjectiveId(objectiveId);
  }

  getIdea(id: string): Idea | null {
    return this.store.ideas.get(id);
  }

  getObjective(id: string): Objective | null {
    return this.store.objectives.get(id);
  }

  private approvalFor(
    target: string | ApprovalRecord | { objectiveId?: string }
  ): ApprovalRecord | null {
    if (typeof target === "string") {
      return (
        this.store.approvals.findByObjectiveId(target) ??
        this.store.approvals.get(target)
      );
    }
    if (
      target &&
      typeof target === "object" &&
      "objectiveId" in target &&
      target.objectiveId
    ) {
      return (
        this.store.approvals.findByObjectiveId(target.objectiveId) ??
        this.store.approvals.get((target as { id?: string }).id ?? "")
      );
    }
    if (target && typeof target === "object" && "id" in target) {
      return this.store.approvals.get((target as { id: string }).id) ?? null;
    }
    return null;
  }

  submit(target: string | ApprovalRecord, actor?: string, reason?: string) {
    const approval = this.approvalFor(target as string | ApprovalRecord);
    if (!approval) {
      throw new Error("Approval not found");
    }
    const updated = submitForApproval(approval, { actor, reason });
    this.store.approvals.save(updated);
    return updated;
  }

  approve(target: string | ApprovalRecord, actor?: string, reason?: string) {
    const approval = this.approvalFor(target as string | ApprovalRecord);
    if (!approval) {
      throw new Error("Approval not found");
    }
    const updated = approve(approval, actor, reason);
    this.store.approvals.save(updated);
    return updated;
  }

  reject(target: string | ApprovalRecord, actor?: string, reason?: string) {
    const approval = this.approvalFor(target as string | ApprovalRecord);
    if (!approval) {
      throw new Error("Approval not found");
    }
    const updated = reject(approval, actor, reason);
    this.store.approvals.save(updated);
    return updated;
  }

  requestChanges(
    target: string | ApprovalRecord,
    actor?: string,
    reason?: string
  ) {
    const approval = this.approvalFor(target as string | ApprovalRecord);
    if (!approval) {
      throw new Error("Approval not found");
    }
    const updated = requestChanges(approval, actor, reason);
    this.store.approvals.save(updated);
    return updated;
  }

  cancel(target: string | ApprovalRecord, actor?: string, reason?: string) {
    const approval = this.approvalFor(target as string | ApprovalRecord);
    if (!approval) {
      throw new Error("Approval not found");
    }
    const updated = cancel(approval, { actor, reason });
    this.store.approvals.save(updated);
    return updated;
  }

  revise(target: string | ApprovalRecord, actor?: string, reason?: string) {
    const approval = this.approvalFor(target as string | ApprovalRecord);
    if (!approval) {
      throw new Error("Approval not found");
    }
    const updated = revise(approval, { actor, reason });
    this.store.approvals.save(updated);
    return updated;
  }

  approveObjective(objectiveId: string, actor?: string, reason?: string) {
    const approval = this.store.approvals.findByObjectiveId(objectiveId);
    if (!approval) {
      throw new Error(`Approval not found for objective: ${objectiveId}`);
    }
    const updated = approve(approval, actor, reason);
    this.store.approvals.save(updated);
    return updated;
  }

  rejectObjective(objectiveId: string, actor?: string, reason?: string) {
    const approval = this.store.approvals.findByObjectiveId(objectiveId);
    if (!approval) {
      throw new Error(`Approval not found for objective: ${objectiveId}`);
    }
    const updated = reject(approval, actor, reason);
    this.store.approvals.save(updated);
    return updated;
  }

  requestChangesObjective(
    objectiveId: string,
    actor?: string,
    reason?: string
  ) {
    const approval = this.store.approvals.findByObjectiveId(objectiveId);
    if (!approval) {
      throw new Error(`Approval not found for objective: ${objectiveId}`);
    }
    const updated = requestChanges(approval, actor, reason);
    this.store.approvals.save(updated);
    return updated;
  }

  cancelObjective(objectiveId: string, actor?: string, reason?: string) {
    const approval = this.store.approvals.findByObjectiveId(objectiveId);
    if (!approval) {
      throw new Error(`Approval not found for objective: ${objectiveId}`);
    }
    const updated = cancel(approval, { actor, reason });
    this.store.approvals.save(updated);
    return updated;
  }

  reviseObjective(objectiveId: string, actor?: string, reason?: string) {
    const approval = this.store.approvals.findByObjectiveId(objectiveId);
    if (!approval) {
      throw new Error(`Approval not found for objective: ${objectiveId}`);
    }
    const updated = revise(approval, { actor, reason });
    this.store.approvals.save(updated);
    return updated;
  }

  async handoffObjective(
    objectiveId: string,
    deps: ChiefOfStaffServiceDependencies = {}
  ) {
    return await handoffObjective(objectiveId, {
      ...this.deps,
      ...deps,
      store: this.store,
    });
  }

  async handoff(
    objectiveOrId: Objective | string,
    deps: ChiefOfStaffServiceDependencies = {}
  ) {
    return await handoffObjective(objectiveOrId, {
      ...this.deps,
      ...deps,
      store: this.store,
    });
  }

  listIdeas(): Idea[] {
    return this.store.ideas.list();
  }

  listObjectives(): Objective[] {
    return this.store.objectives.list();
  }
}

export const Coordinator = ChiefOfStaffService;
export const ChiefOfStaffCoordinator = ChiefOfStaffService;
export const ChiefOfStaff = ChiefOfStaffService;
export type Coordinator = ChiefOfStaffService;

export function createChiefOfStaff(
  deps?: ChiefOfStaffServiceDependencies | ChiefOfStaffStore
) {
  return new ChiefOfStaffService(deps ?? {});
}

export const createCoordinator = createChiefOfStaff;
export const createService = createChiefOfStaff;
