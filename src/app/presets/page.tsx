import React from 'react';
import type { Metadata } from 'next';
import { PresetCardGrid } from '@/components/marketing/preset-card-grid';
import { getAllPresets, getSupportedCountries, getSupportedDocumentTypes } from '@/data/catalog';
import { FileText, Globe, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Browse Photo Presets | Hexagen Photo',
  description:
    'Browse official passport, visa, and ID photo presets for Canada, USA, India, and more. Specifications validated against government requirements.',
  keywords: ['photo presets', 'passport presets', 'visa photos', 'document templates', 'official specifications'],
};

/**
 * Presets browse page - Renders static preset cards from the catalog.
 *
 * Features:
 * - Displays all active photo presets
 * - Shows country and document type filters (visual only for static render)
 * - Links into the editor with preset selection
 * - Provides metadata about available presets
 */
export default function PresetsPage(): React.JSX.Element {
  const presets = getAllPresets();
  const activePresets = presets.filter((p) => p.isActive);
  const countries = getSupportedCountries();
  const documentTypes = getSupportedDocumentTypes();

  // Total counts by type
  const passportCount = activePresets.filter((p) => p.documentType === 'passport').length;
  const visaCount = activePresets.filter((p) => p.documentType === 'visa').length;
  const otherCount = activePresets.filter(
    (p) => !['passport', 'visa'].includes(p.documentType)
  ).length;

  const handleSelectPreset = (presetId: string) => {
    // Navigate to editor with selected preset
    // In a real implementation, use router.push(`/editor?preset=${presetId}`)
    if (typeof window !== 'undefined') {
      // For now, alert the user since the editor route may not exist yet
      alert(`Selected preset: ${presetId}\nIn the full implementation, this would navigate to the editor.`);
    }
  };

  return (
    <main className="min-h-screen">
      {/* Page Header */}
      <div className="w-full py-12 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium bg-primary/5 text-primary mb-4">
              <Sparkles className="mr-2 h-4 w-4" />
              <span>Official Specifications</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Browse Photo Presets
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Choose from {activePresets.length}+ official photo presets for passports, visas,
              and ID documents. All specifications are validated against government sources
              and include direct links to official requirements.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="w-full border-b bg-card">
        <div className="container px-4 md:px-6 mx-auto py-4">
          <div className="flex flex-wrap justify-center gap-8">
            <StatItem icon={<Globe />} value={countries.length} label="Countries" />
            <StatItem icon={<FileText />} value={activePresets.length} label="Presets" />
            <StatItem icon={<Sparkles />} value={documentTypes.length} label="Document Types" />
          </div>
        </div>
      </div>

      {/* Filters (Visual) */}
      <div className="container px-4 md:px-6 mx-auto py-8">
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <FilterBadge label="All" active />
          <FilterBadge label={`Passports (${passportCount})`} />
          <FilterBadge label={`Visas (${visaCount})`} />
          <FilterBadge label={`Other (${otherCount})`} />
        </div>

        {/* Country Filter Chips */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {countries.map((country) => {
            const count = activePresets.filter((p) => p.country === country).length;
            return (
              <button
                key={country}
                className="inline-flex items-center rounded-full border bg-background px-3 py-1 text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                {formatCountryCode(country)}
                <span className="ml-1.5 text-xs text-muted-foreground">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="container px-4 md:px-6 mx-auto pb-16">
        <PresetCardGrid presets={activePresets} onSelectPreset={handleSelectPreset} />
      </div>

      {/* Information Section */}
      <section className="w-full py-12 bg-muted/30 border-t">
        <div className="container px-4 md:px-6 mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-8">Understanding Presets</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoCard
              title="Official Sources"
              description="Each preset is based on requirements from official government authorities. Click the external link icon to view the source documentation."
            />
            <InfoCard
              title="Dimensions Included"
              description="Presets include exact millimeter dimensions, pixel requirements at minimum DPI, and file format specifications."
            />
            <InfoCard
              title="Last Reviewed Dates"
              description="We track when each specification was last reviewed against official sources. Always verify current requirements before submitting photos."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function StatItem({ icon, value, label }: StatItemProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {React.cloneElement(icon as React.ReactElement, {
        className: 'h-5 w-5 text-muted-foreground',
      })}
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

interface FilterBadgeProps {
  label: string;
  active?: boolean;
}

function FilterBadge({ label, active = false }: FilterBadgeProps): React.JSX.Element {
  return (
    <button
      className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );
}

interface InfoCardProps {
  title: string;
  description: string;
}

function InfoCard({ title, description }: InfoCardProps): React.JSX.Element {
  return (
    <div className="text-center">
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function formatCountryCode(code: string): string {
  const countryNames: Record<string, string> = {
    CA: 'Canada',
    US: 'United States',
    IN: 'India',
    AU: 'Australia',
    UK: 'United Kingdom',
    CUSTOM: 'Custom',
  };
  return countryNames[code] || code;
}
