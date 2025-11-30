import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Role, Message, Language } from '../types';
import { formatConversationalTime, detectLanguage } from '../utils';
import { MessageActions } from './MessageActions';

interface Props {
  message: Message;
  onDelete: (id: string) => void;
}

export function ChatMessage({ message, onDelete }: Props) {
  const isUser = message.role === Role.USER;
  const language = detectLanguage(message.content);
  const fontClass = language === Language.ES ? 'font-spanish' : 'font-english';

  return (
    <div className={`group flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div className={`relative max-w-[85%] md:max-w-[70%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Message Bubble */}
        <div className={`
          relative px-6 py-4 rounded-message shadow-sm text-base leading-relaxed
          transition-all duration-200 hover:shadow-md
          ${isUser 
            ? 'bg-sergio-200 text-sergio-900 rounded-tr-sm' 
            : 'bg-sergio-300 text-sergio-900 rounded-tl-sm'
          }
        `}>
          <div className={`prose prose-sm max-w-none prose-p:my-2 prose-headings:text-sergio-800 ${fontClass}`}>
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {/* Meta Info & Actions */}
        <div className="flex items-center gap-3 mt-1.5 px-2 h-6">
          <time className="text-xs text-sergio-500 font-english">
            {formatConversationalTime(message.timestamp)}
          </time>
          
          <MessageActions messageId={message.id} onDelete={onDelete} />
        </div>

      </div>
    </div>
  );
}
