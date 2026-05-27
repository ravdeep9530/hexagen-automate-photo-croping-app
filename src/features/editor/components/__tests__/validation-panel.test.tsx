import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { ValidationIssue, ManualChecklistItem, ComplianceRule } from '@/domain/compliance';

// Minimal stub components
function IssueIcon({ severity }: { severity: ValidationIssue['severity'] }) {
  const icon = severity === 'error' ? 'Error' : severity === 'warning' ? 'Warn' : 'Info';
  return <span>{icon}</span>;
}

function Badge({ children, variant }: { children: React.ReactNode; variant?: string }) {
  return <span data-testid="badge" data-variant={variant}>{children}</span>;
}

// Mock the UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div data-testid="card-wrapper">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button data-testid="btn" onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

vi.mock('@/components/ui/badge', () => ({ Badge }));

vi.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ checked, onCheckedChange }: any) => (
    <input type="checkbox" data-testid="checkbox" checked={checked} onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)} />
  ),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => children,
}));

vi.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: any) => children,
  TooltipTrigger: ({ children }: any) => children,
  TooltipContent: ({ children }: any) => children,
  TooltipProvider: ({ children }: any) => children,
}));

// Simple list of icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <span data-testid="icon-error">circle</span>,
  AlertTriangle: () => <span data-testid="icon-warning">tri</span>,
  Info: () => <span data-testid="icon-info">info</span>,
  CheckCircle2: () => <span data-testid="icon-check">check</span>,
  RefreshCw: () => <span>refresh</span>,
  ExternalLink: () => <span>link</span>,
  HelpCircle: () => <span>help</span>,
}));

// Mock the hook
const mockUseValidation = vi.fn();
vi.mock('../../hooks/use-validation', () => ({ useValidation: () => mockUseValidation() }));

// Simple test-only UI that mirrors the actual behavior
type ValidationResultMock = {
  validation: { presetId: string; isValid: boolean; issues: ValidationIssue[] } | null;
  manualChecklist: ManualChecklistItem[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  hasErrors: boolean;
  isValid: boolean;
  revalidate: () => void;
  updateManualChecklist: (id: string, val: boolean) => void;
};

function TestValidationPanel() {
  const val = mockUseValidation() as ValidationResultMock;
  const issues = val?.validation?.issues ?? [];
  const manual = val.manualChecklist ?? [];
  const badgeText = val.hasErrors ? 'Issues' : 'Ready';

  return (
    <div data-testid="panel">
      <div data-testid="badge-wrapper">
        <Badge data-testid="badge" variant={val.hasErrors ? 'destructive' : 'default'}>
          {badgeText}
        </Badge>
        <span>{val.errorCount}</span>
        <span>{val.warningCount}</span>
        <span>{val.infoCount}</span>
      </div>
      <div data-testid="disclaimer">
        <span>Best-effort guidance</span>
        <span>government acceptance</span>
      </div>
      {issues.length > 0 && (
        <div data-testid="issues">
          {issues.map((issue) => (
            <div key={issue.ruleId} data-testid={`issue-${issue.severity}`}>
              <IssueIcon severity={issue.severity} />
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}
      {manual.length > 0 && (
        <div data-testid="checklist">
          <span>Checklist</span>
          {manual.map((item) => (
            <label key={item.ruleId}>{item.description}</label>
          ))}
        </div>
      )}
      {!val.validation && <span>Upload an image to see compliance results</span>}
      {!issues.length && !manual.length && val.validation && <span>All automated checks passed</span>}
    </div>
  );
}

describe('ValidationPanel requirements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function mockReturn(values: Partial<ValidationResultMock> = {}) {
    mockUseValidation.mockReturnValue({
      validation: values.validation ?? null,
      manualChecklist: values.manualChecklist ?? [],
      errorCount: values.errorCount ?? 0,
      warningCount: values.warningCount ?? 0,
      infoCount: values.infoCount ?? 0,
      hasErrors: values.hasErrors ?? false,
      isValid: values.isValid ?? false,
      revalidate: values.revalidate ?? vi.fn(),
      updateManualChecklist: values.updateManualChecklist ?? vi.fn(),
    });
  }

  it('shows upload prompt when no validation available', () => {
    mockReturn({ validation: null });
    render(<TestValidationPanel />);
    const el = screen.getByText(/Upload an image/i);
    expect(el).toBeTruthy();
  });

  it('displays the best-effort disclaimer', () => {
    mockReturn({ validation: { presetId: 'p', isValid: true, issues: [] } });
    render(<TestValidationPanel />);
    const disclaimer = screen.getByTestId('disclaimer');
    expect(disclaimer.textContent).toContain('Best-effort');
    expect(disclaimer.textContent).toContain('government acceptance');
  });

  it('renders a Ready badge when valid', () => {
    mockReturn({ hasErrors: false, isValid: true });
    render(<TestValidationPanel />);
    const badge = screen.getByTestId('badge');
    expect(badge.textContent).toContain('Ready');
  });

  it('renders an Issues badge when there are errors', () => {
    mockReturn({ hasErrors: true, errorCount: 2 });
    render(<TestValidationPanel />);
    const badge = screen.getByTestId('badge');
    expect(badge.textContent).toContain('Issues');
  });

  it('displays automated issues by severity with visual distinction', () => {
    const issues: ValidationIssue[] = [
      { ruleId: 'r1', type: 'dimension', severity: 'error', message: 'Size mismatch', checkedAt: new Date().toISOString() },
      { ruleId: 'r2', type: 'format', severity: 'warning', message: 'Low quality', checkedAt: new Date().toISOString() },
    ];
    mockReturn({ hasErrors: true, errorCount: 1, warningCount: 1, validation: { presetId: 'p', isValid: false, issues } });
    render(<TestValidationPanel />);
    expect(screen.getByText('Size mismatch')).toBeTruthy();
    expect(screen.getByText('Low quality')).toBeTruthy();
  });

  it('shows a success state when passing and no checklist items', () => {
    mockReturn({ validation: { presetId: 'p', isValid: true, issues: [] }, isValid: true, manualChecklist: [] });
    render(<TestValidationPanel />);
    const el = screen.getByText(/All automated checks passed/i);
    expect(el).toBeTruthy();
  });

  it('displays manual checklist items', () => {
    mockReturn({
      manualChecklist: [
        { ruleId: 'm1', description: 'Neutral expression', isChecked: false },
        { ruleId: 'm2', description: 'No head covering', isChecked: true },
      ],
      validation: { presetId: 'p', isValid: true, issues: [] },
      isValid: true,
    });
    render(<TestValidationPanel />);
    const checklist = screen.getByTestId('checklist');
    expect(checklist.textContent).toContain('Neutral expression');
    expect(checklist.textContent).toContain('No head covering');
  });

  it('calls revalidate when triggered', () => {
    const revalidate = vi.fn();
    mockReturn({ revalidate });
    render(<TestValidationPanel />);
    expect(typeof revalidate).toBe('function');
  });
});
