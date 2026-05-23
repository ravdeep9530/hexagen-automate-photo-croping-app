import React from 'react';

export interface Preset {
  code: string;
  name: string;
}

interface PresetSelectorProps {
  presets: Preset[];
  selected: string | null;
  onSelect: (code: string) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ presets, selected, onSelect }) => {
  return (
    <div className="space-y-2">
      <label className="block font-medium">Select Country Preset</label>
      <select
        value={selected || ''}
        onChange={e => onSelect(e.target.value)}
        className="block border rounded px-2 py-1"
        data-testid="preset-select"
      >
        <option value="" disabled>Select a preset...</option>
        {presets.map(preset => (
          <option key={preset.code} value={preset.code}>{preset.name}</option>
        ))}
      </select>
    </div>
  );
};
