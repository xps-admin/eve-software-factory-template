import type {
  ApprovalRecord,
  HandoffRecord,
  Idea,
  Objective,
} from "./models.js";

/**
 * Repository interfaces for the Chief of Staff store.
 *
 * @remarks
 * Every method is synchronous against the in-memory store but typed to also
 * accept a thenable return so a future persistent implementation can be
 * dropped in without changing callers.
 */

export interface IdeaRepository {
  all: () => Idea[];
  clear: () => void;
  create: (entity: Idea) => Idea;
  delete: (id: string) => boolean;
  find: (id: string) => Idea | null;
  findAll: () => Idea[];
  findById: (id: string) => Idea | null;
  get: (id: string) => Idea | null;
  insert: (entity: Idea) => Idea;
  list: () => Idea[];
  remove: (id: string) => boolean;
  save: (entity: Idea) => Idea;
  update: (entity: Idea) => Idea;
  upsert: (entity: Idea) => Idea;
}

export interface ObjectiveRepository {
  all: () => Objective[];
  clear: () => void;
  create: (entity: Objective) => Objective;
  delete: (id: string) => boolean;
  find: (id: string) => Objective | null;
  findAll: () => Objective[];
  findById: (id: string) => Objective | null;
  findByIdeaId: (ideaId: string) => Objective | null;
  get: (id: string) => Objective | null;
  insert: (entity: Objective) => Objective;
  list: () => Objective[];
  listByIdeaId: (ideaId: string) => Objective[];
  remove: (id: string) => boolean;
  save: (entity: Objective) => Objective;
  update: (entity: Objective) => Objective;
  upsert: (entity: Objective) => Objective;
}

export interface ApprovalRepository {
  all: () => ApprovalRecord[];
  clear: () => void;
  create: (entity: ApprovalRecord) => ApprovalRecord;
  delete: (id: string) => boolean;
  find: (id: string) => ApprovalRecord | null;
  findAll: () => ApprovalRecord[];
  findById: (id: string) => ApprovalRecord | null;
  findByObjectiveId: (objectiveId: string) => ApprovalRecord | null;
  get: (id: string) => ApprovalRecord | null;
  insert: (entity: ApprovalRecord) => ApprovalRecord;
  list: () => ApprovalRecord[];
  listByObjectiveId: (objectiveId: string) => ApprovalRecord[];
  remove: (id: string) => boolean;
  save: (entity: ApprovalRecord) => ApprovalRecord;
  update: (entity: ApprovalRecord) => ApprovalRecord;
  upsert: (entity: ApprovalRecord) => ApprovalRecord;
}

export interface HandoffRepository {
  all: () => HandoffRecord[];
  clear: () => void;
  create: (entity: HandoffRecord) => HandoffRecord;
  delete: (id: string) => boolean;
  find: (id: string) => HandoffRecord | null;
  findAll: () => HandoffRecord[];
  findById: (id: string) => HandoffRecord | null;
  findByIdempotencyKey: (key: string) => HandoffRecord | null;
  findByObjectiveId: (objectiveId: string) => HandoffRecord | null;
  get: (id: string) => HandoffRecord | null;
  insert: (entity: HandoffRecord) => HandoffRecord;
  list: () => HandoffRecord[];
  listByObjectiveId: (objectiveId: string) => HandoffRecord[];
  remove: (id: string) => boolean;
  save: (entity: HandoffRecord) => HandoffRecord;
  update: (entity: HandoffRecord) => HandoffRecord;
  upsert: (entity: HandoffRecord) => HandoffRecord;
}

export interface ChiefOfStaffStore {
  // Aliases for the aggregated repositories.
  approvalRepository: ApprovalRepository;
  approvals: ApprovalRepository;
  // Convenience accessors.
  clear: () => void;
  handoffRepository: HandoffRepository;
  handoffs: HandoffRepository;
  ideaRepository: IdeaRepository;
  ideas: IdeaRepository;
  objectiveRepository: ObjectiveRepository;
  objectives: ObjectiveRepository;
}

class InMemoryRepository<T extends { id: string }> {
  // Generic implementation specialized per entity at runtime; the casts below
  // keep the single implementation reusable across entity types.
  private readonly items = new Map<string, T>();

  all(): T[] {
    return [...this.items.values()];
  }

  clear(): void {
    this.items.clear();
  }

  create(entity: T): T {
    return this.save(entity);
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  find(id: string): T | null {
    return this.items.get(id) ?? null;
  }

  findAll(): T[] {
    return this.all();
  }

  findById(id: string): T | null {
    return this.find(id);
  }

  get(id: string): T | null {
    return this.find(id);
  }

  insert(entity: T): T {
    return this.save(entity);
  }

  list(): T[] {
    return this.all();
  }

  remove(id: string): boolean {
    return this.delete(id);
  }

  save(entity: T): T {
    this.items.set(entity.id, entity);
    return entity;
  }

  update(entity: T): T {
    this.items.set(entity.id, entity);
    return entity;
  }

  upsert(entity: T): T {
    return this.save(entity);
  }
}

// Entity-specific subclasses keep the typed repository interfaces honest.

export class InMemoryIdeaRepository
  extends InMemoryRepository<Idea>
  implements IdeaRepository {}

export class InMemoryObjectiveRepository
  extends InMemoryRepository<Objective>
  implements ObjectiveRepository
{
  findByIdeaId(ideaId: string): Objective | null {
    return this.all().find((item) => item.ideaId === ideaId) ?? null;
  }

  listByIdeaId(ideaId: string): Objective[] {
    return this.all().filter((item) => item.ideaId === ideaId);
  }
}

export class InMemoryApprovalRepository
  extends InMemoryRepository<ApprovalRecord>
  implements ApprovalRepository
{
  findByObjectiveId(objectiveId: string): ApprovalRecord | null {
    return this.all().find((item) => item.objectiveId === objectiveId) ?? null;
  }

  listByObjectiveId(objectiveId: string): ApprovalRecord[] {
    return this.all().filter((item) => item.objectiveId === objectiveId);
  }
}

export class InMemoryHandoffRepository
  extends InMemoryRepository<HandoffRecord>
  implements HandoffRepository
{
  findByIdempotencyKey(key: string): HandoffRecord | null {
    return this.all().find((item) => item.idempotencyKey === key) ?? null;
  }

  findByObjectiveId(objectiveId: string): HandoffRecord | null {
    return this.all().find((item) => item.objectiveId === objectiveId) ?? null;
  }

  listByObjectiveId(objectiveId: string): HandoffRecord[] {
    return this.all().filter((item) => item.objectiveId === objectiveId);
  }
}

export class InMemoryChiefOfStaffStore implements ChiefOfStaffStore {
  readonly approvals = new InMemoryApprovalRepository();
  readonly handoffs = new InMemoryHandoffRepository();
  readonly ideas = new InMemoryIdeaRepository();
  readonly objectives = new InMemoryObjectiveRepository();

  get approvalRepository(): ApprovalRepository {
    return this.approvals;
  }

  get handoffRepository(): HandoffRepository {
    return this.handoffs;
  }

  get ideaRepository(): IdeaRepository {
    return this.ideas;
  }

  get objectiveRepository(): ObjectiveRepository {
    return this.objectives;
  }

  clear(): void {
    this.ideas.clear();
    this.objectives.clear();
    this.approvals.clear();
    this.handoffs.clear();
  }
}

// Common aliases.
export const InMemoryStore = InMemoryChiefOfStaffStore;
export const MemoryStore = InMemoryChiefOfStaffStore;
export type InMemoryStore = InMemoryChiefOfStaffStore;
export type MemoryStore = InMemoryChiefOfStaffStore;
export type Store = ChiefOfStaffStore;
export type ChiefOfStaffRepositoryStore = ChiefOfStaffStore;
