import { randomUUID } from "node:crypto";

import type { Idea, Objective, Priority, RawIdea } from "./models.js";
import { heuristicPrioritizer } from "./prioritizer.js";

const SENTENCE_SPLIT = /[.!?]\s/;

export interface StructureOptions {
  now?: () => string;
  prioritizer?: { prioritize: (input: Idea | RawIdea | string) => Priority };
}

const nowIso = () => new Date().toISOString();

const titleFrom = (idea: Idea | RawIdea): string => {
  if (idea.title && idea.title.trim() !== "") {
    return idea.title.trim();
  }
  const firstSentence = idea.text.split(SENTENCE_SPLIT)[0]?.trim() ?? "";
  const candidate = firstSentence.length > 0 ? firstSentence : idea.text.trim();
  return candidate.slice(0, 120) || "Untitled idea";
};

const summaryFrom = (idea: Idea | RawIdea): string => {
  const text = idea.text.trim();
  return text.length <= 240 ? text : `${text.slice(0, 237)}...`;
};

export function structureIdea(
  idea: Idea | RawIdea | string,
  options: StructureOptions = {}
): Objective {
  const normalized: Idea | RawIdea =
    typeof idea === "string"
      ? {
          context: "",
          createdAt: nowIso(),
          id: "",
          source: "manual",
          text: idea,
          title: undefined,
        }
      : idea;

  const prioritizer = options.prioritizer ?? heuristicPrioritizer;
  const priority = prioritizer.prioritize(normalized as Idea | RawIdea);
  const title = titleFrom(normalized);
  const now = (options.now ?? nowIso)();
  const ideaId =
    "id" in normalized && normalized.id ? normalized.id : randomUUID();
  const objectiveId = `objective:${ideaId}`;

  return {
    acceptanceCriteria: [
      "The described outcome is delivered and verified.",
      "Relevant tests pass.",
    ],
    createdAt: now,
    desiredOutcome:
      normalized.context && normalized.context.trim() !== ""
        ? normalized.context.trim()
        : `Deliver ${title}.`,
    id: objectiveId,
    ideaId,
    priority,
    problem: normalized.text.trim(),
    summary: summaryFrom(normalized),
    title,
  };
}

export const structure = structureIdea;
export const createObjectiveFromIdea = structureIdea;
