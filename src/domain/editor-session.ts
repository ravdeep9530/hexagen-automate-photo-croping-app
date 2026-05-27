import { z } from 'zod';
import { ImageAssetSchema, CropStateSchema, ProcessingSettingsSchema, FaceAnalysisSchema } from './assets';
import { ValidationResultSchema } from './compliance';
import { PhotoPresetSchema } from './presets';

/**
 * Editor panel visibility state
 */
export const EditorPanelsSchema = z.object({
  showCropPanel: z.boolean().default(true),
  showProcessingPanel: z.boolean().default(true),
  showValidationPanel: z.boolean().default(true),
  showExportPanel: z.boolean().default(false),
  showHelpPanel: z.boolean().default(false),
});

export type EditorPanels = z.infer<typeof EditorPanelsSchema>;

/**
 * Editor view mode
 */
export const EditorViewModeSchema = z.enum([
  'single',
  'split',
  'grid',
  'preview',
]);
export type EditorViewMode = z.infer<typeof EditorViewModeSchema>;

/**
 * Editor tool selection
 */
export const EditorToolSchema = z.enum([
  'select',
  'crop',
  'pan',
  'zoom',
  'rotate',
  'face-detect',
]);
export type EditorTool = z.infer<typeof EditorToolSchema>;

/**
 * Editor UI state
 */
export const EditorUIStateSchema = z.object({
  activeTool: EditorToolSchema.default('select'),
  viewMode: EditorViewModeSchema.default('single'),
  zoomLevel: z.number().positive().default(1),
  panX: z.number().default(0),
  panY: z.number().default(0),
  showGrid: z.boolean().default(false),
  showGuides: z.boolean().default(true),
  showFaceOverlay: z.boolean().default(true),
  darkMode: z.boolean().default(false),
  panels: EditorPanelsSchema.default({}),
  canvasSize: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }).optional(),
});

export type EditorUIState = z.infer<typeof EditorUIStateSchema>;

/**
 * Editor history entry for undo/redo
 */
export const EditorHistoryEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  type: z.enum(['crop', 'processing', 'preset', 'reset']),
  description: z.string(),
  cropState: CropStateSchema.optional(),
  processingSettings: ProcessingSettingsSchema.optional(),
});

export type EditorHistoryEntry = z.infer<typeof EditorHistoryEntrySchema>;

/**
 * Editor history state
 */
export const EditorHistorySchema = z.object({
  entries: z.array(EditorHistoryEntrySchema),
  currentIndex: z.number().int().min(-1).default(-1),
  maxSize: z.number().int().positive().default(50),
});

export type EditorHistory = z.infer<typeof EditorHistorySchema>;

/**
 * Complete editor session state
 */
export const EditorSessionSchema = z.object({
  // Session identification
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  
  // Core data
  asset: ImageAssetSchema.optional(),
  preset: PhotoPresetSchema.optional(),
  
  // Editor state
  cropState: CropStateSchema.optional(),
  processingSettings: ProcessingSettingsSchema.default({}),
  
  // Analysis results
  faceAnalysis: FaceAnalysisSchema.optional(),
  validationResult: ValidationResultSchema.optional(),
  
  // UI state
  uiState: EditorUIStateSchema.default({}),
  history: EditorHistorySchema.default({ entries: [], currentIndex: -1 }),
  
  // Session metadata
  isDirty: z.boolean().default(false),
  isProcessing: z.boolean().default(false),
  processingProgress: z.number().min(0).max(1).default(0),
  errorMessage: z.string().optional(),
  // AbortController for cancellation (non-serializable)
  abortController: z.instanceof(AbortController).optional(),
});

export type EditorSession = z.infer<typeof EditorSessionSchema>;

/**
 * Persistable portion of editor session (excluding non-serializable data)
 */
export const PersistableEditorSessionSchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  presetId: z.string().optional(),
  cropState: CropStateSchema.optional(),
  processingSettings: ProcessingSettingsSchema.optional(),
  uiState: EditorUIStateSchema.optional(),
  isDirty: z.boolean().optional(),
});

export type PersistableEditorSession = z.infer<typeof PersistableEditorSessionSchema>;

/**
 * Export serializable session data
 */
export function exportPersistableSession(session: EditorSession): PersistableEditorSession {
  return {
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    presetId: session.preset?.id,
    cropState: session.cropState,
    processingSettings: session.processingSettings,
    uiState: session.uiState,
    isDirty: session.isDirty,
  };
}

/**
 * Can undo check
 */
export function canUndo(history: EditorHistory): boolean {
  return history.currentIndex > 0;
}

/**
 * Can redo check
 */
export function canRedo(history: EditorHistory): boolean {
  return history.currentIndex < history.entries.length - 1;
}

/**
 * Get current history entry
 */
export function getCurrentHistoryEntry(history: EditorHistory): EditorHistoryEntry | undefined {
  if (history.currentIndex < 0 || history.currentIndex >= history.entries.length) {
    return undefined;
  }
  return history.entries[history.currentIndex];
}

/**
 * Add history entry
 */
export function addHistoryEntry(
  history: EditorHistory,
  entry: Omit<EditorHistoryEntry, 'id' | 'timestamp'>
): EditorHistory {
  // Truncate any redo entries
  const entries = history.entries.slice(0, history.currentIndex + 1);
  
  const newEntry: EditorHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  
  entries.push(newEntry);
  
  // Trim to max size
  if (entries.length > history.maxSize) {
    entries.shift();
  }
  
  return {
    ...history,
    entries,
    currentIndex: entries.length - 1,
  };
}

/**
 * Undo to previous state
 */
export function undo(history: EditorHistory): { history: EditorHistory; entry?: EditorHistoryEntry } {
  if (!canUndo(history)) {
    return { history };
  }
  const newIndex = history.currentIndex - 1;
  return {
    history: { ...history, currentIndex: newIndex },
    entry: history.entries[newIndex],
  };
}

/**
 * Redo to next state
 */
export function redo(history: EditorHistory): { history: EditorHistory; entry?: EditorHistoryEntry } {
  if (!canRedo(history)) {
    return { history };
  }
  const newIndex = history.currentIndex + 1;
  return {
    history: { ...history, currentIndex: newIndex },
    entry: history.entries[newIndex],
  };
}

/**
 * Validate persistable session
 */
export function validatePersistableSession(data: unknown): { success: true; data: PersistableEditorSession } | { success: false; error: z.ZodError } {
  const result = PersistableEditorSessionSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Create new session ID
 */
export function createSessionId(): string {
  return crypto.randomUUID();
}
