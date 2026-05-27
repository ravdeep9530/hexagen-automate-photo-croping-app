'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllPresets } from '@/data/catalog';
import type { PhotoPreset } from '@/domain';
import { useEditorStore } from '@/features/editor/store/editor-store';

const DOCUMENT_LABELS: Record<PhotoPreset['documentType'], string> = {
  passport: 'Passport',
  visa: 'Visa',
  'id-card': 'ID card',
  'driving-license': 'Driving license',
  other: 'Other',
};

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export interface PresetSelectorProps {
  presets?: PhotoPreset[];
}

export function PresetSelector({ presets = getAllPresets() }: PresetSelectorProps): React.JSX.Element {
  const selectedPreset = useEditorStore((state) => state.selectedPreset);
  const exportSettings = useEditorStore((state) => state.exportSettings);
  const selectPreset = useEditorStore((state) => state.selectPreset);

  const activePresets = React.useMemo(() => presets.filter((preset) => preset.isActive), [presets]);
  const [documentType, setDocumentType] = React.useState<string>(selectedPreset?.documentType ?? 'all');
  const [country, setCountry] = React.useState<string>(selectedPreset?.country ?? 'all');

  const documentTypes = React.useMemo(
    () => uniqueSorted(activePresets.map((preset) => preset.documentType)),
    [activePresets]
  );
  const countryOptions = React.useMemo(
    () => uniqueSorted(activePresets
      .filter((preset) => documentType === 'all' || preset.documentType === documentType)
      .map((preset) => preset.country)),
    [activePresets, documentType]
  );
  const filteredPresets = React.useMemo(
    () => activePresets.filter((preset) =>
      (documentType === 'all' || preset.documentType === documentType) &&
      (country === 'all' || preset.country === country)
    ),
    [activePresets, country, documentType]
  );

  React.useEffect(() => {
    if (country !== 'all' && !countryOptions.includes(country)) setCountry('all');
  }, [country, countryOptions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preset selector</CardTitle>
        <CardDescription>Choose a category, country, and official-size preset.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="space-y-1 text-sm font-medium">
            <span>Category</span>
            <select
              aria-label="Preset category"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={documentType}
              onChange={(event) => { setDocumentType(event.target.value); }}
            >
              <option value="all">All categories</option>
              {documentTypes.map((type) => (
                <option key={type} value={type}>{DOCUMENT_LABELS[type as PhotoPreset['documentType']]}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium">
            <span>Country</span>
            <select
              aria-label="Preset country"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={country}
              onChange={(event) => { setCountry(event.target.value); }}
            >
              <option value="all">All countries</option>
              {countryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label className="space-y-1 text-sm font-medium">
            <span>Preset</span>
            <select
              aria-label="Photo preset"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedPreset?.id ?? ''}
              onChange={(event) => {
                const preset = activePresets.find((candidate) => candidate.id === event.target.value) ?? null;
                selectPreset(preset);
                if (preset) {
                  setDocumentType(preset.documentType);
                  setCountry(preset.country);
                }
              }}
            >
              <option value="">Select a preset</option>
              {filteredPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
            </select>
          </label>
        </div>

        {selectedPreset ? (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{selectedPreset.name}</strong>
              <Badge variant="secondary">{selectedPreset.country}</Badge>
              <Badge variant="outline">{DOCUMENT_LABELS[selectedPreset.documentType]}</Badge>
            </div>
            <p className="mt-2 text-muted-foreground">
              Export defaults: {exportSettings?.widthPx ?? selectedPreset.dimensions.widthPx ?? 'auto'} × {exportSettings?.heightPx ?? selectedPreset.dimensions.heightPx ?? 'auto'} px at {exportSettings?.dpi ?? selectedPreset.dimensions.minDpi} DPI.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Select a preset to update crop ratio and export defaults.</p>
        )}
      </CardContent>
    </Card>
  );
}
