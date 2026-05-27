import type { ComplianceRule, ManualChecklistItem, ValidationIssue, ValidationResult } from '@/domain/compliance';
import { evaluateFacePositionRule } from './face-position-evaluator';
import { evaluateAutomaticRule, type ValidationContext } from './rule-evaluators';

export type { ValidationContext } from './rule-evaluators';

export interface ComplianceValidationResult extends ValidationResult {
  manualChecklist: ManualChecklistItem[];
}

export interface ValidationEngineInput extends ValidationContext {
  presetId: string;
  rules: ComplianceRule[];
  now?: Date;
}

export function validateCompliance(input: ValidationEngineInput): ComplianceValidationResult {
  const startedAt = performanceNow();
  const checkedAt = (input.now ?? new Date()).toISOString();
  const activeRules = input.rules.filter((rule) => rule.isActive !== false);
  const issues: ValidationIssue[] = [];

  for (const rule of activeRules) {
    if (rule.enforcement === 'manual') {
      continue;
    }

    const issue = rule.type === 'face-position'
      ? evaluateFacePositionRule(rule, input, checkedAt)
      : evaluateAutomaticRule(rule, input, checkedAt);

    if (issue) {
      issues.push(issue);
    }
  }

  return {
    presetId: input.presetId,
    isValid: !issues.some((issue) => issue.severity === 'error'),
    issues,
    manualChecklist: getManualChecklistItems(activeRules),
    checkedAt,
    durationMs: Math.max(0, performanceNow() - startedAt),
  };
}

function getManualChecklistItems(rules: ComplianceRule[]): ManualChecklistItem[] {
  return rules
    .filter((rule) => rule.enforcement !== 'automatic' && rule.isActive !== false)
    .sort((a, b) => a.order - b.order)
    .map((rule) => ({
      ruleId: rule.id,
      description: rule.description,
      isChecked: false,
    }));
}

function performanceNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}
