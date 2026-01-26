/**
 * Action link component for tree nodes
 * Renders clickable italic-styled links that open command dialogs
 */

import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import { getCommandById } from '@/lib/gsd/command-registry';
import type { ActionLink } from '@/lib/gsd/commands';

interface GSDActionLinkProps {
  link: ActionLink;
  depth: number;
}

export function GSDActionLink({ link, depth }: GSDActionLinkProps) {
  const { openCommandDialog, isCommandRunning } = useGSDStore();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCommandRunning) return;

    const command = getCommandById(link.commandId);
    if (command) {
      openCommandDialog(command, link.initialValues);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 py-0.5 px-1',
        depth > 0 && 'ml-4'
      )}
    >
      {/* Spacer for chevron alignment */}
      <div className="w-4" />

      {/* Action link text */}
      <button
        onClick={handleClick}
        disabled={isCommandRunning}
        className={cn(
          'text-sm italic text-muted-foreground',
          'hover:text-foreground hover:underline transition-colors',
          'text-left',
          isCommandRunning && 'opacity-50 cursor-not-allowed'
        )}
      >
        {link.label}
      </button>
    </div>
  );
}
