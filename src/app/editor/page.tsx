import React from 'react';
import type { Metadata } from 'next';

import { EditorShell } from '@/features/editor/components/editor-shell';

export const metadata: Metadata = {
  title: 'Editor | Hexagen Photo',
  description: 'Prepare passport and visa photos locally in your browser with preset-guided cropping and export settings.',
};

export default function EditorPage(): React.JSX.Element {
  return <EditorShell />;
}
