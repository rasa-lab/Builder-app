import React, { useState } from 'react';
import { Menu, Plus, Folder, Settings, Code2, X, Trash2, LogOut, MoreVertical, Edit2 } from 'lucide-react';
import { Project } from '../App';
import { auth, signOut } from '../lib/firebase';

interface SidebarProps {
  projects: Project[];
  currentProjectId: string | null;
  onLoadProject: (proj: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onRenameProject: (projectId: string, newName: string) => void;
  onClose?: () => void;
  onOpenSettings: () => void;
  onClearChat: () => void;
}

export function Sidebar({ projects, currentProjectId, onLoadProject, onDeleteProject, onRenameProject, onClose, onOpenSettings, onClearChat }: SidebarProps) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <div className="w-64 bg-[#09090b] border-r border-zinc-800 flex flex-col h-full">
      <div className="p-3 flex items-center justify-between border-b border-zinc-800">
        <div className="flex items-center gap-2 font-bold text-sm text-zinc-100 tracking-wide">
          <Code2 size={18} className="text-blue-500" />
          <span>X BUILDER</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden p-1.5 hover:bg-zinc-800 rounded-md text-zinc-400">
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="p-2">
        <button 
          onClick={onClearChat}
          className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors font-medium text-xs shadow-sm"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 space-y-1">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-2">My Projects</div>
          {projects.map(proj => (
            <SidebarItem 
              key={proj.id}
              project={proj}
              active={proj.id === currentProjectId} 
              onClick={() => onLoadProject(proj)}
              onDelete={() => onDeleteProject(proj.id)}
              onRename={(newName) => onRenameProject(proj.id, newName)}
            />
          ))}
          {projects.length === 0 && (
            <div className="text-zinc-500 text-sm px-2 italic">No projects yet</div>
          )}
        </div>
      </div>

      <div className="p-2 border-t border-zinc-800 space-y-1">
        <button 
          onClick={onClearChat}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
        >
          <Trash2 size={14} />
          Clear Chat
        </button>
        <button 
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <Settings size={14} />
          Settings
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

function SidebarItem({ project, active = false, onClick, onDelete, onRename }: { project: Project, active?: boolean, onClick?: () => void, onDelete: () => void, onRename: (newName: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [showMenu, setShowMenu] = useState(false);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editName.trim() && editName !== project.name) {
      onRename(editName.trim());
    } else {
      setEditName(project.name);
    }
    setIsEditing(false);
  };

  return (
    <div className="relative group">
      {isEditing ? (
        <form onSubmit={handleRenameSubmit} className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-800">
          <Folder size={14} className="text-zinc-400 shrink-0" />
          <input 
            type="text" 
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRenameSubmit}
            autoFocus
            className="bg-transparent border-none outline-none text-xs text-zinc-100 w-full"
          />
        </form>
      ) : (
        <div 
          className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md transition-colors text-xs font-medium group/item ${active ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
        >
          <button onClick={onClick} className="flex items-center gap-2 flex-1 truncate text-left">
            <Folder size={14} className="shrink-0" />
            <span className="truncate">{project.name}</span>
          </button>
          
          <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 ml-2">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors"
              title="Rename"
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
