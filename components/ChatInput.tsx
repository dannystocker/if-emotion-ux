
import React, { useState, useRef } from 'react';
import { SendHorizontal, Loader2, Eye, EyeOff } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled: boolean;
  isOffTheRecord: boolean;
  onToggleOffTheRecord: () => void;
}

export function ChatInput({ onSend, isLoading, disabled, isOffTheRecord, onToggleOffTheRecord }: Props) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isLoading && !disabled) {
      onSend(input);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-6 pt-2">
      <div className={`
        relative flex items-end gap-2 p-2 rounded-3xl border shadow-lg 
        transition-all duration-300 focus-within:ring-2 
        ${isOffTheRecord 
            ? 'bg-sergio-50 border-sergio-300 focus-within:ring-sergio-300 focus-within:border-sergio-400' 
            : 'bg-white border-sergio-200 focus-within:ring-sergio-300 focus-within:border-sergio-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={isOffTheRecord ? "Speak freely (not saved)..." : "Write to your future self..."}
          rows={1}
          disabled={disabled || isLoading}
          className="w-full bg-transparent border-0 focus:ring-0 text-sergio-800 placeholder-sergio-400 resize-none py-3 px-4 max-h-[150px] overflow-y-auto font-english"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading || disabled}
          className={`
            p-3 rounded-full flex-shrink-0 mb-1 transition-all duration-200
            ${input.trim() && !isLoading && !disabled
              ? 'bg-sergio-600 text-white hover:bg-sergio-700 shadow-md transform hover:scale-105'
              : 'bg-sergio-100 text-sergio-300'
            }
          `}
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <SendHorizontal size={20} />}
        </button>
      </div>
      
      {/* Privacy Toggle Footer */}
      <div className="flex justify-center mt-3">
        <button 
          onClick={onToggleOffTheRecord}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all
            ${isOffTheRecord 
                ? 'bg-sergio-200 text-sergio-600 hover:bg-sergio-300' 
                : 'bg-sergio-50 text-sergio-400 hover:bg-sergio-100 hover:text-sergio-600'
            }
          `}
        >
          {isOffTheRecord ? <EyeOff size={14} className="text-sergio-600" /> : <Eye size={14} />}
          <span>{isOffTheRecord ? "Save: OFF" : "Save: ON"}</span>
        </button>
      </div>
    </div>
  );
}
