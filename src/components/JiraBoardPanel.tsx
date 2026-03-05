/**
 * Panel for displaying Jira board and creating tasks from issues
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { JiraAuthDialog } from "./JiraAuthDialog";
import { useJiraConfig } from "@/hooks/useJiraConfig";
import type { JiraBoard, JiraIssue, JiraProjectConfig } from "@shared/types/jira";
import { Loader2, Settings, ExternalLink, Plus, ChevronDown } from "lucide-react";

interface JiraBoardPanelProps {
  projectId: string | null;
  onCreateTask: (issue: JiraIssue) => void;
}

export function JiraBoardPanel({ projectId, onCreateTask }: JiraBoardPanelProps) {
  const { config, loading: configLoading, saveConfig, deleteConfig } = useJiraConfig(projectId);

  const [showSetup, setShowSetup] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [setupForm, setSetupForm] = useState({
    instanceUrl: "",
    projectKey: "",
  });

  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string>("");

  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Show setup if no config or config not complete
  useEffect(() => {
    if (!configLoading && !config) {
      setShowSetup(true);
    } else if (config) {
      setShowSetup(false);
      setSetupForm({
        instanceUrl: config.instanceUrl,
        projectKey: config.projectKey,
      });
      setSelectedBoardId(config.boardId);
    }
  }, [config, configLoading]);

  // Load boards when config is available
  useEffect(() => {
    if (config && config.isAuthenticated) {
      loadBoards();
    }
  }, [config]);

  // Load issues when board is selected
  useEffect(() => {
    if (config && selectedBoardId && config.isAuthenticated) {
      loadIssues();
    }
  }, [config, selectedBoardId]);

  const loadBoards = async () => {
    if (!config) return;

    setLoadingBoards(true);
    setError(null);

    try {
      const loadedBoards = await window.claude.jira.getBoards({
        instanceUrl: config.instanceUrl,
        projectKey: config.projectKey,
      });
      setBoards(loadedBoards);
      setLoadingBoards(false);
    } catch (err) {
      setError(`Failed to load boards: ${err}`);
      setLoadingBoards(false);
    }
  };

  const loadIssues = async () => {
    if (!config || !selectedBoardId) return;

    setLoadingIssues(true);
    setError(null);

    try {
      const loadedIssues = await window.claude.jira.getIssues({
        instanceUrl: config.instanceUrl,
        boardId: selectedBoardId,
        maxResults: 50,
      });
      setIssues(loadedIssues);
      setLoadingIssues(false);
    } catch (err) {
      setError(`Failed to load issues: ${err}`);
      setLoadingIssues(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !setupForm.instanceUrl || !setupForm.projectKey) {
      setError("Please fill in all fields");
      return;
    }

    // Check if already authenticated
    const authStatus = await window.claude.jira.authStatus(setupForm.instanceUrl);

    if (!authStatus.hasToken) {
      // Need to authenticate first
      setShowAuth(true);
      return;
    }

    await completeSetup(true);
  };

  const completeSetup = async (isAuthenticated: boolean) => {
    if (!projectId) return;

    try {
      setError(null);
      setLoadingBoards(true);

      // Fetch boards to get first board for initial config
      const fetchedBoards = await window.claude.jira.getBoards({
        instanceUrl: setupForm.instanceUrl,
        projectKey: setupForm.projectKey,
      });

      setBoards(fetchedBoards);

      if (fetchedBoards.length === 0) {
        setError("No boards found for this project");
        setLoadingBoards(false);
        return;
      }

      const firstBoard = fetchedBoards[0];

      const newConfig: JiraProjectConfig = {
        instanceUrl: setupForm.instanceUrl,
        projectKey: setupForm.projectKey,
        boardId: firstBoard.id,
        boardName: firstBoard.name,
        authMethod: "apitoken",
        isAuthenticated,
        createdAt: Date.now(),
      };

      await saveConfig(newConfig);
      setSelectedBoardId(firstBoard.id);
      setShowSetup(false);
      setLoadingBoards(false);
    } catch (err) {
      setError(String(err));
      setLoadingBoards(false);
    }
  };

  const handleAuthSuccess = async () => {
    await completeSetup(true);
  };

  const handleDeleteConfig = async () => {
    if (confirm("Are you sure you want to remove the Jira configuration?")) {
      await deleteConfig();
      setBoards([]);
      setIssues([]);
      setSelectedBoardId("");
      setShowSetup(true);
    }
  };

  const handleBoardChange = async (boardId: string) => {
    if (!config || !projectId) return;

    setSelectedBoardId(boardId);

    const board = boards.find((b) => b.id === boardId);
    if (board) {
      const updatedConfig: JiraProjectConfig = {
        ...config,
        boardId: board.id,
        boardName: board.name,
      };
      await saveConfig(updatedConfig);
    }
  };

  if (!projectId) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-center text-muted-foreground">
        <p>No project selected</p>
      </div>
    );
  }

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showSetup) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 border-b border-border px-4 py-3">
          <h3 className="font-semibold text-sm">Setup Jira Board</h3>
        </div>

        <ScrollArea className="flex-1">
          <form onSubmit={handleSetupSubmit} className="p-4 space-y-4">
            <div className="space-y-2">
              <label htmlFor="instanceUrl" className="text-sm font-medium">
                Jira Instance URL
              </label>
              <Input
                id="instanceUrl"
                placeholder="https://your-domain.atlassian.net"
                value={setupForm.instanceUrl}
                onChange={(e) =>
                  setSetupForm({ ...setupForm, instanceUrl: e.target.value })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Your Atlassian cloud instance URL
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="projectKey" className="text-sm font-medium">
                Project Key
              </label>
              <Input
                id="projectKey"
                placeholder="PROJ"
                value={setupForm.projectKey}
                onChange={(e) =>
                  setSetupForm({
                    ...setupForm,
                    projectKey: e.target.value.toUpperCase(),
                  })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                The short key for your Jira project (e.g., PROJ, DEV)
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md p-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loadingBoards}>
              {loadingBoards ? (
                <>
                  <Loader2 className="w-4 h-4 me-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Connect to Jira"
              )}
            </Button>
          </form>
        </ScrollArea>

        <JiraAuthDialog
          open={showAuth}
          onOpenChange={setShowAuth}
          instanceUrl={setupForm.instanceUrl}
          onSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-border px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Jira Board</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteConfig}
            className="h-7 px-2"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {boards.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="truncate">
                  {boards.find((b) => b.id === selectedBoardId)?.name || "Select a board"}
                </span>
                <ChevronDown className="w-4 h-4 ms-2 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
              {boards.map((board) => (
                <DropdownMenuItem
                  key={board.id}
                  onClick={() => handleBoardChange(board.id)}
                >
                  {board.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <ScrollArea className="flex-1">
        {loadingIssues ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-500">{error}</div>
        ) : issues.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No issues found in this board
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {issues.map((issue) => (
              <div
                key={issue.key}
                className="border border-border rounded-md p-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        {issue.key}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {issue.status}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-medium wrap-break-word">
                      {issue.summary}
                    </h4>
                  </div>
                </div>

                {issue.assignee && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Assigned to: {issue.assignee.displayName}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => onCreateTask(issue)}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 me-1" />
                    Create Task
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.claude.openExternal(issue.url)}
                    className="h-7 text-xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <JiraAuthDialog
        open={showAuth}
        onOpenChange={setShowAuth}
        instanceUrl={config?.instanceUrl || ""}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
