import { randomUUID } from "node:crypto";

import { createApprovalRecord } from "./approval.js";
import type { Logger } from "./logging.js";
import type { InMemoryMetrics } from "./metrics.js";
import type { Idea, Objective, Priority, RawIdea } from "./models.js";
import { rawIdeaSchema } from "./models.js";
import { heuristicPrioritizer } from "./prioritizer.js";
import type { ChiefOfStaffStore } from "./repositories.js";
import { InMemoryChiefOfStaffStore } from "./repositories.js";
import { structureIdea } from "./structuring.js";

const SENTENCE_SPLIT = /[.!?]\s/;

export interface IntakeDependencies {
  idGenerator?: () => string;
  logger?: Logger;
  metrics?: InMemoryMetrics;
  now?: () => string;
  prioritizer?: { prioritize: (input: RawIdea | Idea | string) => Priority };
  store?: ChiefOfStaffStore;
  structurer?: (idea: Idea, options?: unknown) => Objective;
}

export type IntakeOptions = IntakeDependencies;

const resolveStore = (
  deps: IntakeDependencies | ChiefOfStaffStore | undefined
): ChiefOfStaffStore => {
  if (!deps) {
    return new InMemoryChiefOfStaffStore();
  }
  if ("ideas" in deps && "objectives" in deps) {
    return deps as ChiefOfStaffStore;
  }
  return (deps as IntakeDependencies).store ?? new InMemoryChiefOfStaffStore();
};

export async function intakeIdea(
  input: unknown,
  depsOrStore: IntakeDependencies | ChiefOfStaffStore = {}
): Promise<{
  idea: Idea;
  objective: Objective;
  approval: ReturnType<typeof createApprovalRecord>;
}> {
  const deps: IntakeDependencies =
    "ideas" in depsOrStore && "objectives" in depsOrStore
      ? { store: depsOrStore as ChiefOfStaffStore }
      : (depsOrStore as IntakeDependencies);

  const store = resolveStore(deps);
  const now = deps.now ?? (() => new Date().toISOString());
  const idGenerator = deps.idGenerator ?? randomUUID;
  const prioritizer = deps.prioritizer ?? heuristicPrioritizer;
  const { logger, metrics } = deps;

  const parsed = await rawIdeaSchema.parseAsync(input);
  const idea: Idea = {
    context: parsed.context ?? "",
    createdAt: parsed.createdAt ?? now(),
    id: parsed.id ?? idGenerator(),
    priority: prioritizer.prioritize(parsed),
    priorityHint: parsed.priorityHint,
    source: parsed.source,
    text: parsed.text,
    title:
      parsed.title ??
      parsed.text.split(SENTENCE_SPLIT)[0]?.trim().slice(0, 120) ??
      "Untitled idea",
  };

  store.ideas.save(idea);

  const structurer =
    deps.structurer ?? ((value: Idea) => structureIdea(value, { prioritizer }));
  const objective = structurer(idea);
  if (!objective.createdAt) {
    objective.createdAt = now();
  }
  store.objectives.save(objective);

  const approval = createApprovalRecord(objective.id, now());
  store.approvals.save(approval);

  logger?.info?.("idea intaken", {
    ideaId: idea.id,
    objectiveId: objective.id,
  });
  metrics?.increment?.("chief_of_staff_ideas_intaken_total", 1);

  return { approval, idea, objective };
}

export const intake = intakeIdea;
export const createIdea = intakeIdea;
