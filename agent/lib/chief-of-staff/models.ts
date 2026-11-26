import { z } from "zod";

/**
 * Priority levels used across the Chief of Staff module.
 *
 * @remarks
 * Kept aligned with the factory's intake priorities so an idea's hint and an
 * objective's priority speak the same language.
 */
export const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const prioritySchema = z.enum(PRIORITIES);

export const APPROVAL_STATUSES = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "changes_requested",
  "handed_off",
  "cancelled",
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const approvalStatusSchema = z.enum(APPROVAL_STATUSES);

export const HANDOFF_STATUSES = [
  "pending",
  "succeeded",
  "failed",
  "skipped",
  "completed",
] as const;

export type HandoffStatus = (typeof HANDOFF_STATUSES)[number];

export const handoffStatusSchema = z.enum(HANDOFF_STATUSES);

/**
 * A raw idea as it arrives from a human or another system.
 *
 * @remarks
 * Strict: unknown fields are rejected so a typo surfaces instead of being
 * silently dropped. `id` and `createdAt` are optional on intake and are
 * generated when absent.
 */
export const rawIdeaSchema = z.strictObject({
  context: z.string().optional().default(""),
  createdAt: z.string().datetime().optional(),
  id: z.string().min(1).optional(),
  priorityHint: prioritySchema.optional(),
  source: z.string().min(1),
  text: z.string().min(1),
  title: z.string().min(1).optional(),
});

export type RawIdea = z.infer<typeof rawIdeaSchema>;

/**
 * An idea after it has been accepted and stored.
 */
export const ideaSchema = z.strictObject({
  context: z.string().default(""),
  createdAt: z.string().datetime(),
  id: z.string().min(1),
  priority: prioritySchema.optional(),
  priorityHint: prioritySchema.optional(),
  source: z.string().min(1),
  text: z.string().min(1),
  title: z.string().min(1),
});

export type Idea = z.infer<typeof ideaSchema>;

export const objectiveSchema = z.strictObject({
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  createdAt: z.string().datetime(),
  desiredOutcome: z.string().min(1),
  id: z.string().min(1),
  ideaId: z.string().min(1),
  priority: prioritySchema,
  problem: z.string().min(1),
  summary: z.string().min(1),
  title: z.string().min(1),
  updatedAt: z.string().datetime().optional(),
});

export type Objective = z.infer<typeof objectiveSchema>;

export const approvalHistoryEntrySchema = z.strictObject({
  actor: z.string().optional(),
  at: z.string().datetime(),
  from: approvalStatusSchema,
  reason: z.string().optional(),
  to: approvalStatusSchema,
});

export type ApprovalHistoryEntry = z.infer<typeof approvalHistoryEntrySchema>;

export const approvalSchema = z.strictObject({
  actor: z.string().optional(),
  createdAt: z.string().datetime(),
  history: z.array(approvalHistoryEntrySchema).default([]),
  id: z.string().min(1),
  objectiveId: z.string().min(1),
  reason: z.string().optional(),
  status: approvalStatusSchema,
  updatedAt: z.string().datetime(),
});

export type ApprovalRecord = z.infer<typeof approvalSchema>;
export type Approval = ApprovalRecord;

export const handoffSchema = z.strictObject({
  approvalId: z.string().optional(),
  attempts: z.number().int().nonnegative().default(0),
  completedAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  errors: z.array(z.string()).default([]),
  id: z.string().min(1),
  idempotencyKey: z.string().min(1),
  objectiveId: z.string().min(1),
  status: handoffStatusSchema,
  ticketId: z.string().optional(),
  updatedAt: z.string().datetime(),
});

export type HandoffRecord = z.infer<typeof handoffSchema>;
export type Handoff = HandoffRecord;

// Common aliases.
export type RawIdeaInput = RawIdea;
export type IdeaModel = Idea;
export type ObjectiveModel = Objective;
export type ApprovalModel = ApprovalRecord;
export type HandoffModel = HandoffRecord;
export const ideaInputSchema = rawIdeaSchema;
export const approvalRecordSchema = approvalSchema;
export const handoffRecordSchema = handoffSchema;
