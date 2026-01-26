/**
 * GSD Next Up Button Component
 * Displays and executes the next suggested action
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Play, Loader2 } from 'lucide-react';
import { useGSDStore } from '@/stores/gsdStore';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface GSDNextUpButtonProps {
  projectPath: string;
  className?: string;
}

export function GSDNextUpButton({ projectPath, className }: GSDNextUpButtonProps) {
  const { nextAction, isCommandRunning, setCommandRunning, treeData, parsedData } = useGSDStore();

  // Debug logging
  console.log('[GSDNextUpButton] render:', {
    projectPath,
    nextAction,
    isCommandRunning,
    treeDataLength: treeData?.length,
    currentPhase: parsedData?.currentPhase
  });

  // Hide when no action available
  if (!nextAction) {
    console.log('[GSDNextUpButton] hiding - no nextAction');
    return null;
  }

  const handleExecute = async () => {
    if (isCommandRunning || !nextAction) return;

    setCommandRunning(nextAction.command);
    try {
      await api.executeClaudeCode(projectPath, `/clear\n${nextAction.command}`, 'sonnet');
    } catch (error) {
      console.error('Next Up command failed:', error);
    } finally {
      setCommandRunning(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        onClick={handleExecute}
        disabled={isCommandRunning}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5",
          "bg-primary text-primary-foreground",
          "rounded-md text-sm font-medium",
          "hover:bg-primary/90 transition-colors",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        aria-label={`Execute: ${nextAction.label}`}
      >
        {isCommandRunning ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        <span>{nextAction.label}</span>
      </motion.button>
    </AnimatePresence>
  );
}
