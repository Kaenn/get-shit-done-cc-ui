import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ThreePaneProps {
  /**
   * Content for the left pane
   */
  left?: React.ReactNode;
  /**
   * Content for the center pane
   */
  center: React.ReactNode;
  /**
   * Content for the right pane
   */
  right?: React.ReactNode;
  /**
   * Left pane width as percentage (0-100)
   * @default 20
   */
  leftWidth?: number;
  /**
   * Right pane width as percentage (0-100)
   * @default 25
   */
  rightWidth?: number;
  /**
   * Minimum width for left pane in pixels
   * @default 200
   */
  minLeftWidth?: number;
  /**
   * Minimum width for center pane in pixels
   * @default 400
   */
  minCenterWidth?: number;
  /**
   * Minimum width for right pane in pixels
   * @default 200
   */
  minRightWidth?: number;
  /**
   * Show/hide left pane
   * @default true
   */
  showLeft?: boolean;
  /**
   * Show/hide right pane
   * @default true
   */
  showRight?: boolean;
  /**
   * Callback when left width changes
   */
  onLeftWidthChange?: (width: number) => void;
  /**
   * Callback when right width changes
   */
  onRightWidthChange?: (width: number) => void;
  /**
   * Optional className for styling
   */
  className?: string;
}

/**
 * Three-pane resizable layout component
 * Left and right panes are optional and can be toggled
 * Center pane always takes remaining space
 *
 * @example
 * <ThreePane
 *   left={<div>Commands</div>}
 *   center={<div>Terminal</div>}
 *   right={<div>Status</div>}
 *   leftWidth={20}
 *   rightWidth={25}
 *   showLeft={true}
 *   showRight={true}
 * />
 */
export const ThreePane: React.FC<ThreePaneProps> = ({
  left,
  center,
  right,
  leftWidth = 20,
  rightWidth = 25,
  minLeftWidth = 200,
  minCenterWidth = 400,
  minRightWidth = 200,
  showLeft = true,
  showRight = true,
  onLeftWidthChange,
  onRightWidthChange,
  className,
}) => {
  const [leftSplit, setLeftSplit] = useState(leftWidth);
  const [rightSplit, setRightSplit] = useState(rightWidth);
  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const leftDragStartX = useRef(0);
  const leftDragStartSplit = useRef(0);
  const rightDragStartX = useRef(0);
  const rightDragStartSplit = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  // Calculate center width dynamically
  const centerWidth = 100 - (showLeft ? leftSplit : 0) - (showRight ? rightSplit : 0);

  // Handle mouse down on left divider
  const handleLeftMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    leftDragStartX.current = e.clientX;
    leftDragStartSplit.current = leftSplit;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle mouse down on right divider
  const handleRightMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
    rightDragStartX.current = e.clientX;
    rightDragStartSplit.current = rightSplit;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle mouse move for left divider
  const handleLeftMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingLeft || !containerRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const containerWidth = containerRef.current!.offsetWidth;
      const deltaX = e.clientX - leftDragStartX.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newSplit = leftDragStartSplit.current + deltaPercent;

      // Calculate constraints
      const minSplit = (minLeftWidth / containerWidth) * 100;
      const maxSplit = 100 - (showRight ? rightSplit : 0) - (minCenterWidth / containerWidth) * 100;

      const clampedSplit = Math.min(Math.max(newSplit, minSplit), maxSplit);
      setLeftSplit(clampedSplit);
      onLeftWidthChange?.(clampedSplit);
    });
  }, [isDraggingLeft, minLeftWidth, minCenterWidth, rightSplit, showRight, onLeftWidthChange]);

  // Handle mouse move for right divider
  const handleRightMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRight || !containerRef.current) return;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      const containerWidth = containerRef.current!.offsetWidth;
      const deltaX = rightDragStartX.current - e.clientX; // Inverted for right pane
      const deltaPercent = (deltaX / containerWidth) * 100;
      const newSplit = rightDragStartSplit.current + deltaPercent;

      // Calculate constraints
      const minSplit = (minRightWidth / containerWidth) * 100;
      const maxSplit = 100 - (showLeft ? leftSplit : 0) - (minCenterWidth / containerWidth) * 100;

      const clampedSplit = Math.min(Math.max(newSplit, minSplit), maxSplit);
      setRightSplit(clampedSplit);
      onRightWidthChange?.(clampedSplit);
    });
  }, [isDraggingRight, minRightWidth, minCenterWidth, leftSplit, showLeft, onRightWidthChange]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsDraggingLeft(false);
    setIsDraggingRight(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Add global mouse event listeners
  useEffect(() => {
    if (isDraggingLeft) {
      document.addEventListener('mousemove', handleLeftMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleLeftMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingLeft, handleLeftMouseMove, handleMouseUp]);

  useEffect(() => {
    if (isDraggingRight) {
      document.addEventListener('mousemove', handleRightMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleRightMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingRight, handleRightMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className={cn("flex h-full w-full relative", className)}
    >
      {/* Left pane */}
      {showLeft && left && (
        <>
          <div
            className="h-full overflow-hidden"
            style={{ width: `${leftSplit}%` }}
          >
            {left}
          </div>

          {/* Left divider */}
          <div
            className={cn(
              "relative flex-shrink-0 group",
              "w-1 hover:w-2 transition-all duration-150",
              "bg-border hover:bg-primary/50",
              "cursor-col-resize",
              isDraggingLeft && "bg-primary w-2"
            )}
            onMouseDown={handleLeftMouseDown}
            role="separator"
            aria-label="Resize left pane"
          >
            {/* Expand hit area */}
            <div className="absolute inset-y-0 -left-2 -right-2 z-10" />

            {/* Visual indicator dots */}
            <div className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "flex flex-col items-center justify-center gap-1",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isDraggingLeft && "opacity-100"
            )}>
              <div className="w-1 h-1 bg-primary rounded-full" />
              <div className="w-1 h-1 bg-primary rounded-full" />
              <div className="w-1 h-1 bg-primary rounded-full" />
            </div>
          </div>
        </>
      )}

      {/* Center pane */}
      <div
        className="h-full overflow-hidden flex-1"
        style={{ width: `${centerWidth}%` }}
      >
        {center}
      </div>

      {/* Right pane */}
      {showRight && right && (
        <>
          {/* Right divider */}
          <div
            className={cn(
              "relative flex-shrink-0 group",
              "w-1 hover:w-2 transition-all duration-150",
              "bg-border hover:bg-primary/50",
              "cursor-col-resize",
              isDraggingRight && "bg-primary w-2"
            )}
            onMouseDown={handleRightMouseDown}
            role="separator"
            aria-label="Resize right pane"
          >
            {/* Expand hit area */}
            <div className="absolute inset-y-0 -left-2 -right-2 z-10" />

            {/* Visual indicator dots */}
            <div className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "flex flex-col items-center justify-center gap-1",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isDraggingRight && "opacity-100"
            )}>
              <div className="w-1 h-1 bg-primary rounded-full" />
              <div className="w-1 h-1 bg-primary rounded-full" />
              <div className="w-1 h-1 bg-primary rounded-full" />
            </div>
          </div>

          <div
            className="h-full overflow-hidden"
            style={{ width: `${rightSplit}%` }}
          >
            {right}
          </div>
        </>
      )}
    </div>
  );
};
