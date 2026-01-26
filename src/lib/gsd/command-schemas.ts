/**
 * Zod schemas for GSD command parameter validation
 * Used with React Hook Form for form validation
 */

import { z } from 'zod';

// Schema for commands with phase parameter only
export const phaseParamSchema = z.object({
  phase: z.number().min(1).max(100).optional(),
});

// Schema for plan-phase (phase + flags)
export const planPhaseSchema = z.object({
  phase: z.number().min(1).max(100).optional(),
  skipResearch: z.boolean().default(false),
  gaps: z.boolean().default(false),
});

// Schema for execute-phase
export const executePhaseSchema = z.object({
  phase: z.number().min(1).max(100).optional(),
  gapsOnly: z.boolean().default(false),
});

// Schema for add-phase
export const addPhaseSchema = z.object({
  name: z.string().min(1, 'Phase name is required'),
  goal: z.string().optional(),
});

// Schema for insert-phase
export const insertPhaseSchema = z.object({
  after: z.number().min(0, 'Position must be 0 or greater'),
  name: z.string().min(1, 'Phase name is required'),
  goal: z.string().optional(),
});

// Schema for new-milestone
export const newMilestoneSchema = z.object({
  version: z
    .string()
    .min(1, 'Version is required')
    .regex(/^v?\d+\.\d+/, 'Version must be like v1.0 or 1.0'),
  goal: z.string().optional(),
});

// Schema for research-phase
export const researchPhaseSchema = z.object({
  phase: z.number().min(1).max(100).optional(),
  topic: z.string().optional(),
});

// Schema for quick-task
export const quickTaskSchema = z.object({
  description: z.string().min(1, 'Task description is required'),
});

// Schema for quick-fix
export const quickFixSchema = z.object({
  issue: z.string().min(1, 'Issue description is required'),
});

// Schema for set-profile
export const setProfileSchema = z.object({
  profile: z.enum(['thorough', 'balanced', 'fast']),
});

// No-param commands use empty schema
export const emptySchema = z.object({});

// Map command IDs to their schemas
export const commandSchemas: Record<string, z.ZodSchema> = {
  'plan-phase': planPhaseSchema,
  'execute-phase': executePhaseSchema,
  'discuss-phase': phaseParamSchema,
  'research-phase': researchPhaseSchema,
  'verify-phase': phaseParamSchema,
  'add-phase': addPhaseSchema,
  'insert-phase': insertPhaseSchema,
  'new-milestone': newMilestoneSchema,
  'quick-task': quickTaskSchema,
  'quick-fix': quickFixSchema,
  'set-profile': setProfileSchema,
  // All other commands use empty schema (no params)
};

/**
 * Get the Zod schema for a specific command
 * Returns emptySchema for commands without parameters
 */
export function getSchemaForCommand(commandId: string): z.ZodSchema {
  return commandSchemas[commandId] || emptySchema;
}

// Type exports for form data
export type PlanPhaseFormData = z.infer<typeof planPhaseSchema>;
export type ExecutePhaseFormData = z.infer<typeof executePhaseSchema>;
export type AddPhaseFormData = z.infer<typeof addPhaseSchema>;
export type InsertPhaseFormData = z.infer<typeof insertPhaseSchema>;
export type NewMilestoneFormData = z.infer<typeof newMilestoneSchema>;
export type ResearchPhaseFormData = z.infer<typeof researchPhaseSchema>;
export type QuickTaskFormData = z.infer<typeof quickTaskSchema>;
export type QuickFixFormData = z.infer<typeof quickFixSchema>;
export type SetProfileFormData = z.infer<typeof setProfileSchema>;
