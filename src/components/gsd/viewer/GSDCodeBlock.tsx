/**
 * Code block component with syntax highlighting and copy button
 * Used within markdown content for fenced code blocks
 */

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { getClaudeSyntaxTheme } from '@/lib/claudeSyntaxTheme';
import { useTheme } from '@/hooks';
import { cn } from '@/lib/utils';

interface GSDCodeBlockProps {
  /** Programming language for syntax highlighting */
  language: string;
  /** Code content */
  code: string;
  /** Show line numbers (default: true) */
  showLineNumbers?: boolean;
}

export function GSDCodeBlock({
  language,
  code,
  showLineNumbers = true
}: GSDCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const syntaxTheme = getClaudeSyntaxTheme(theme);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="relative group my-4">
      {/* Language badge */}
      {language && (
        <div className="absolute top-2 left-3 z-10 text-xs text-muted-foreground font-mono">
          {language}
        </div>
      )}

      {/* Copy button */}
      <button
        onClick={copyToClipboard}
        className={cn(
          "absolute top-2 right-2 z-10 p-1.5 rounded",
          "bg-background/80 hover:bg-background",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          "border border-border"
        )}
        aria-label={copied ? 'Copied!' : 'Copy code'}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Syntax highlighted code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={syntaxTheme}
        showLineNumbers={showLineNumbers}
        wrapLines={true}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'var(--color-muted-foreground)',
          userSelect: 'none',
          opacity: 0.5,
        }}
        customStyle={{
          margin: 0,
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          paddingTop: language ? '2rem' : '1rem',
          backgroundColor: 'var(--color-muted)',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
