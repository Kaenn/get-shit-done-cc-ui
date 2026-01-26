/**
 * Clickable GSD command link component
 * Renders GSD commands as clickable links that open in a new terminal
 */

import React from 'react';
import { Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTabContext } from '@/contexts/TabContext';
import { useGSDStore } from '@/stores/gsdStore';

interface GSDCommandLinkProps {
  /** The full command string (e.g., "/gsd:plan-phase 6 --gaps") */
  command: string;
  /** Optional className for styling */
  className?: string;
}

/**
 * Renders a GSD command as a clickable link.
 * When clicked, opens a new chat tab with the command pre-filled and auto-executed.
 */
export function GSDCommandLink({ command, className }: GSDCommandLinkProps) {
  const { addTab } = useTabContext();
  const { projectPath } = useGSDStore();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!projectPath) {
      console.warn('No project path available for GSD command execution');
      return;
    }

    // Create a new chat tab with the command
    const projectName = projectPath.split('/').pop() || 'GSD';
    addTab({
      type: 'chat',
      title: `${projectName} - ${command.split(' ')[0]}`,
      initialProjectPath: projectPath,
      initialCommand: command,
      status: 'idle',
      hasUnsavedChanges: false,
    });
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded",
        "bg-primary/10 hover:bg-primary/20",
        "text-primary font-mono text-sm",
        "transition-colors cursor-pointer",
        "border border-primary/20 hover:border-primary/40",
        className
      )}
      title={`Execute in new terminal: ${command}`}
    >
      <Terminal className="w-3 h-3" />
      <span>{command}</span>
    </button>
  );
}

/**
 * Regex pattern to match GSD commands in text.
 * Matches: /gsd:command-name [args] [--flags]
 */
export const GSD_COMMAND_PATTERN = /\/gsd:[\w-]+(?:\s+[\w.-]+)*(?:\s+--[\w-]+(?:=[\w.-]+)?)*(?:\s+--[\w-]+(?:=[\w.-]+)?)*/g;

/**
 * Parse text and replace GSD command patterns with clickable components.
 * Returns an array of React nodes (strings and GSDCommandLink components).
 */
export function parseGSDCommands(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex state
  GSD_COMMAND_PATTERN.lastIndex = 0;

  while ((match = GSD_COMMAND_PATTERN.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the clickable command
    const command = match[0];
    parts.push(
      <GSDCommandLink key={`gsd-cmd-${match.index}`} command={command} />
    );

    lastIndex = match.index + command.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}
