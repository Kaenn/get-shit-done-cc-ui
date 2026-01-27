/**
 * Markdown content renderer
 * Renders GFM markdown with custom components for code blocks and links
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGSDStore } from '@/stores/gsdStore';
import { cn } from '@/lib/utils';
import { GSDCodeBlock } from './GSDCodeBlock';

interface GSDMarkdownContentProps {
  /** Markdown content (without frontmatter) */
  content: string;
  /** Base path for resolving relative links */
  basePath?: string;
}

export function GSDMarkdownContent({ content, basePath }: GSDMarkdownContentProps) {
  const { openFile } = useGSDStore();

  /**
   * Resolve relative path to absolute path
   */
  const resolvePath = (href: string): string => {
    if (!basePath || href.startsWith('/') || href.startsWith('http')) {
      return href;
    }
    // Get directory of current file
    const baseDir = basePath.substring(0, basePath.lastIndexOf('/'));
    // Simple path resolution (handles ../ and ./)
    const parts = `${baseDir}/${href}`.split('/');
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === '..') {
        resolved.pop();
      } else if (part !== '.' && part !== '') {
        resolved.push(part);
      }
    }
    return '/' + resolved.join('/');
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none px-4 py-4">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const code = String(children).replace(/\n$/, '');

            // Fenced code blocks with language
            if (!inline && match) {
              return (
                <GSDCodeBlock
                  language={match[1]}
                  code={code}
                  showLineNumbers={true}
                />
              );
            }

            // Fenced code blocks without language
            if (!inline && code.includes('\n')) {
              return (
                <GSDCodeBlock
                  language=""
                  code={code}
                  showLineNumbers={true}
                />
              );
            }

            // Inline code
            return (
              <code
                className={cn(
                  "px-1.5 py-0.5 rounded text-sm font-mono",
                  "bg-muted text-foreground"
                )}
                {...props}
              >
                {children}
              </code>
            );
          },

          // Custom link handling
          a({ href, children, ...props }: any) {
            // Internal .md links open in viewer
            if (href?.endsWith('.md')) {
              const resolvedPath = resolvePath(href);
              return (
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    openFile(resolvedPath);
                  }}
                  className="text-primary hover:underline cursor-pointer"
                  {...props}
                >
                  {children}
                </a>
              );
            }

            // External links open in new tab
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },

          // Table styling
          table({ children, ...props }: any) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse" {...props}>
                  {children}
                </table>
              </div>
            );
          },

          th({ children, ...props }: any) {
            return (
              <th
                className="border border-border px-3 py-2 bg-muted text-left font-medium"
                {...props}
              >
                {children}
              </th>
            );
          },

          td({ children, ...props }: any) {
            return (
              <td className="border border-border px-3 py-2" {...props}>
                {children}
              </td>
            );
          },

          // Blockquote styling
          blockquote({ children, ...props }: any) {
            return (
              <blockquote
                className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground my-4"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // Task list items (read-only)
          li({ children, ...props }: any) {
            // Check if this is a task list item
            const firstChild = Array.isArray(children) ? children[0] : children;
            if (
              typeof firstChild === 'object' &&
              firstChild?.props?.type === 'checkbox'
            ) {
              return (
                <li className="list-none flex items-start gap-2" {...props}>
                  {children}
                </li>
              );
            }
            return <li {...props}>{children}</li>;
          },

          // Checkbox styling (read-only)
          input({ type, checked, ...props }: any) {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="mt-1 rounded border-border"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
