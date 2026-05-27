/**
 * Local File Guards Module
 * 
 * Security utilities to enforce client-only, local-file image processing.
 * Prevents processing of remote URLs, ensuring privacy-first operation.
 */

export interface SafeFileResult {
  type: 'safe';
  file: File;
}

export interface RejectedFileResult {
  type: 'error';
  reason: string;
}

export type FileOrRejected = SafeFileResult | RejectedFileResult;

/**
 * Validates that input is a true File object from a file picker.
 * Rejects strings (URLs), objects, or any non-File input.
 */
export function isLocalFile(input: unknown): input is File {
  if (typeof input !== 'object' || input === null) {
    return false;
  }
  
  // Check for File interface
  const candidate = input as File;
  return (
    candidate instanceof File ||
    (typeof candidate.name === 'string' &&
     typeof candidate.size === 'number' &&
     typeof candidate.type === 'string' &&
     typeof candidate.lastModified === 'number')
  );
}

/**
 * Determines if a string represents a remote URL.
 * Rejects http:, https:, ftp:, ftps: protocols.
 * Allows blob: and data: (they're local to the browser).
 * Rejects relative URLs as they're ambiguous.
 */
export function isRemoteUrl(input: unknown): input is string {
  if (typeof input !== 'string') {
    return false;
  }
  
  try {
    const trimmed = input.trim().toLowerCase();
    
    // Check for protocol-based determination
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return true;
    }
    
    if (trimmed.startsWith('ftp://') || trimmed.startsWith('ftps://')) {
      return true;
    }
    
    // blob: URLs are local object URLs - not "remote"
    if (trimmed.startsWith('blob:')) {
      return false;
    }
    
    // data: URIs are local - not "remote"
    if (trimmed.startsWith('data:')) {
      return false;
    }
    
    // Relative URLs without protocol are ambiguous - treat as safe but not remote
    // This is conservative - we don't block them but don't claim they're remote either
    return false;
  } catch {
    return false;
  }
}

/**
 * Checks if a string is a blob: URL (object URL).
 */
export function isObjectURL(input: unknown): input is string {
  if (typeof input !== 'string') {
    return false;
  }
  return input.trim().toLowerCase().startsWith('blob:');
}

/**
 * Checks if a string is a data: URI.
 */
export function isDataURI(input: unknown): input is string {
  if (typeof input !== 'string') {
    return false;
  }
  return input.trim().toLowerCase().startsWith('data:');
}

/**
 * Rejects remote URLs and only accepts local File objects.
 * Returns a result discriminated by `type` field.
 * 
 * @param input - The input to validate (should be a File from file picker)
 * @returns SafeFileResult if valid File, RejectedFileResult otherwise
 */
export function rejectRemoteUrl(input: unknown): FileOrRejected {
  // Null check
  if (input === null || input === undefined) {
    return {
      type: 'error',
      reason: 'No file provided. Please select a local file.',
    };
  }
  
  // String check - likely a URL
  if (typeof input === 'string') {
    if (isRemoteUrl(input)) {
      return {
        type: 'error',
        reason: 'Remote URLs are not supported for privacy. Please upload a local file.',
      };
    }
    
    // It's some other string - not a valid file input
    return {
      type: 'error',
      reason: 'Invalid file input. Please select a local file.',
    };
  }
  
  // File object check
  if (isLocalFile(input)) {
    return {
      type: 'safe',
      file: input,
    };
  }
  
  // Any other object type
  return {
    type: 'error',
    reason: 'Invalid file input. Please select a local file.',
  };
}

/**
 * Validates a batch of file inputs, separating valid Files from rejected inputs.
 * 
 * @param inputs - Array of potential file inputs
 * @returns Object containing arrays of valid results and rejected results
 */
export function validateLocalFileInput(
  inputs: unknown[]
): { valid: SafeFileResult[]; rejected: RejectedFileResult[] } {
  const valid: SafeFileResult[] = [];
  const rejected: RejectedFileResult[] = [];
  
  for (const input of inputs) {
    const result = rejectRemoteUrl(input);
    if (result.type === 'safe') {
      valid.push(result);
    } else {
      rejected.push(result);
    }
  }
  
  return { valid, rejected };
}

/**
 * Asserts that input is a local File or throws an error.
 * Use when you want immediate exception on invalid input.
 * 
 * @param input - The input to validate
 * @returns The File object if valid
 * @throws Error if input is not a valid local File
 */
export function assertLocalFileOrThrow(input: unknown): File {
  // Null/undefined check with specific message
  if (input === null || input === undefined) {
    throw new Error('No file provided. Please select a local file.');
  }
  
  // String check with specific message about remote URLs
  if (typeof input === 'string' && isRemoteUrl(input)) {
    throw new Error('Remote URLs are not supported for privacy. Please upload a local file.');
  }
  
  if (typeof input === 'string') {
    throw new Error('Invalid file input. Please select a local file.');
  }
  
  if (isLocalFile(input)) {
    return input;
  }
  
  throw new Error('Invalid file input. Please select a local file.');
}
