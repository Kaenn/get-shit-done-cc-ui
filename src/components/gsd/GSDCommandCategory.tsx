/**
 * Collapsible category section for command panel
 * Uses Radix Collapsible for expand/collapse functionality
 */

import * as Collapsible from '@radix-ui/react-collapsible';
import {
  ChevronRight,
  FolderPlus,
  GitBranch,
  Map,
  Flag,
  Zap,
  Compass,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGSDStore } from '@/stores/gsdStore';
import type { GSDCommandDefinition, CommandCategory } from '@/lib/gsd/command-registry';
import { GSDCommandButton } from './GSDCommandButton';

interface GSDCommandCategoryProps {
  category: CommandCategory;
  label: string;
  commands: GSDCommandDefinition[];
}

/**
 * Category icons mapping for all 7 categories
 */
const CATEGORY_ICONS: Record<CommandCategory, typeof FolderPlus> = {
  'project-setup': FolderPlus,
  'phase-lifecycle': GitBranch,
  'roadmap-ops': Map,
  'milestone-ops': Flag,
  'quick-work': Zap,
  navigation: Compass,
  configuration: Settings,
};

export function GSDCommandCategory({ category, label, commands }: GSDCommandCategoryProps) {
  const { expandedCategories, toggleCategory, parsedData, phases, showInactiveCommands } = useGSDStore();
  const isExpanded = expandedCategories.has(category);
  const Icon = CATEGORY_ICONS[category] || FolderPlus;

  // Filter commands based on showInactiveCommands setting
  const visibleCommands = showInactiveCommands
    ? commands
    : commands.filter((cmd) => cmd.isActive({ parsedData, phases }));

  return (
    <Collapsible.Root open={isExpanded} onOpenChange={() => toggleCategory(category)}>
      {/* Trigger */}
      <Collapsible.Trigger
        className={cn(
          "flex items-center gap-2 w-full px-2 py-1 rounded",
          "hover:bg-muted transition-colors",
          "text-sm font-medium"
        )}
      >
        <ChevronRight
          className={cn(
            "w-4 h-4 transition-transform",
            isExpanded && "rotate-90"
          )}
        />
        <Icon className="w-4 h-4" />
        <span className="flex-1 text-left">{label}</span>
        <span className={cn(
          "px-1.5 py-0.5 text-xs rounded",
          "bg-muted text-muted-foreground"
        )}>
          {visibleCommands.length}
        </span>
      </Collapsible.Trigger>

      {/* Content */}
      <Collapsible.Content className="space-y-0.5 mt-0.5 ml-2 pl-2 border-l border-border">
        {visibleCommands.map((command) => (
          <GSDCommandButton key={command.id} command={command} />
        ))}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
