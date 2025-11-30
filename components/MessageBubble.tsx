
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Heart, Leaf, HelpCircle, Download } from 'lucide-react';
import { Role, Message, Language, AppMode } from '../types';
import { TEXTS } from '../constants';
import { getConversationalTime } from '../utils';

interface MessageBubbleProps {
  message: Message;
  onDelete: (id: string) => void;
  onReact: (id: string, reaction: string) => void;
  onExport: (message: Message) => void;
  language: Language;
  mode: AppMode;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
    message, 
    onDelete, 
    onReact,
    onExport,
    language, 
    mode 
}) => {
  const isUser = message.role === Role.USER;
  const isAdvanced = mode === AppMode.ADVANCED;
  const [showActions, setShowActions] = useState(false);

  // Define icons with em sizing to scale with text
  const iconSize = "1.2em"; 
  const strokeWidth = 1.5;

  return (
    <div 
        className={`group flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
    >
      <div className={`relative max-w-[85%] md:max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        
        <div
          className={`
            relative px-6 py-4 shadow-sm text-base leading-relaxed rounded-2xl
            transition-all duration-300
            ${
              isUser
                ? 'bg-clay-600 text-white rounded-tr-sm'
                : 'bg-white border border-earth-100 text-earth-900 rounded-tl-sm'
            }
            ${message.isError ? 'border-red-300 bg-red-50 text-red-800' : ''}
          `}
        >
          <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'prose-stone'}`}>
              <ReactMarkdown>{message.text}</ReactMarkdown>
          </div>

          {/* Reactions Display */}
          {message.reactions && message.reactions.length > 0 && (
              <div className={`absolute -bottom-3 ${isUser ? 'left-0' : 'right-0'} flex -space-x-1`}>
                  {message.reactions.map((r, i) => (
                      <span key={i} className="bg-white border border-earth-200 rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-sm transform hover:scale-110 transition-transform cursor-default">
                          {r === 'heart' ? '❤️' : r === 'reflect' ? '🌿' : '🤔'}
                      </span>
                  ))}
              </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 mt-2 px-1 h-6">
             <span className={`text-[10px] uppercase tracking-wider opacity-50 font-medium ${isUser ? 'text-earth-600' : 'text-earth-400'}`}>
                {isAdvanced ? getConversationalTime(message.timestamp, language) : message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            
            {/* Action Bar */}
            <div className={`flex items-center gap-1 transition-opacity duration-200 ${showActions || (isAdvanced && !isUser) ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Export single message */}
                {isAdvanced && !message.isError && (
                    <button
                        onClick={() => onExport(message)}
                        className="text-earth-400 hover:text-earth-700 p-1 rounded hover:bg-earth-100 transition-colors"
                        title={TEXTS.exportChat[language]}
                    >
                        <Download size={iconSize} strokeWidth={strokeWidth} />
                    </button>
                )}

                {!message.isError && (
                    <button
                        onClick={() => onDelete(message.id)}
                        className="text-earth-400 hover:text-red-400 p-1 rounded hover:bg-red-50 transition-colors"
                        title={TEXTS.deleteMessage[language]}
                    >
                        <Trash2 size={iconSize} strokeWidth={strokeWidth} />
                    </button>
                )}

                {isAdvanced && !isUser && !message.isError && (
                    <div className="flex items-center gap-0.5 pl-1 border-l border-earth-200/50 ml-1">
                        <button 
                            onClick={() => onReact(message.id, 'heart')} 
                            className="p-1 text-earth-400 hover:text-pink-500 hover:bg-pink-50 rounded transition-colors"
                            title={TEXTS.reactHeart[language]}
                        >
                            <Heart size={iconSize} strokeWidth={strokeWidth} />
                        </button>
                        <button 
                            onClick={() => onReact(message.id, 'reflect')} 
                            className="p-1 text-earth-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title={TEXTS.reactReflect[language]}
                        >
                            <Leaf size={iconSize} strokeWidth={strokeWidth} />
                        </button>
                        <button 
                            onClick={() => onReact(message.id, 'question')} 
                            className="p-1 text-earth-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title={TEXTS.reactQuestion[language]}
                        >
                            <HelpCircle size={iconSize} strokeWidth={strokeWidth} />
                        </button>
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};
