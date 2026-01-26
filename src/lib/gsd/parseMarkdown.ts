/**
 * Markdown parsing utility
 * Extracts YAML frontmatter from markdown content using gray-matter
 */

import matter from 'gray-matter';

export interface ParsedMarkdown {
  /** Parsed frontmatter as key-value pairs */
  frontmatter: Record<string, unknown>;
  /** Markdown content without frontmatter */
  content: string;
  /** Whether the file had frontmatter */
  hasFrontmatter: boolean;
}

/**
 * Parse markdown file content, extracting frontmatter
 *
 * @param raw - Raw file content
 * @returns Parsed markdown with separated frontmatter and content
 */
export function parseMarkdownFile(raw: string): ParsedMarkdown {
  try {
    const { data, content } = matter(raw);
    return {
      frontmatter: data,
      content,
      hasFrontmatter: Object.keys(data).length > 0,
    };
  } catch (error) {
    // Malformed YAML - treat entire content as markdown
    console.warn('Failed to parse frontmatter:', error);
    return {
      frontmatter: {},
      content: raw,
      hasFrontmatter: false,
    };
  }
}

/**
 * Convert frontmatter object to YAML string for display
 * Simple representation for visual display purposes
 */
export function frontmatterToYaml(data: Record<string, unknown>): string {
  if (Object.keys(data).length === 0) return '';

  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          lines.push(`  - ${JSON.stringify(item)}`);
        } else {
          lines.push(`  - ${item}`);
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      lines.push(`${key}: ${JSON.stringify(value)}`);
    } else if (typeof value === 'string' && value.includes('\n')) {
      lines.push(`${key}: |`);
      for (const line of value.split('\n')) {
        lines.push(`  ${line}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  return lines.join('\n');
}
