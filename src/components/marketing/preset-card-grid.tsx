import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PhotoPreset } from '@/domain/presets';
import {
  MapPin,
  FileText,
  Ruler,
  ExternalLink,
  Image,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export interface PresetCardGridProps {
  /** Array of photo presets to display */
  presets: readonly PhotoPreset[];
  /** Callback when user selects a preset to edit */
  onSelectPreset?: (presetId: string) => void;
  /** Optional filter to show only active presets */
  showInactive?: boolean;
  /** Maximum number of presets to display (0 = all) */
  limit?: number;
}

/**
 * PresetCardGrid - Displays a grid of photo preset cards.
 *
 * Renders static preset catalog data as browsable cards, allowing users to
 * view document specifications and navigate to the editor with a preset selected.
 */
export function PresetCardGrid({
  presets,
  onSelectPreset,
  showInactive = false,
  limit = 0,
}: PresetCardGridProps): React.JSX.Element {
  const displayPresets = React.useMemo(() => {
    let filtered = showInactive ? [...presets] : presets.filter((p) => p.isActive);
    if (limit > 0 && filtered.length > limit) {
      filtered = filtered.slice(0, limit);
    }
    return filtered;
  }, [presets, showInactive, limit]);

  if (displayPresets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No presets available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayPresets.map((preset) => (
        <PresetCard key={preset.id} preset={preset} onSelect={onSelectPreset} />
      ))}
    </div>
  );
}

interface PresetCardProps {
  preset: PhotoPreset;
  onSelect?: (presetId: string) => void;
}

function PresetCard({ preset, onSelect }: PresetCardProps): React.JSX.Element {
  const handleSelect = React.useCallback(() => {
    onSelect?.(preset.id);
  }, [onSelect, preset.id]);

  return (
    <Card className="flex flex-col h-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{preset.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {preset.description}
            </CardDescription>
          </div>
          <CountryFlag country={preset.country} />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 pt-0">
        {/* Specifications */}
        <div className="space-y-2">
          <SpecRow
            icon={<Ruler className="h-4 w-4" />}
            label="Dimensions"
            value={formatDimensions(preset.dimensions)}
          />
          <SpecRow
            icon={<Image className="h-4 w-4" />}
            label="Format"
            value={preset.fileConstraints.acceptedFormats
              .map((f) => f.replace('image/', '').toUpperCase())
              .join(', ')}
          />
          <SpecRow
            icon={<MapPin className="h-4 w-4" />}
            label="Authority"
            value={preset.source.authority}
          />
          <SpecRow
            icon={<Calendar className="h-4 w-4" />}
            label="Last Reviewed"
            value={formatDate(preset.source.lastReviewed)}
          />
        </div>

        {/* Tags */}
        {preset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {preset.tags
              .filter((tag) => !tag.startsWith('Best-effort'))
              .slice(0, 4)
              .map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
          </div>
        )}

        {/* Background Requirement */}
        {preset.background && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="w-3 h-3 rounded-full border"
              style={{
                backgroundColor: preset.background.hexCode || '#e5e5e5',
                borderColor: 'rgba(0,0,0,0.1)',
              }}
            />
            <span>{formatBackgroundColor(preset.background.color)} background</span>
            {preset.background.shadowAllowed ? null : (
              <>
                <span>•</span>
                <span>No shadows</span>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-2">
          <Button onClick={handleSelect} className="flex-1" size="sm">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Use This Preset
          </Button>
          <a
            href={preset.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only">View official requirements</span>
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

interface SpecRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function SpecRow({ icon, label, value }: SpecRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground min-w-[80px]">{label}:</span>
      <span className="font-medium truncate" title={value}>
        {value}
      </span>
    </div>
  );
}

function CountryFlag({ country }: { country: string }): React.JSX.Element {
  const countryNames: Record<string, string> = {
    CA: 'Canada',
    US: 'United States',
    IN: 'India',
    AU: 'Australia',
    UK: 'United Kingdom',
    CUSTOM: 'Custom',
  };

  return (
    <Badge variant="outline" className="shrink-0 font-semibold" title={countryNames[country] || country}>
      {country === 'CUSTOM' ? 'Custom' : country.toUpperCase()}
    </Badge>
  );
}

function formatDimensions(dimensions: PhotoPreset['dimensions']): string {
  const { widthMm, heightMm, widthPx, heightPx } = dimensions;
  let result = `${widthMm}×${heightMm}mm`;
  if (widthPx && heightPx) {
    result += ` (${widthPx}×${heightPx}px)`;
  }
  return result;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
    });
  } catch {
    return dateString;
  }
}

function formatBackgroundColor(color: string): string {
  const colorMap: Record<string, string> = {
    white: 'White',
    'light-gray': 'Light gray',
    'off-white': 'Off-white',
    blue: 'Blue',
    any: 'Any',
  };
  return colorMap[color] || color;
}
