import React from 'react';
import { MessageSquare, Plus, Trash2, X } from 'lucide-react';
import { Session } from '../types';
import { formatConversationalTime } from '../utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

export function Sidebar({ 
  isOpen, 
  onClose, 
  sessions, 
  currentSessionId, 
  onSelectSession, 
  onNewChat,
  onDeleteSession 
}: Props) {
  
  // Group sessions
  const groupedSessions = sessions.reduce((acc, session) => {
    // Fallback to current time if updated_at is missing, ensuring session is shown
    const timestamp = session.updated_at ? session.updated_at * 1000 : Date.now();
    const date = new Date(timestamp);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = 'Older';
    if (date.toDateString() === today.toDateString()) key = 'Today';
    else if (date.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const groups = ['Today', 'Yesterday', 'Older'].filter(g => groupedSessions[g]?.length);

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-sergio-900/20 backdrop-blur-sm z-30 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-[280px] bg-sergio-100 border-r border-sergio-200 z-40 
        transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-sergio-200 flex items-center justify-between">
          <h2 className="font-spanish font-bold text-sergio-800 text-lg">Your Journey</h2>
          <button onClick={onClose} className="md:hidden text-sergio-500 hover:text-sergio-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-3">
          <button 
            onClick={() => { onNewChat(); if (window.innerWidth < 768) onClose(); }}
            className="w-full flex items-center gap-2 justify-center py-3 bg-sergio-600 text-white rounded-xl hover:bg-sergio-700 transition-colors shadow-sm font-medium tracking-wide text-sm"
          >
            <Plus size={18} />
            <span>New Session</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-4">
          {sessions.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-sergio-400 text-center px-4">
                 <p className="text-sm">No recorded sessions.</p>
                 <p className="text-xs mt-1 opacity-75">Start a new journey above.</p>
             </div>
          ) : (
             groups.map(group => (
                 <div key={group}>
                     <h3 className="text-[10px] font-bold text-sergio-400 uppercase tracking-widest px-2 mb-2 mt-2">{group}</h3>
                     <div className="space-y-1">
                        {groupedSessions[group].map(session => (
                            <div 
                              key={session.id}
                              className={`
                                group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all
                                ${currentSessionId === session.id 
                                    ? 'bg-white shadow-sm ring-1 ring-sergio-200' 
                                    : 'hover:bg-sergio-200/50 text-sergio-600'
                                }
                              `}
                              onClick={() => { onSelectSession(session.id); if (window.innerWidth < 768) onClose(); }}
                            >
                              <MessageSquare size={16} className={currentSessionId === session.id ? 'text-sergio-500' : 'text-sergio-300'} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-sergio-900' : 'text-sergio-700'}`}>
                                  {session.title}
                                </p>
                                <p className="text-[10px] text-sergio-400 truncate mt-0.5">
                                  {formatConversationalTime(new Date((session.updated_at || Date.now() / 1000) * 1000))}
                                </p>
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}
                                className="opacity-0 group-hover:opacity-100 text-sergio-300 hover:text-red-500 p-1 hover:bg-sergio-100 rounded transition-all"
                                title="Delete Session"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                         ))}
                     </div>
                 </div>
             ))
          )}
        </div>
        
        <div className="p-4 border-t border-sergio-200 bg-sergio-50/50 text-[10px] text-center text-sergio-400 font-mono">
          if.emotion v3.1 // journey
        </div>
      </div>
    </>
  );
}