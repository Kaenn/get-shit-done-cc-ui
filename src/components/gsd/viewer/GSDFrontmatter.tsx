/**
 * Collapsible frontmatter display component
 * Shows YAML frontmatter with syntax highlighting
 */

import { useState } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { ChevronRight, FileCode } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { getClaudeSyntaxTheme } from '@/lib/claudeSyntaxTheme';
import { useTheme } from '@/hooks';
import { cn } from '@/lib/utils';
import { frontmatterToYaml } from '@/lib/gsd/parseMarkdown';

interface GSDFrontmatterProps {
  /** Parsed frontmatter data */
  data: Record<string, unknown>;
  /** Initially open state (default: false - collapsed) */
  defaultOpen?: boolean;
}

export function GSDFrontmatter({ data, defaultOpen = false }: GSDFrontmatterProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);

  const yamlString = frontmatterToYaml(data);

  // Don't render if no frontmatter
  if (!yamlString) return null;

  return (
    <Collapsible.Root open={isOpen} onOpenChange={setIsOpen}>
      <div className="border-b border-border">
        <Collapsible.Trigger
          className={cn(
            "flex items-center gap-2 w-full px-4 py-2",
            "hover:bg-muted/50 transition-colors",
            "text-sm font-medium"
          )}
        >
          <ChevronRight
            className={cn(
              "w-4 h-4 transition-transform",
              isOpen && "rotate-90"
            )}
          />
          <FileCode className="w-4 h-4 text-muted-foreground" />
          <span>Frontmatter</span>
          <span className="text-xs text-muted-foreground ml-auto">
            {Object.keys(data).length} {Object.keys(data).length === 1 ? 'field' : 'fields'}
          </span>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div className="px-4 pb-4">
            <SyntaxHighlighter
              language="yaml"
              style={syntaxTheme}
              customStyle={{
                margin: 0,
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                backgroundColor: 'var(--color-muted)',
              }}
            >
              {yamlString}
            </SyntaxHighlighter>
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  );
}
