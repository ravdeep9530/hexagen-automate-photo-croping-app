import { z } from 'zod';

/**
 * Severity levels for validation issues
 */
export const ValidationSeveritySchema = z.enum(['error', 'warning', 'info']);
export type ValidationSeverity = z.infer<typeof ValidationSeveritySchema>;

/**
 * Compliance rule type
 */
export const ComplianceRuleTypeSchema = z.enum([
  'dimension',
  'aspect-ratio',
  'file-size',
  'format',
  'resolution',
  'face-position',
  'face-count',
  'background',
  'expression',
  'glasses',
  'head-covering',
  'lighting',
  'color-profile',
  'custom',
]);
export type ComplianceRuleType = z.infer<typeof ComplianceRuleTypeSchema>;

/**
 * Compliance rule enforcement mode
 */
export const EnforcementModeSchema = z.enum([
  'automatic',     // Fully validated by code
  'semi-automatic', // Partial validation with manual check
  'manual',         // Display as checklist item only
]);
export type EnforcementMode = z.infer<typeof EnforcementModeSchema>;

/**
 * Single compliance rule
 */
export const ComplianceRuleSchema = z.object({
  id: z.string(),
  type: ComplianceRuleTypeSchema,
  name: z.string(),
  description: z.string(),
  severity: ValidationSeveritySchema.default('error'),
  enforcement: EnforcementModeSchema.default('automatic'),
  isActive: z.boolean().default(true),
  parameters: z.record(z.unknown()).default({}),
  errorMessage: z.string(),
  helpText: z.string().optional(),
  referenceUrl: z.string().url().optional(),
  order: z.number().int().default(0),
});

export type ComplianceRule = z.infer<typeof ComplianceRuleSchema>;

/**
 * Validation issue - result of checking a rule
 */
export const ValidationIssueSchema = z.object({
  ruleId: z.string(),
  type: ComplianceRuleTypeSchema,
  severity: ValidationSeveritySchema,
  message: z.string(),
  details: z.record(z.unknown()).optional(),
  suggestion: z.string().optional(),
  checkedAt: z.string().datetime(),
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;

/**
 * Complete validation result for an image
 */
export const ValidationResultSchema = z.object({
  presetId: z.string(),
  isValid: z.boolean(),
  issues: z.array(ValidationIssueSchema),
  checkedAt: z.string().datetime(),
  durationMs: z.number().nonnegative(),
});

export type ValidationResult = z.infer<typeof ValidationResultSchema>;

/**
 * Compliance ruleset for a preset
 */
export const ComplianceRulesetSchema = z.object({
  presetId: z.string(),
  rules: z.array(ComplianceRuleSchema),
  version: z.string(),
  lastUpdated: z.string().datetime(),
});

export type ComplianceRuleset = z.infer<typeof ComplianceRulesetSchema>;

/**
 * Manual checklist item for semi-automatic or manual rules
 */
export const ManualChecklistItemSchema = z.object({
  ruleId: z.string(),
  description: z.string(),
  isChecked: z.boolean().default(false),
  checkedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type ManualChecklistItem = z.infer<typeof ManualChecklistItemSchema>;

/**
 * Create a validation issue
 */
export function createValidationIssue(
  rule: ComplianceRule,
  message?: string,
  details?: Record<string, unknown>
): ValidationIssue {
  return {
    ruleId: rule.id,
    type: rule.type,
    severity: rule.severity,
    message: message || rule.errorMessage,
    details,
    suggestion: rule.helpText,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Filter issues by severity
 */
export function filterIssuesBySeverity(
  issues: ValidationIssue[],
  severity: ValidationSeverity
): ValidationIssue[] {
  return issues.filter(i => i.severity === severity);
}

/**
 * Check if validation result has blocking errors
 */
export function hasBlockingErrors(result: ValidationResult): boolean {
  return result.issues.some(i => i.severity === 'error');
}

/**
 * Get manual checklist items from rules
 */
export function getManualChecklistItems(rules: ComplianceRule[]): ManualChecklistItem[] {
  return rules
    .filter(r => r.enforcement !== 'automatic' && r.isActive)
    .map(r => ({
      ruleId: r.id,
      description: r.description,
      isChecked: false,
    }));
}

/**
 * Validate compliance ruleset
 */
export function validateComplianceRuleset(data: unknown): { success: true; data: ComplianceRuleset } | { success: false; error: z.ZodError } {
  const result = ComplianceRulesetSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
