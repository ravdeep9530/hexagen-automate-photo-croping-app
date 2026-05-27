'use client';

import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, RefreshCw, ExternalLink, HelpCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useValidation } from '../hooks/use-validation';
import type { ValidationIssue } from '@/domain/compliance';

function IssueIcon({ severity }: { severity: ValidationIssue['severity'] }) {
  switch (severity) {
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'info':
    default:
      return <Info className="h-4 w-4 text-blue-500" />;
  }
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
  return (
    <div
      className="flex items-start gap-2 py-2 px-3 rounded-md border-l-2 bg-muted/40"
      data-testid={`issue-${issue.severity}`}
      style={{
        borderLeftColor:
          issue.severity === 'error' ? 'rgb(239 68 68)' : issue.severity === 'warning' ? 'rgb(245 158 11)' : 'rgb(59 130 246)',
      }}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        <IssueIcon severity={issue.severity} />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium leading-none">
          {issue.message}
        </p>
        {issue.suggestion && (
          <p className="mt-1 text-xs text-muted-foreground">{issue.suggestion}</p>
        )}
      </div>
    </div>
  );
}

export function ValidationPanel(): JSX.Element {
  const {
    validation,
    manualChecklist,
    errorCount,
    warningCount,
    infoCount,
    hasErrors,
    isValid,
    revalidate,
    updateManualChecklist,
  } = useValidation();

  const sortedIssues = React.useMemo(() => {
    if (!validation?.issues) return [];
    const severityOrder: Record<typeof validation.issues[number]['severity'], number> = {
      error: 0,
      warning: 1,
      info: 2,
    };
    return [...validation.issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [validation?.issues]);

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Compliance</h3>
          <Badge
            variant={hasErrors ? 'destructive' : isValid ? 'default' : 'secondary'}
            data-testid="validation-badge"
          >
            {hasErrors ? 'Issues' : 'Ready'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {errorCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {errorCount}
            </Badge>
          )}
          {warningCount > 0 && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-200 bg-amber-50">
              {warningCount}
            </Badge>
          )}
          {infoCount > 0 && (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200 bg-blue-50">
              {infoCount}
            </Badge>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3">
        {/* Disclaimer */}
        <div className="rounded-md border-l-2 border-amber-400 bg-amber-50/50 p-2 text-xs text-amber-800 mb-3">
          <p className="font-medium flex items-center gap-1">
            <HelpCircle className="h-3 w-3" />
            Best-effort guidance only
          </p>
          <p className="mt-0.5">
            Automated checks help position your photo but cannot guarantee government acceptance. Always review official requirements before submitting.
          </p>
        </div>

        {/* Issues Section */}
        {sortedIssues.length > 0 && (
          <div className="space-y-2" data-testid="issues-list">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Issues</h4>
            {sortedIssues.map((issue) => (
              <IssueRow key={issue.ruleId} issue={issue} />
            ))}
          </div>
        )}

        {/* Manual Checklist Section */}
        {manualChecklist.length > 0 && (
          <div className="mt-4 space-y-2" data-testid="manual-checklist">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Checklist</h4>
            <p className="text-xs text-muted-foreground">
              Please verify these requirements manually:
            </p>
            {manualChecklist.map((item) => (
              <label
                key={item.ruleId}
                className="flex items-start gap-2 py-1.5 cursor-pointer hover:bg-muted/50 rounded-md px-1.5"
              >
                <Checkbox
                  checked={item.isChecked}
                  onCheckedChange={(checked) => updateManualChecklist(item.ruleId, checked === true)}
                  aria-describedby={`desc-${item.ruleId}`}
                />
                <span
                  id={`desc-${item.ruleId}`}
                  className={`text-sm leading-tight ${item.isChecked ? 'text-muted-foreground line-through' : ''}`}
                >
                  {item.description}
                </span>
              </label>
            ))}
          </div>
        )}

        {sortedIssues.length === 0 && manualChecklist.length === 0 && validation && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm font-medium">All automated checks passed</p>
            <p className="text-xs text-muted-foreground mt-1">
              Remember: this does not guarantee acceptance.
            </p>
          </div>
        )}

        {!validation && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Info className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Upload an image to see compliance results</p>
          </div>
        )}
      </ScrollArea>

      {/* Footer Actions */}
      <div className="p-3 border-t bg-muted/30">
        <div className="flex items-center justify-between gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={revalidate}
                  data-testid="revalidate-btn"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Recheck
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Re-run compliance checks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  asChild
                >
                  <a
                    href="https://www.canada.ca/en/immigration-refugees-citizenship/services/canadian-passports/photos.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Guidelines
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View official photo guidelines</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {validation?.presetId && (
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            Validating against: {validation.presetId}
          </p>
        )}
      </div>
    </Card>
  );
}
