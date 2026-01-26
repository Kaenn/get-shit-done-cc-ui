/**
 * Toggle button to show/hide GSD panel
 * Appears on the right edge when panel is collapsed
 */

import { ChevronLeft } from 'lucide-react';
import { useGSDStore } from '@/stores/gsdStore';
import { cn } from '@/lib/utils';

export function GSDToggleButton() {
  const { togglePanel } = useGSDStore();

  return (
    <button
      onClick={togglePanel}
      className={cn(
        "fixed right-0 top-1/2 -translate-y-1/2 z-50",
        "flex items-center justify-center",
        "w-6 h-16 rounded-l-md",
        "bg-primary/10 hover:bg-primary/20",
        "border border-r-0 border-border",
        "text-muted-foreground hover:text-foreground",
        "transition-all duration-200",
        "shadow-sm hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      )}
      title="Show GSD Panel"
      aria-label="Show GSD Panel"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
  );
}
