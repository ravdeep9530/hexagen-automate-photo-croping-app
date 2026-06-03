import * as React from "react";

export interface UseFileDropOptions {
  disabled?: boolean;
  onFilesDropped: (files: File[]) => void;
}

export interface FileDropBindings {
  isDragging: boolean;
  onDragEnter: React.DragEventHandler<HTMLElement>;
  onDragLeave: React.DragEventHandler<HTMLElement>;
  onDragOver: React.DragEventHandler<HTMLElement>;
  onDrop: React.DragEventHandler<HTMLElement>;
}

export function useFileDrop({
  disabled = false,
  onFilesDropped,
}: UseFileDropOptions): FileDropBindings {
  const [dragDepth, setDragDepth] = React.useState(0);

  const onDragEnter = React.useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      event.preventDefault();

      if (disabled) {
        return;
      }

      setDragDepth((current) => current + 1);
    },
    [disabled],
  );

  const onDragLeave = React.useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      event.preventDefault();

      if (disabled) {
        return;
      }

      setDragDepth((current) => Math.max(0, current - 1));
    },
    [disabled],
  );

  const onDragOver = React.useCallback<React.DragEventHandler<HTMLElement>>((event) => {
    event.preventDefault();
  }, []);

  const onDrop = React.useCallback<React.DragEventHandler<HTMLElement>>(
    (event) => {
      event.preventDefault();
      setDragDepth(0);

      if (disabled) {
        return;
      }

      const files = Array.from(event.dataTransfer.files ?? []);

      if (files.length > 0) {
        onFilesDropped(files);
      }
    },
    [disabled, onFilesDropped],
  );

  return {
    isDragging: dragDepth > 0,
    onDragEnter,
    onDragLeave,
    onDragOver,
    onDrop,
  };
}
