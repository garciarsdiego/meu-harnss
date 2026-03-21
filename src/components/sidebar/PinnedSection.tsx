import { Pin } from "lucide-react";
import type { ChatFolder, ChatSession, InstalledAgent } from "@/types";
import type { SidebarItem } from "@/lib/sidebar-grouping";
import { SessionItem } from "./SessionItem";
import { FolderSection } from "./FolderSection";

export function PinnedSection({
  sessions,
  pinnedFolders,
  activeSessionId,
  islandLayout,
  folders,
  onSelectSession,
  onDeleteSession,
  onRenameSession,
  onPinSession,
  onMoveSessionToFolder,
  onPinFolder,
  onRenameFolder,
  onDeleteFolder,
  agents,
}: {
  sessions: ChatSession[];
  pinnedFolders?: SidebarItem[];
  activeSessionId: string | null;
  islandLayout: boolean;
  folders: ChatFolder[];
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onPinSession: (id: string, pinned: boolean) => void;
  onMoveSessionToFolder: (sessionId: string, folderId: string | null) => void;
  onPinFolder: (projectId: string, folderId: string, pinned: boolean) => void;
  onRenameFolder: (projectId: string, folderId: string, name: string) => void;
  onDeleteFolder: (projectId: string, folderId: string) => void;
  agents?: InstalledAgent[];
}) {
  if (sessions.length === 0 && (!pinnedFolders || pinnedFolders.length === 0)) return null;

  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center gap-1.5 px-3">
        <Pin className="h-3 w-3 shrink-0 text-sidebar-foreground/40" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40">
          Pinned
        </p>
      </div>
      {pinnedFolders?.map((item) => item.folder && (
        <FolderSection
          key={`folder-${item.folder.id}`}
          folder={item.folder}
          sessions={item.sessions}
          activeSessionId={activeSessionId}
          islandLayout={islandLayout}
          allFolders={folders}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          onRenameSession={onRenameSession}
          onPinSession={onPinSession}
          onMoveSessionToFolder={onMoveSessionToFolder}
          onPinFolder={(pinned) => onPinFolder(item.folder!.projectId, item.folder!.id, pinned)}
          onRenameFolder={(name) => onRenameFolder(item.folder!.projectId, item.folder!.id, name)}
          onDeleteFolder={() => onDeleteFolder(item.folder!.projectId, item.folder!.id)}
          agents={agents}
        />
      ))}
      {sessions.map((session) => (
        <SessionItem
          key={session.id}
          islandLayout={islandLayout}
          session={session}
          isActive={session.id === activeSessionId}
          onSelect={() => onSelectSession(session.id)}
          onDelete={() => onDeleteSession(session.id)}
          onRename={(title) => onRenameSession(session.id, title)}
          onPinToggle={() => onPinSession(session.id, false)}
          folders={folders}
          onMoveToFolder={(folderId) => onMoveSessionToFolder(session.id, folderId)}
          agents={agents}
        />
      ))}
    </div>
  );
}
