/**
 * PaneToolDrawer — bottom tool area for a single split view pane.
 *
 * Contains a PaneToolTabBar for tool selection and renders the active tool
 * content below it. Height is resizable via a drag handle at the top.
 */

import { memo, useCallback, useRef } from "react";
import type { ToolId } from "@/components/ToolPicker";
import { PaneToolTabBar } from "./PaneToolTabBar";
import { MIN_PANE_DRAWER_HEIGHT, MAX_PANE_DRAWER_HEIGHT } from "@/lib/layout-constants";

interface PaneToolDrawerProps {
  /** Whether the drawer is open. */
  open: boolean;
  /** Currently active tool tab. */
  activeTab: ToolId | null;
  /** Drawer height in pixels. */
  height: number;
  /** Called when a tool tab is toggled. */
  onToggleTab: (toolId: ToolId) => void;
  /** Called during height resize drag. */
  onHeightChange: (height: number) => void;
  /** Which contextual tools are available (have data). */
  availableContextual?: Set<ToolId>;
  /** The tool content to render (provided by the parent). */
  children: React.ReactNode;
}

export const PaneToolDrawer = memo(function PaneToolDrawer({
  open,
  activeTab,
  height,
  onToggleTab,
  onHeightChange,
  availableContextual,
  children,
}: PaneToolDrawerProps) {
  const draggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      startYRef.current = e.clientY;
      startHeightRef.current = height;

      const handleMove = (moveEvent: MouseEvent) => {
        if (!draggingRef.current) return;
        const delta = startYRef.current - moveEvent.clientY;
        const newHeight = Math.max(
          MIN_PANE_DRAWER_HEIGHT,
          Math.min(MAX_PANE_DRAWER_HEIGHT, startHeightRef.current + delta),
        );
        onHeightChange(newHeight);
      };

      const handleUp = () => {
        draggingRef.current = false;
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleUp);
      };

      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleUp);
    },
    [height, onHeightChange],
  );

  if (!open || !activeTab) {
    // Still render the tab bar even when closed (it acts as the toggle)
    return (
      <PaneToolTabBar
        activeTab={activeTab}
        onToggleTab={onToggleTab}
        availableContextual={availableContextual}
      />
    );
  }

  return (
    <div className="flex shrink-0 flex-col overflow-hidden border-t border-border/30">
      {/* Resize handle at top of drawer — h-2 hit target with thin visible pill */}
      <div
        className="group flex h-2 shrink-0 cursor-row-resize items-center justify-center"
        onMouseDown={handleResizeStart}
      >
        <div className="h-0.5 w-10 rounded-full bg-foreground/10 transition-colors group-hover:bg-foreground/25" />
      </div>

      {/* Tab bar */}
      <PaneToolTabBar
        activeTab={activeTab}
        onToggleTab={onToggleTab}
        availableContextual={availableContextual}
      />

      {/* Tool content — explicit height, no flex-1 (parent is shrink-0, so there's nothing to grow into) */}
      <div
        className="min-h-0 overflow-hidden"
        style={{ height }}
      >
        {children}
      </div>
    </div>
  );
});
