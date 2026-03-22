/**
 * PaneToolTabBar — horizontal icon strip for per-pane tool selection in split view.
 *
 * Renders a compact row of tool icon buttons. Clicking a tab activates it
 * (showing the tool in the pane's drawer). Clicking the active tab deactivates it
 * (closing the drawer).
 */

import { memo } from "react";
import {
  Terminal,
  Globe,
  GitBranch,
  FileText,
  FolderTree,
  ListTodo,
  Bot,
  Plug,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ToolId } from "@/components/ToolPicker";

const TOOL_CONFIG: {
  id: ToolId;
  label: string;
  Icon: React.FC<{ className?: string }>;
  /** Only show when this condition is met (always show if undefined). */
  contextual?: boolean;
}[] = [
  { id: "terminal", label: "Terminal", Icon: Terminal },
  { id: "git", label: "Git", Icon: GitBranch },
  { id: "files", label: "Files", Icon: FileText },
  { id: "project-files", label: "Project Files", Icon: FolderTree },
  { id: "mcp", label: "MCP Servers", Icon: Plug },
  { id: "browser", label: "Browser", Icon: Globe },
  { id: "tasks", label: "Tasks", Icon: ListTodo, contextual: true },
  { id: "agents", label: "Agents", Icon: Bot, contextual: true },
];

interface PaneToolTabBarProps {
  /** Currently active tool tab (null if drawer is closed). */
  activeTab: ToolId | null;
  /** Called when a tab is clicked. */
  onToggleTab: (toolId: ToolId) => void;
  /** Which contextual tools have data to show (tasks with items, agents running). */
  availableContextual?: Set<ToolId>;
}

export const PaneToolTabBar = memo(function PaneToolTabBar({
  activeTab,
  onToggleTab,
  availableContextual,
}: PaneToolTabBarProps) {
  return (
    <div className="flex h-8 shrink-0 items-center gap-0.5 border-t border-border/50 px-1.5">
      {TOOL_CONFIG.map(({ id, label, Icon, contextual }) => {
        // Skip contextual tools that have no data
        if (contextual && !availableContextual?.has(id)) return null;

        const isActive = activeTab === id;

        return (
          <Tooltip key={id}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                  isActive
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground/60 hover:bg-foreground/5 hover:text-foreground/80"
                }`}
                onClick={() => onToggleTab(id)}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
});
