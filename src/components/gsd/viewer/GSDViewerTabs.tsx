/**
 * Scrollable tab bar for file viewer
 * Supports horizontal scroll with arrow buttons when tabs overflow
 */

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGSDStore, type FileTab } from '@/stores/gsdStore';

export function GSDViewerTabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useGSDStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', checkScroll);
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [openTabs.length]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  if (openTabs.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center border-b border-border bg-muted/30">
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="flex-shrink-0 p-1.5 hover:bg-muted transition-colors"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Scrollable tab container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        <div className="flex">
          {openTabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={() => setActiveTab(tab.id)}
              onClose={() => closeTab(tab.id)}
            />
          ))}
        </div>
      </div>

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="flex-shrink-0 p-1.5 hover:bg-muted transition-colors"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface TabButtonProps {
  tab: FileTab;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
}

function TabButton({ tab, isActive, onSelect, onClose }: TabButtonProps) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1.5 px-3 py-2 border-r border-border",
        "cursor-pointer transition-colors",
        isActive
          ? "bg-background text-foreground"
          : "hover:bg-muted/50 text-muted-foreground"
      )}
      onClick={onSelect}
    >
      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-sm truncate max-w-[120px]" title={tab.filepath}>
        {tab.title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className={cn(
          "p-0.5 rounded hover:bg-muted-foreground/20",
          "opacity-0 group-hover:opacity-100 transition-opacity",
          isActive && "opacity-60"
        )}
        aria-label={`Close ${tab.title}`}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
