/**
 * Individual command button with active/inactive styling
 * Shows command icon, label, and active state
 */

import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import type { GSDCommandDefinition } from '@/lib/gsd/command-registry';

interface GSDCommandButtonProps {
  command: GSDCommandDefinition;
}

export function GSDCommandButton({ command }: GSDCommandButtonProps) {
  const { parsedData, phases, openCommandDialog } = useGSDStore();

  // Determine if command is currently active
  const isActive = command.isActive({ parsedData, phases });
  const Icon = command.icon;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent category collapse/expand
    openCommandDialog(command);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 w-full px-2 py-1 rounded",
        "hover:bg-muted transition-colors",
        "text-sm text-left",
        !isActive && "opacity-50"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1 truncate">{command.label}</span>
    </button>
  );
}
