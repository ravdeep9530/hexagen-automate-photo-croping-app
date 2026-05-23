import React, { useState } from 'react';
import { ImageUpload } from '../../../packages/ui-components/ImageUpload';
import { PresetSelector, Preset } from '../../../packages/ui-components/PresetSelector';

const COUNTRY_PRESETS: Preset[] = [
  { code: 'us', name: 'United States' },
  { code: 'ca', name: 'Canada' },
  { code: 'jp', name: 'Japan' },
  { code: 'fr', name: 'France' },
];

export default function HomePage() {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    // Simulate upload logic; in real app, send to API
    setUploadedImage(file);
    setUploadError(null);
    // Could throw to simulate error
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6">
      <PresetSelector
        presets={COUNTRY_PRESETS}
        selected={selectedPreset}
        onSelect={setSelectedPreset}
      />
      <ImageUpload
        onUpload={handleUpload}
      />
      {uploadedImage && (
        <div className="mt-4">
          <div className="font-medium">Preview:</div>
          <img
            src={URL.createObjectURL(uploadedImage)}
            alt="Uploaded"
            className="mt-2 max-w-full h-auto border rounded"
            data-testid="image-preview"
          />
        </div>
      )}
    </div>
  );
}
