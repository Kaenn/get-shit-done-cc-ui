/**
 * GSD panel content component
 * Displays parsed project state and phase information
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertCircle, FolderOpen, Zap } from 'lucide-react';
import { useGSDStore } from '@/stores/gsdStore';
import { cn } from '@/lib/utils';
import { GSDTreeView } from './GSDTreeView';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export function GSDPanelContent() {
  const {
    parsedData,
    isLoading,
    error,
    togglePanel,
    projectPath,
    comboMode,
    toggleComboMode
  } = useGSDStore();

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-background border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">GSD</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Combo Mode Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <Zap className={cn(
                    "w-3.5 h-3.5",
                    comboMode ? "text-amber-500" : "text-muted-foreground"
                  )} />
                  <Switch
                    checked={comboMode}
                    onCheckedChange={toggleComboMode}
                    className="scale-75"
                    aria-label="Toggle combo mode"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="text-xs">
                  Combo mode: {comboMode ? 'Auto-chain commands' : 'Manual execution'}
                </span>
              </TooltipContent>
            </Tooltip>
            {/* Close Button */}
            <button
              onClick={togglePanel}
              className={cn(
                "p-1 rounded-sm",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-muted",
                "transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              title="Hide GSD Panel"
              aria-label="Hide GSD Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-xs">Loading GSD data...</p>
              </div>
            </motion.div>
          )}

          {!isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-4"
            >
              <div className="flex items-start gap-2 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div className="text-xs text-destructive">
                  <p className="font-medium mb-1">Failed to load GSD data</p>
                  <p className="text-destructive/80">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {!isLoading && !error && !parsedData && (
            <motion.div
              key="no-data"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex flex-col items-center justify-center h-full p-6 text-center"
            >
              <FolderOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-1">No GSD project</p>
              <p className="text-xs text-muted-foreground/70">
                Open a project with a .planning/ directory
              </p>
            </motion.div>
          )}

          {!isLoading && !error && parsedData && (
            <motion.div
              key="data"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-4 space-y-4"
            >
              {/* Current Phase Summary */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Current Phase
                </h3>
                <div className="p-3 rounded-lg border border-border bg-muted/30">
                  <p className="text-sm font-medium mb-1">
                    Phase {parsedData.currentPhase} of {parsedData.totalPhases}
                    {parsedData.phaseName && `: ${parsedData.phaseName}`}
                  </p>
                  {parsedData.totalPlans !== null ? (
                    <p className="text-xs text-muted-foreground">
                      Plan {parsedData.currentPlan} of {parsedData.totalPlans}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Plan {parsedData.currentPlan} of ? in current phase
                    </p>
                  )}
                </div>
              </div>

              {/* Tree View */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Project Structure
                </h3>
                <GSDTreeView projectPath={projectPath} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </TooltipProvider>
  );
}
