/**
 * File content loader and renderer
 * Loads file content via Tauri backend command, parses frontmatter, renders markdown
 */

import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Loader2, AlertCircle } from 'lucide-react';
import { useGSDStore, type FileTab } from '@/stores/gsdStore';
import { parseMarkdownFile, type ParsedMarkdown } from '@/lib/gsd/parseMarkdown';
import { GSDFrontmatter } from './GSDFrontmatter';
import { GSDMarkdownContent } from './GSDMarkdownContent';

interface GSDFileContentProps {
  tab: FileTab;
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export function GSDFileContent({ tab }: GSDFileContentProps) {
  const { updateTabContent } = useGSDStore();
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedMarkdown | null>(null);

  useEffect(() => {
    // Reset state when tab changes
    setStatus('idle');
    setError(null);
    setParsed(null);

    // If content already cached in tab, use it
    if (tab.content) {
      const result = parseMarkdownFile(tab.content);
      setParsed(result);
      setStatus('ready');
      return;
    }

    // Load file content
    const loadContent = async () => {
      setStatus('loading');
      setError(null);

      try {
        const content = await invoke<string>('read_text_file', { filePath: tab.filepath });

        // Cache content in store
        updateTabContent(tab.id, content);

        // Parse frontmatter
        const result = parseMarkdownFile(content);
        setParsed(result);
        setStatus('ready');
      } catch (err) {
        console.error('Failed to read file:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to read file'
        );
        setStatus('error');
      }
    };

    loadContent();
  }, [tab.id, tab.filepath, tab.content, updateTabContent]);

  // Loading state
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-xs">Loading file...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="p-4">
        <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <div className="text-xs text-destructive">
            <p className="font-medium mb-1">Failed to load file</p>
            <p className="text-destructive/80">{error}</p>
            <p className="text-destructive/60 mt-2 font-mono text-[10px] break-all">
              {tab.filepath}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Ready state - render content
  if (!parsed) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Frontmatter section */}
      {parsed.hasFrontmatter && (
        <GSDFrontmatter data={parsed.frontmatter} />
      )}

      {/* Markdown content */}
      <GSDMarkdownContent
        content={parsed.content}
        basePath={tab.filepath}
      />
    </div>
  );
}
