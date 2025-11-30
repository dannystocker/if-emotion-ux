
import React, { useState } from 'react';
import { MessageSquare, Plus, Trash2, X, Folder, ChevronRight, ChevronDown, MoreVertical, FolderPlus } from 'lucide-react';
import { Session, Folder as FolderType, Language } from '../types';
import { TEXTS } from '../constants';
import { getConversationalTime } from '../utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  folders: FolderType[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onNewFolder: (name: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onMoveSession: (sessionId: string, folderId: string | undefined) => void;
  onDeleteFolder: (id: string) => void;
  language: Language;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  folders,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onNewFolder,
  onDeleteSession,
  onMoveSession,
  onDeleteFolder,
  language
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(folders.map(f => f.id)));
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null);

  const toggleFolder = (id: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedFolders(newSet);
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onNewFolder(newFolderName.trim());
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const sessionsByFolder: Record<string, Session[]> = {};
  const unsortedSessions: Session[] = [];

  sessions.forEach(s => {
    if (s.folderId && folders.find(f => f.id === s.folderId)) {
      if (!sessionsByFolder[s.folderId]) sessionsByFolder[s.folderId] = [];
      sessionsByFolder[s.folderId].push(s);
    } else {
      unsortedSessions.push(s);
    }
  });

  const renderSessionItem = (session: Session) => (
    <div 
        key={session.id}
        className={`
            relative group flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200
            ${currentSessionId === session.id ? 'bg-white shadow-sm border border-earth-200' : 'hover:bg-earth-200/50 border border-transparent'}
        `}
        onClick={() => { onSelectSession(session.id); if(window.innerWidth < 768) onClose(); }}
    >
        <MessageSquare size={16} className={`flex-shrink-0 ${currentSessionId === session.id ? 'text-clay-500' : 'text-earth-400'}`} />
        <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-earth-900' : 'text-earth-700'}`}>
                {session.title}
            </p>
            <p className="text-[10px] text-earth-500 uppercase tracking-wide truncate">
                {getConversationalTime(session.updatedAt, language)}
            </p>
        </div>
        
        {/* Context Menu Trigger */}
        <button 
            onClick={(e) => { e.stopPropagation(); setOpenMenuSessionId(openMenuSessionId === session.id ? null : session.id); }}
            className={`p-1 rounded hover:bg-earth-200 text-earth-400 hover:text-earth-800 ${openMenuSessionId === session.id ? 'opacity-100 bg-earth-200' : 'opacity-0 group-hover:opacity-100'}`}
        >
             <MoreVertical size={14} />
        </button>

        {/* Context Menu Dropdown */}
        {openMenuSessionId === session.id && (
            <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setOpenMenuSessionId(null); }}></div>
                <div className="absolute right-2 top-8 w-40 bg-white border border-earth-200 rounded-lg shadow-xl z-20 py-1 flex flex-col animate-fade-in">
                    <button 
                        onClick={(e) => { onDeleteSession(session.id, e); setOpenMenuSessionId(null); }}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left"
                    >
                        <Trash2 size={12} /> {TEXTS.deleteMessage[language]}
                    </button>
                    
                    <div className="h-px bg-earth-100 my-1"></div>
                    <div className="px-3 py-1 text-[10px] text-earth-400 font-bold uppercase tracking-wider">{TEXTS.moveTo[language]}</div>
                    
                    <button 
                         onClick={(e) => { e.stopPropagation(); onMoveSession(session.id, undefined); setOpenMenuSessionId(null); }}
                         className="px-3 py-1.5 text-xs text-earth-700 hover:bg-earth-50 w-full text-left truncate"
                    >
                        {TEXTS.unsorted[language]}
                    </button>

                    {folders.map(f => (
                         <button 
                            key={f.id}
                            onClick={(e) => { e.stopPropagation(); onMoveSession(session.id, f.id); setOpenMenuSessionId(null); }}
                            className="px-3 py-1.5 text-xs text-earth-700 hover:bg-earth-50 w-full text-left truncate"
                        >
                            {f.name}
                        </button>
                    ))}
                </div>
            </>
        )}
    </div>
  );

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-earth-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-[280px] bg-earth-100 border-r border-earth-200 z-50 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-earth-200 flex items-center justify-between">
            <h2 className="font-serif font-bold text-earth-800">{TEXTS.sidebarTitle[language]}</h2>
            <button onClick={onClose} className="md:hidden p-1 text-earth-500 hover:text-earth-900">
                <X size={20} />
            </button>
        </div>

        <div className="p-3 grid grid-cols-2 gap-2">
             <button 
                onClick={() => { onNewChat(); if(window.innerWidth < 768) onClose(); }}
                className="flex items-center gap-2 justify-center py-2 px-3 bg-earth-800 text-earth-50 rounded-lg hover:bg-earth-700 transition-colors shadow-sm text-xs font-medium"
            >
                <Plus size={14} strokeWidth={2} />
                {TEXTS.newChat[language]}
            </button>
             <button 
                onClick={() => setShowNewFolderInput(true)}
                className="flex items-center gap-2 justify-center py-2 px-3 bg-white border border-earth-200 text-earth-700 rounded-lg hover:bg-earth-50 transition-colors text-xs font-medium"
            >
                <FolderPlus size={14} strokeWidth={2} />
                {TEXTS.newFolder[language]}
            </button>
        </div>

        {showNewFolderInput && (
            <form onSubmit={handleCreateFolder} className="px-3 pb-2">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        autoFocus
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={TEXTS.folderNamePlaceholder[language]}
                        className="flex-1 text-xs p-2 rounded border border-earth-300 focus:border-clay-400 outline-none"
                    />
                    <button type="submit" className="p-2 bg-clay-500 text-white rounded hover:bg-clay-600"><Plus size={14}/></button>
                    <button type="button" onClick={() => setShowNewFolderInput(false)} className="p-2 text-earth-500 hover:bg-earth-200 rounded"><X size={14}/></button>
                </div>
            </form>
        )}

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
            
            {/* Folders */}
            {folders.map(folder => (
                <div key={folder.id} className="space-y-1">
                    <div 
                        className="flex items-center justify-between px-2 py-1 text-xs font-bold text-earth-500 uppercase tracking-widest cursor-pointer hover:text-earth-800 group"
                        onClick={() => toggleFolder(folder.id)}
                    >
                         <div className="flex items-center gap-1">
                            {expandedFolders.has(folder.id) ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                            <Folder size={12} className="mr-1"/>
                            {folder.name}
                         </div>
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                            className="opacity-0 group-hover:opacity-100 text-earth-300 hover:text-red-400"
                        >
                            <Trash2 size={12}/>
                         </button>
                    </div>
                    {expandedFolders.has(folder.id) && (
                         <div className="pl-2 space-y-1 border-l border-earth-200 ml-2">
                            {sessionsByFolder[folder.id]?.length > 0 ? (
                                sessionsByFolder[folder.id].map(renderSessionItem)
                            ) : (
                                <p className="text-[10px] text-earth-400 italic px-2 py-1">Empty dossier</p>
                            )}
                         </div>
                    )}
                </div>
            ))}

            {/* Unsorted Sessions */}
            <div className="space-y-1">
                <div className="px-2 py-1 text-xs font-bold text-earth-500 uppercase tracking-widest flex items-center gap-2">
                   {folders.length > 0 && TEXTS.unsorted[language]}
                </div>
                {unsortedSessions.map(renderSessionItem)}
            </div>

        </div>
        
        <div className="p-4 border-t border-earth-200 text-[10px] text-earth-400 text-center font-medium uppercase tracking-widest">
            if.emotion v2.1
        </div>
      </div>
    </>
  );
};
