import { describe, it, expect } from 'vitest';
import type { ComplianceRule } from '@/domain/compliance';
import { validateCompliance, type ValidationEngineInput } from '../validation-engine';
import type { ValidationContext } from '../rule-evaluators';

function makeRule(overrides: Partial<ComplianceRule> & { type: ComplianceRule['type'] }): ComplianceRule {
  return {
    id: 'test-rule',
    type: overrides.type,
    name: 'Test Rule',
    description: 'Test description',
    severity: 'error',
    enforcement: 'automatic',
    isActive: true,
    parameters: overrides.parameters ?? {},
    errorMessage: 'Test error message',
    helpText: 'Test help text',
    referenceUrl: undefined,
    order: 1,
    ...overrides,
  };
}

function makeContext(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    asset: overrides.asset ?? {
      widthPx: 1200,
      heightPx: 800,
      fileSizeBytes: 1024 * 1024,
      mimeType: 'image/jpeg',
      filename: 'test.jpg',
    },
    crop: overrides.crop ?? { widthPx: 600, heightPx: 800, x: 0, y: 0, rotation: 0 },
    processing: overrides.processing ?? { backgroundColor: '#FFFFFF', targetDpi: 300 },
    exportSettings: overrides.exportSettings ?? {
      format: 'jpeg',
      quality: 0.95,
      targetWidthPx: 600,
      targetHeightPx: 800,
      targetDpi: 300,
    },
    faceDetection: overrides.faceDetection ?? null,
    ...overrides,
  };
}

function makeInput(overrides: Partial<ValidationEngineInput> = {}): ValidationEngineInput {
  return { presetId: 'test-preset', rules: overrides.rules ?? [], ...makeContext(overrides), ...overrides };
}

describe('validateCompliance', () => {
  it('returns a passing validation result for empty rules', () => {
    const result = validateCompliance(makeInput());
    expect(result.presetId).toBe('test-preset');
    expect(result.issues).toHaveLength(0);
    expect(result.isValid).toBe(true);
    expect(result.manualChecklist).toHaveLength(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('generates automated issues for file type, resolution, dimensions, and face position', () => {
    const rules: ComplianceRule[] = [
      makeRule({ id: 'format', type: 'format', parameters: { formats: ['image/png'] } }),
      makeRule({ id: 'resolution', type: 'resolution', parameters: { minDPI: 300 } }),
      makeRule({ id: 'dimension', type: 'dimension', parameters: { exactWidth: 600, exactHeight: 800 } }),
      makeRule({ id: 'face', type: 'face-position', parameters: { centerXMin: 0.45, centerXMax: 0.55 } }),
    ];

    const result = validateCompliance(makeInput({
      rules,
      asset: { widthPx: 300, heightPx: 300, fileSizeBytes: 1024, mimeType: 'image/webp' },
      crop: { widthPx: 500, heightPx: 800, x: 0, y: 0 },
      processing: {},
      exportSettings: { format: 'jpeg', targetDpi: 150, targetWidthPx: 500, targetHeightPx: 800 },
      faceDetection: { faceCount: 1, faces: [{ boundingBox: { x: 10, y: 200, width: 100, height: 300 } }] },
    }));

    expect(result.isValid).toBe(false);
    expect(result.issues.map((issue) => issue.type)).toEqual(
      expect.arrayContaining(['format', 'resolution', 'dimension', 'face-position'])
    );
  });

  it('skips inactive rules', () => {
    const rule = makeRule({ type: 'dimension', isActive: false, parameters: { exactWidth: 500 } });
    const result = validateCompliance(makeInput({ rules: [rule] }));
    expect(result.issues).toHaveLength(0);
  });

  it('creates advisory checklist items for manual and semi-automatic rules', () => {
    const rules: ComplianceRule[] = [
      makeRule({ id: 'expression', type: 'expression', enforcement: 'manual', description: 'Neutral expression' }),
      makeRule({ id: 'background', type: 'background', enforcement: 'semi-automatic', description: 'Plain white background' }),
      makeRule({ id: 'dimension', type: 'dimension', enforcement: 'automatic' }),
    ];
    const result = validateCompliance(makeInput({ rules }));
    expect(result.manualChecklist).toEqual([
      { ruleId: 'expression', description: 'Neutral expression', isChecked: false },
      { ruleId: 'background', description: 'Plain white background', isChecked: false },
    ]);
  });

  it('updates validation output when asset/crop/export/face inputs change', () => {
    const rule = makeRule({ type: 'dimension', parameters: { exactWidth: 600, exactHeight: 800 } });
    const failing = validateCompliance(makeInput({ rules: [rule], crop: { widthPx: 500, heightPx: 800, x: 0, y: 0 } }));
    const passing = validateCompliance(makeInput({ rules: [rule], crop: { widthPx: 600, heightPx: 800, x: 0, y: 0 } }));
    expect(failing.issues).toHaveLength(1);
    expect(passing.issues).toHaveLength(0);
  });

  it('preserves severity and blocks only error severity', () => {
    const warningOnly = validateCompliance(makeInput({ rules: [makeRule({ type: 'file-size', severity: 'warning', parameters: { maxBytes: 1 } })] }));
    const withError = validateCompliance(makeInput({ rules: [makeRule({ type: 'format', severity: 'error', parameters: { formats: ['image/png'] } })] }));
    expect(warningOnly.issues[0].severity).toBe('warning');
    expect(warningOnly.isValid).toBe(true);
    expect(withError.issues[0].severity).toBe('error');
    expect(withError.isValid).toBe(false);
  });

  it('passes a valid face position rule', () => {
    const rule = makeRule({ type: 'face-position', parameters: { centerXMin: 0.4, centerXMax: 0.6, centerYMin: 0.4, centerYMax: 0.6 } });
    const result = validateCompliance(makeInput({
      rules: [rule],
      crop: { widthPx: 600, heightPx: 800, x: 0, y: 0 },
      faceDetection: { faceCount: 1, faces: [{ boundingBox: { x: 150, y: 250, width: 300, height: 300 } }] },
    }));
    expect(result.issues).toHaveLength(0);
  });
});
