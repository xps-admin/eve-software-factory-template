import type { Idea, Priority, RawIdea } from "./models.js";

const URGENT = /\b(urgent|asap|emergency|blocker|critical|p0)\b/;
const HIGH = /\b(high|important|soon|priority)\b/;
const LOW = /\b(low|later|backlog|nice to have|minor)\b/;

/**
 * Pluggable prioritization.
 */
export interface Prioritizer {
  prioritize: (
    input: Idea | RawIdea | string | { text?: string; title?: string }
  ) => Priority;
}

export type Prioritize = Prioritizer["prioritize"];

const textOf = (
  input: Idea | RawIdea | string | { text?: string; title?: string }
): string => {
  if (typeof input === "string") {
    return input;
  }
  if ("text" in input && typeof input.text === "string") {
    return `${input.title ?? ""} ${input.text}`;
  }
  return "";
};

export const heuristicPrioritizer: Prioritizer = {
  prioritize(input) {
    const text = textOf(input).toLowerCase();
    if (URGENT.test(text)) {
      return "urgent";
    }
    if (HIGH.test(text)) {
      return "high";
    }
    if (LOW.test(text)) {
      return "low";
    }
    return "normal";
  },
};

export const HeuristicPrioritizer = heuristicPrioritizer;

export const createPrioritizer = (
  fn: Prioritizer["prioritize"]
): Prioritizer => ({
  prioritize: fn,
});

export function prioritize(
  input: Idea | RawIdea | string,
  prioritizer: Prioritizer = heuristicPrioritizer
): Priority {
  return prioritizer.prioritize(input);
}
