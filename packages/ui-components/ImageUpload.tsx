import React, { useRef, useState } from 'react';

interface ImageUploadProps {
  onUpload: (file: File) => Promise<void>;
  acceptedTypes?: string[];
  maxSizeMB?: number;
}

const DEFAULT_ACCEPTED = ['image/jpeg', 'image/png', 'image/gif'];
const DEFAULT_MAX_SIZE_MB = 5;

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  acceptedTypes = DEFAULT_ACCEPTED,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: ${acceptedTypes.join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File is too large. Max size is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setProgress(0);
    setFileName(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setUploading(true);
    setFileName(file.name);
    try {
      // Simulate upload progress
      for (let i = 1; i <= 10; i++) {
        await new Promise((res) => setTimeout(res, 50));
        setProgress(i * 10);
      }
      await onUpload(file);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block font-medium">Upload Image</label>
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleChange}
        disabled={uploading}
        className="block border rounded px-2 py-1"
        data-testid="image-input"
      />
      {fileName && <div className="text-sm">Selected: {fileName}</div>}
      {uploading && (
        <div className="w-full bg-gray-200 rounded h-2">
          <div
            className="bg-blue-500 h-2 rounded"
            style={{ width: `${progress}%` }}
            data-testid="progress-bar"
          />
        </div>
      )}
      {error && <div className="text-red-500 text-sm" data-testid="error-msg">{error}</div>}
    </div>
  );
};
