import React, { useState, useEffect, useRef } from 'react';
import { OpenWebUIClient } from './services/openwebui';
import { Session, Message, Role, UserSettings } from './types';
import { generateId } from './utils';

// Components
import { JourneyHeader } from './components/JourneyHeader';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SettingsModal } from './components/SettingsModal';

const App: React.FC = () => {
  // Config
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('if.emotion.settings');
    return saved ? JSON.parse(saved) : {
      baseUrl: 'http://85.239.243.227:8080',
      apiKey: 'sk-5339243764b840e69188d672802082f4' // Default from prompt
    };
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const clientRef = useRef(new OpenWebUIClient(settings));

  // State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isOffTheRecord, setIsOffTheRecord] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize
  useEffect(() => {
    clientRef.current = new OpenWebUIClient(settings);
    localStorage.setItem('if.emotion.settings', JSON.stringify(settings));
    loadModels();
    if (!isOffTheRecord) {
      loadSessions();
    }
  }, [settings]);

  // Load Models
  const loadModels = async () => {
    const models = await clientRef.current.getModels();
    setAvailableModels(models);
  };

  // Load Sessions
  const loadSessions = async () => {
    try {
      const list = await clientRef.current.getChats();
      setSessions(list);
      if (list.length > 0 && !currentSessionId && !isOffTheRecord) {
         loadSession(list[0].id);
      } else if (list.length === 0 && !isOffTheRecord) {
         // Create initial persistent session if none exist
         startNewSession();
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  };

  // Load Specific Session
  const loadSession = async (id: string) => {
    try {
      setIsLoading(true);
      const hist = await clientRef.current.getChatHistory(id);
      setMessages(hist);
      setCurrentSessionId(id);
      setIsOffTheRecord(false);
      setIsSidebarOpen(false);
    } catch (e) {
      console.error("Failed to load chat", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Start New Session (Persistent)
  const startNewSession = async () => {
    try {
      setIsLoading(true);
      const title = `Journey ${new Date().toLocaleDateString()}`;
      const session = await clientRef.current.createChat(title);
      setSessions(prev => [session, ...prev]);
      setCurrentSessionId(session.id);
      setMessages([]);
      setIsOffTheRecord(false);
      setIsSidebarOpen(false);
    } catch (e) {
      console.error("Failed to create session", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle Privacy Mode
  const handleTogglePrivacy = () => {
    if (!isOffTheRecord) {
      // Switching TO Privacy Mode
      setIsOffTheRecord(true);
      setCurrentSessionId(null);
      setMessages([{
        id: generateId(),
        role: Role.ASSISTANT,
        content: "We are now off the record. Nothing we say here will be saved.",
        timestamp: new Date()
      }]);
    } else {
      // Switching back to Normal
      if (sessions.length > 0) {
        loadSession(sessions[0].id);
      } else {
        startNewSession();
      }
    }
  };

  // Send Message
  const handleSend = async (text: string) => {
    const userMsg: Message = {
      id: generateId(),
      role: Role.USER,
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // If persistent, save user message first (optimistic UI handles display)
      if (!isOffTheRecord && currentSessionId) {
         await clientRef.current.addMessageToChat(currentSessionId, userMsg).catch(e => console.warn("Failed to persist user msg", e));
      }

      // Select model
      const model = availableModels[0] || 'gpt-3.5-turbo'; // Fallback

      // Stream response
      const streamReader = await clientRef.current.sendMessage(
        currentSessionId,
        text,
        messages, // Context
        model,
        isOffTheRecord
      );

      const botMsgId = generateId();
      const botMsg: Message = {
        id: botMsgId,
        role: Role.ASSISTANT,
        content: '',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await streamReader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        // OpenWebUI streaming format parsing depends on endpoint type (OpenAI compatible usually sends "data: JSON")
        // Simple parser for standard SSE lines:
        const lines = chunk.split('\n');
        for (const line of lines) {
           if (line.startsWith('data: ')) {
             const dataStr = line.slice(6);
             if (dataStr === '[DONE]') continue;
             try {
               const data = JSON.parse(dataStr);
               const content = data.choices?.[0]?.delta?.content || '';
               if (content) {
                 fullContent += content;
                 setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: fullContent } : m));
               }
             } catch (e) {
               // Ignore parse errors for partial chunks
             }
           }
        }
      }
      
      // If persistent, save bot message
      if (!isOffTheRecord && currentSessionId) {
         const completedBotMsg = { ...botMsg, content: fullContent };
         await clientRef.current.addMessageToChat(currentSessionId, completedBotMsg).catch(e => console.warn("Failed to persist bot msg", e));
         // Refresh session list to update timestamp
         loadSessions();
      }

    } catch (e) {
      console.error("Error sending message", e);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: Role.SYSTEM,
        content: "The connection wavered. Please try again.",
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Message (Silent)
  const handleDeleteMessage = async (msgId: string) => {
    // Optimistic delete
    setMessages(prev => prev.filter(m => m.id !== msgId));
    
    if (!isOffTheRecord && currentSessionId) {
      try {
        await clientRef.current.deleteMessage(currentSessionId, msgId);
      } catch (e) {
        console.error("Silent deletion failed remotely", e);
      }
    }
  };
  
  // Delete Session
  const handleDeleteSession = async (id: string) => {
     if (confirm("Are you sure you want to let this journey go?")) {
         await clientRef.current.deleteChat(id);
         setSessions(prev => prev.filter(s => s.id !== id));
         if (currentSessionId === id) {
             const remaining = sessions.filter(s => s.id !== id);
             if (remaining.length > 0) loadSession(remaining[0].id);
             else startNewSession();
         }
     }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex h-screen bg-sergio-50 overflow-hidden">
      
      {/* Sidebar for Persistent Mode */}
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={loadSession}
        onNewChat={startNewSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main Content */}
      <div className={`flex-1 flex flex-col h-full transition-all duration-300 ${isSidebarOpen ? 'md:ml-[280px]' : ''}`}>
        <JourneyHeader 
          sessionCount={sessions.length}
          isOffTheRecord={isOffTheRecord}
          onToggleOffTheRecord={handleTogglePrivacy}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto py-8 px-4">
            {messages.map(msg => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onDelete={handleDeleteMessage} 
              />
            ))}
            
            {/* Thinking Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-sergio-400 text-sm animate-pulse ml-4 font-english">
                <div className="w-2 h-2 bg-sergio-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-sergio-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-sergio-400 rounded-full animate-bounce delay-200" />
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </main>

        <ChatInput 
          onSend={handleSend} 
          isLoading={isLoading} 
          disabled={availableModels.length === 0 && !isOffTheRecord} // Only disable if no connection and trying to save
        />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(s) => { setSettings(s); }}
      />
    </div>
  );
};

export default App;
