/**
 * Markdown parsing utility
 * Extracts YAML frontmatter from markdown content using gray-matter
 * Transforms GSD XML sections into readable markdown
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
 * GSD XML tag to markdown heading mappings
 * Maps XML tags used in GSD markdown files to readable section headings
 */
const GSD_XML_TAG_MAPPINGS: Record<string, { heading: string; level: number }> = {
  objective: { heading: 'Objective', level: 2 },
  execution_context: { heading: 'Execution Context', level: 2 },
  context: { heading: 'Context', level: 2 },
  tasks: { heading: 'Tasks', level: 2 },
  task: { heading: 'Task', level: 3 },
  verify: { heading: 'Verify', level: 4 },
  action: { heading: 'Action', level: 4 },
  files: { heading: 'Files', level: 4 },
  name: { heading: '', level: 0 }, // Special: use content as heading
  summary: { heading: 'Summary', level: 2 },
  changes: { heading: 'Changes', level: 2 },
  verification: { heading: 'Verification', level: 2 },
  blockers: { heading: 'Blockers', level: 2 },
  next_steps: { heading: 'Next Steps', level: 2 },
  dependencies: { heading: 'Dependencies', level: 2 },
  notes: { heading: 'Notes', level: 2 },
  research: { heading: 'Research', level: 2 },
  findings: { heading: 'Findings', level: 2 },
  recommendations: { heading: 'Recommendations', level: 2 },
  requirements: { heading: 'Requirements', level: 2 },
  rationale: { heading: 'Rationale', level: 3 },
  implementation: { heading: 'Implementation', level: 3 },
  testing: { heading: 'Testing', level: 3 },
};

/**
 * Transform GSD XML sections into readable markdown
 * Converts <tagname>content</tagname> to ## Heading\ncontent
 *
 * @param content - Markdown content potentially containing XML sections
 * @returns Transformed markdown with readable headings
 */
function transformGsdXmlSections(content: string): string {
  let transformed = content;

  // Process each known tag
  for (const [tag, config] of Object.entries(GSD_XML_TAG_MAPPINGS)) {
    // Match both self-closing and content tags
    // Pattern: <tag ...attributes?>content</tag>
    const regex = new RegExp(
      `<${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)</${tag}>`,
      'gi'
    );

    transformed = transformed.replace(regex, (_, innerContent: string) => {
      const trimmedContent = innerContent.trim();

      // Special case: <name> tag - use content as the heading text
      if (tag === 'name' && trimmedContent) {
        return `**${trimmedContent}**\n`;
      }

      // Skip if no heading configured (level 0)
      if (config.level === 0) {
        return trimmedContent;
      }

      // Generate heading with appropriate level
      const headingPrefix = '#'.repeat(config.level);
      const heading = `${headingPrefix} ${config.heading}`;

      // Return heading followed by content
      if (trimmedContent) {
        return `${heading}\n\n${trimmedContent}\n`;
      }
      return `${heading}\n`;
    });
  }

  // Clean up any remaining unknown XML-like tags by converting them to headings
  // Pattern: <word>content</word> where word is not a known HTML tag
  const unknownTagRegex = /<([a-z_][a-z0-9_]*)(?:\s+[^>]*)?>([^<]*?)<\/\1>/gi;
  const htmlTags = new Set(['p', 'div', 'span', 'br', 'hr', 'a', 'img', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody', 'code', 'pre', 'em', 'strong', 'b', 'i', 'u', 's', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

  transformed = transformed.replace(unknownTagRegex, (match, tagName: string, innerContent: string) => {
    // Skip HTML tags
    if (htmlTags.has(tagName.toLowerCase())) {
      return match;
    }

    // Skip if already processed
    if (GSD_XML_TAG_MAPPINGS[tagName.toLowerCase()]) {
      return match;
    }

    const trimmedContent = innerContent.trim();
    // Convert tag name to Title Case heading
    const heading = tagName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    if (trimmedContent) {
      return `### ${heading}\n\n${trimmedContent}\n`;
    }
    return `### ${heading}\n`;
  });

  // Clean up excessive blank lines (more than 2 consecutive)
  transformed = transformed.replace(/\n{4,}/g, '\n\n\n');

  return transformed;
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
    // Transform GSD XML sections into readable markdown
    const transformedContent = transformGsdXmlSections(content);
    return {
      frontmatter: data,
      content: transformedContent,
      hasFrontmatter: Object.keys(data).length > 0,
    };
  } catch (error) {
    // Malformed YAML - treat entire content as markdown
    console.warn('Failed to parse frontmatter:', error);
    // Still try to transform XML sections
    const transformedContent = transformGsdXmlSections(raw);
    return {
      frontmatter: {},
      content: transformedContent,
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
