
import React, { useState, useEffect, useRef } from 'react';
import { GenerateContentResponse, Chat } from '@google/genai';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { ExportModal } from './components/ExportModal';
import { createChatSession, sendMessageStream } from './services/gemini';
import { Message, Session, Folder, Role, Language, AppMode, ExportFormat } from './types';
import { TEXTS, INITIAL_SUGGESTIONS } from './constants';
import { jsPDF } from 'jspdf';

const SESSIONS_KEY = 'if.emotion.sessions';
const FOLDERS_KEY = 'if.emotion.folders';
const SETTINGS_KEY = 'if.emotion.settings';

const App: React.FC = () => {
  // Settings & UI State
  const [language, setLanguage] = useState<Language>(Language.EN);
  const [mode, setMode] = useState<AppMode>(AppMode.SIMPLE);
  const [isOffTheRecord, setIsOffTheRecord] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Modal State
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState<{ type: 'full' | 'single', data?: Message } | null>(null);

  // Chat Data
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // --- Initialization & Persistence ---

  // Detect Language Helper
  const detectLanguage = (): Language => {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') return Language.ES;
    if (browserLang === 'fr') return Language.FR;
    return Language.EN;
  };

  // Load initial state
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Load Settings
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.mode) setMode(parsed.mode);
      setLanguage(detectLanguage());
    } else {
      setLanguage(detectLanguage());
    }

    // Load Folders
    const savedFolders = localStorage.getItem(FOLDERS_KEY);
    if (savedFolders) {
        try {
            setFolders(JSON.parse(savedFolders));
        } catch (e) {
            console.error("Failed to parse folders", e);
        }
    }

    // Load Sessions
    const savedSessions = localStorage.getItem(SESSIONS_KEY);
    if (savedSessions) {
      try {
        const parsed: Session[] = JSON.parse(savedSessions).map((s: any) => ({
          ...s,
          updatedAt: new Date(s.updatedAt),
          messages: s.messages.map((m: any) => ({
             ...m,
             timestamp: new Date(m.timestamp)
          }))
        }));
        setSessions(parsed);
        // Load most recent session if available
        if (parsed.length > 0) {
            loadSession(parsed[0].id, parsed);
        } else {
            startNewSession();
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
        startNewSession();
      }
    } else {
      startNewSession();
    }
  }, []);

  // Persist Settings
  useEffect(() => {
    if (isInitialized.current) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode }));
    }
  }, [mode]);

  // Persist Folders
  useEffect(() => {
    if (isInitialized.current) {
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
    }
  }, [folders]);

  // Persist Sessions (Auto-save current messages to session)
  useEffect(() => {
    if (!isInitialized.current || !currentSessionId) return;
    
    // If Off the Record, we DO NOT update the session in storage with new messages
    if (isOffTheRecord) return;

    setSessions(prevSessions => {
        const updatedSessions = prevSessions.map(session => {
            if (session.id === currentSessionId) {
                // Update title based on first user message if still default
                let title = session.title;
                const firstUserMsg = messages.find(m => m.role === Role.USER);
                if (firstUserMsg && (title === 'New Journey' || title === 'Nuevo Viaje' || title === 'Nouveau Voyage')) {
                    title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
                }
                
                return {
                    ...session,
                    messages: messages,
                    title: title,
                    updatedAt: new Date()
                };
            }
            return session;
        });
        
        // Sort by recency
        updatedSessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
        
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updatedSessions));
        return updatedSessions;
    });
  }, [messages, currentSessionId, isOffTheRecord]);


  // --- Session & Folder Logic ---

  const createFolder = (name: string) => {
    const newFolder: Folder = {
        id: Date.now().toString(),
        name
    };
    setFolders(prev => [...prev, newFolder]);
  };

  const deleteFolder = (id: string) => {
    // Ungroup sessions in this folder
    setSessions(prev => prev.map(s => s.folderId === id ? { ...s, folderId: undefined } : s));
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  const moveSessionToFolder = (sessionId: string, folderId: string | undefined) => {
    setSessions(prev => {
        const updated = prev.map(s => s.id === sessionId ? { ...s, folderId } : s);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
        return updated;
    });
  };

  const startNewSession = () => {
    const newId = Date.now().toString();
    const geminiSession = createChatSession();
    setChatSession(geminiSession);
    
    const welcomeMsg: Message = {
        id: 'welcome-' + newId,
        role: Role.MODEL,
        text: TEXTS.welcomeMessage[language],
        timestamp: new Date(),
    };

    const newSession: Session = {
        id: newId,
        title: language === Language.ES ? 'Nuevo Viaje' : language === Language.FR ? 'Nouveau Voyage' : 'New Journey',
        messages: [welcomeMsg],
        updatedAt: new Date()
    };

    if (!isOffTheRecord) {
        setSessions(prev => [newSession, ...prev]);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify([newSession, ...sessions]));
    }
    
    setCurrentSessionId(newId);
    setMessages([welcomeMsg]);
    setIsSidebarOpen(false); // Close sidebar on mobile/action
  };

  const loadSession = (id: string, allSessions = sessions) => {
    const session = allSessions.find(s => s.id === id);
    if (session) {
        setChatSession(createChatSession()); // Reset Gemini context contextually
        setMessages(session.messages);
        setCurrentSessionId(id);
        setIsSidebarOpen(false);
    }
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selection when deleting
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
    
    if (currentSessionId === id) {
        if (newSessions.length > 0) {
            loadSession(newSessions[0].id, newSessions);
        } else {
            startNewSession();
        }
    }
  };

  // --- Message Logic ---

  const handleSendMessage = async (text: string) => {
    if (!chatSession) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const stream = await sendMessageStream(chatSession, text);
      
      const botMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: Role.MODEL,
          text: '',
          timestamp: new Date(),
        },
      ]);

      let fullText = '';
      for await (const chunk of stream) {
        const content = chunk as GenerateContentResponse;
        const textChunk = content.text;
        if (textChunk) {
          fullText += textChunk;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId ? { ...msg, text: fullText } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: Role.MODEL,
          text: TEXTS.errorMessage[language],
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter(msg => msg.id !== id));
  };

  const handleReaction = (id: string, reaction: string) => {
      setMessages(prev => prev.map(msg => {
          if (msg.id === id) {
              const currentReactions = msg.reactions || [];
              if (currentReactions.includes(reaction)) {
                  return { ...msg, reactions: currentReactions.filter(r => r !== reaction) };
              } else {
                  return { ...msg, reactions: [...currentReactions, reaction] };
              }
          }
          return msg;
      }));
  };

  // --- Export Logic ---

  const openExportModal = (type: 'full' | 'single', data?: Message) => {
      setExportTarget({ type, data });
      setExportModalOpen(true);
  };

  const handleExport = (format: ExportFormat) => {
    const timestamp = new Date().toISOString().split('T')[0];
    let fileName = `if-emotion-${timestamp}`;

    if (format === 'pdf') {
        const doc = new jsPDF();
        const lineHeight = 10;
        let y = 15;
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const maxLineWidth = pageWidth - margin * 2;

        doc.setFont("helvetica", "bold");
        doc.text("if.emotion Journal", margin, y);
        y += lineHeight;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Date: ${new Date().toLocaleString()}`, margin, y);
        y += lineHeight * 2;

        const msgsToExport = exportTarget?.type === 'single' && exportTarget.data ? [exportTarget.data] : messages;

        msgsToExport.forEach(msg => {
            const role = msg.role === Role.USER ? 'Me' : 'if.emotion';
            const time = msg.timestamp.toLocaleTimeString();
            
            // Header
            doc.setFont("helvetica", "bold");
            doc.text(`${role} [${time}]`, margin, y);
            y += 7;

            // Body
            doc.setFont("helvetica", "normal");
            const splitText = doc.splitTextToSize(msg.text, maxLineWidth);
            
            // Check page break
            if (y + (splitText.length * 7) > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                y = 15;
            }

            doc.text(splitText, margin, y);
            y += (splitText.length * 7) + 10;
        });

        doc.save(`${fileName}.pdf`);
        setExportModalOpen(false);
        return;
    }

    // Text based formats
    let content = '';
    let mimeType = 'text/plain';

    if (exportTarget?.type === 'single' && exportTarget.data) {
        // Export Single Message
        const m = exportTarget.data;
        fileName += `-message`;
        
        if (format === 'json') {
            content = JSON.stringify(m, null, 2);
            mimeType = 'application/json';
        } else if (format === 'md') {
            content = `**${m.role.toUpperCase()}** (${m.timestamp.toLocaleString()}):\n\n${m.text}`;
            mimeType = 'text/markdown';
        } else {
            content = `[${m.role.toUpperCase()}] ${m.text}`;
        }

    } else {
        // Export Full Chat
        if (format === 'json') {
            const exportData = {
                app: "if.emotion",
                title: sessions.find(s => s.id === currentSessionId)?.title || "Session",
                date: new Date().toISOString(),
                messages: messages
            };
            content = JSON.stringify(exportData, null, 2);
            mimeType = 'application/json';
        } else if (format === 'md') {
            content = `# if.emotion Journal\nDate: ${new Date().toLocaleString()}\n\n---\n\n`;
            content += messages.map(m => `### ${m.role === Role.USER ? 'Me' : 'if.emotion'}\n*${m.timestamp.toLocaleString()}*\n\n${m.text}\n\n---\n`).join('\n');
            mimeType = 'text/markdown';
        } else {
            content = messages.map(m => `[${m.role.toUpperCase()} - ${m.timestamp.toLocaleString()}]: ${m.text}`).join('\n\n');
        }
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setExportModalOpen(false);
  };

  // --- Render ---

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className={`flex h-screen bg-earth-50 text-earth-900 font-sans overflow-hidden`}>
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen || (mode === AppMode.ADVANCED && window.innerWidth >= 768)}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        folders={folders}
        currentSessionId={currentSessionId}
        onSelectSession={loadSession}
        onNewChat={startNewSession}
        onNewFolder={createFolder}
        onDeleteSession={deleteSession}
        onMoveSession={moveSessionToFolder}
        onDeleteFolder={deleteFolder}
        language={language}
      />

      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${mode === AppMode.ADVANCED && window.innerWidth >= 768 ? 'md:ml-[280px]' : ''}`}>
          <Header 
            language={language} 
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            mode={mode}
            onToggleMode={() => setMode(prev => prev === AppMode.SIMPLE ? AppMode.ADVANCED : AppMode.SIMPLE)}
            onExportSession={() => openExportModal('full')}
          />

          <main className="flex-1 overflow-y-auto px-4 md:px-0">
            <div className="max-w-3xl mx-auto py-8">
              {messages.map((msg) => (
                <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    onDelete={handleDeleteMessage}
                    onReact={handleReaction}
                    onExport={() => openExportModal('single', msg)}
                    language={language}
                    mode={mode}
                />
              ))}
              
              {messages.length === 1 && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 px-4 animate-fade-in">
                  {INITIAL_SUGGESTIONS.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(suggestion[language])}
                      className="p-4 text-left rounded-xl bg-white/60 border border-earth-100 hover:border-clay-300 hover:bg-white hover:shadow-sm transition-all duration-300 text-sm text-earth-700 font-medium"
                    >
                      {suggestion[language]}
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                 <div className="flex w-full mb-8 justify-start animate-pulse px-6 md:px-0">
                    <div className="bg-white border border-earth-100 rounded-2xl rounded-tl-sm px-6 py-5 shadow-sm">
                        <div className="flex space-x-2 items-center h-5">
                            <div className="w-1.5 h-1.5 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-earth-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          </main>

          <InputArea 
            language={language} 
            onSend={handleSendMessage} 
            isLoading={isLoading} 
            isOffTheRecord={isOffTheRecord}
            onToggleOffTheRecord={() => setIsOffTheRecord(!isOffTheRecord)}
          />
      </div>

      <ExportModal 
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        onExport={handleExport}
        language={language}
        title={exportTarget?.type === 'single' ? (language === 'en' ? 'Export Message' : language === 'es' ? 'Exportar Mensaje' : 'Exporter Message') : undefined}
      />
    </div>
  );
};

export default App;