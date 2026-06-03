import { useCallback, useState, type DragEvent, type KeyboardEvent } from "react";

export interface UseFileDropOptions {
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

export interface UseFileDropResult {
  isDragging: boolean;
  dropZoneProps: {
    role: "button";
    tabIndex: number;
    onDragEnter: (event: DragEvent<HTMLElement>) => void;
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDragLeave: (event: DragEvent<HTMLElement>) => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  };
}

const hasFiles = (event: DragEvent<HTMLElement>): boolean =>
  Array.from(event.dataTransfer.types).includes("Files");

export const useFileDrop = ({ disabled = false, onFiles }: UseFileDropOptions): UseFileDropResult => {
  const [dragDepth, setDragDepth] = useState(0);

  const resetDrag = useCallback(() => {
    setDragDepth(0);
  }, []);

  const onDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled || !hasFiles(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setDragDepth((depth) => depth + 1);
    },
    [disabled],
  );

  const onDragOver = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled || !hasFiles(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
    },
    [disabled],
  );

  const onDragLeave = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled || !hasFiles(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setDragDepth((depth) => Math.max(depth - 1, 0));
    },
    [disabled],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (disabled) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      resetDrag();

      const files = Array.from(event.dataTransfer.files ?? []);

      if (files.length > 0) {
        onFiles(files);
      }
    },
    [disabled, onFiles, resetDrag],
  );

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }, []);

  return {
    isDragging: dragDepth > 0,
    dropZoneProps: {
      role: "button",
      tabIndex: disabled ? -1 : 0,
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
      onKeyDown,
    },
  };
};
