
import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Loader2 } from 'lucide-react';
import { Language } from '../types';
import { TEXTS } from '../constants';

interface InputAreaProps {
  language: Language;
  onSend: (text: string) => void;
  isLoading: boolean;
  isOffTheRecord: boolean;
  onToggleOffTheRecord: () => void;
}

export const InputArea: React.FC<InputAreaProps> = ({ language, onSend, isLoading, isOffTheRecord, onToggleOffTheRecord }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  // Focus input on load
  useEffect(() => {
      textareaRef.current?.focus();
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-6 pt-2">
      <div className={`
        relative flex items-end gap-2 rounded-3xl shadow-lg border p-2 transition-all duration-300 focus-within:shadow-xl
        ${isOffTheRecord ? 'bg-earth-50 border-earth-200 shadow-none' : 'bg-white border-earth-100 shadow-earth-200/50'}
      `}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={TEXTS.inputPlaceholder[language]}
          rows={1}
          disabled={isLoading}
          className="w-full bg-transparent border-0 focus:ring-0 text-earth-800 placeholder-earth-400 resize-none py-3 px-4 max-h-[150px] overflow-y-auto"
          style={{ minHeight: '48px' }}
        />
        <button
          onClick={() => handleSubmit()}
          disabled={!input.trim() || isLoading}
          className={`
            p-3 rounded-full flex-shrink-0 mb-1 transition-all duration-200 flex items-center justify-center
            ${
              input.trim() && !isLoading
                ? 'bg-earth-800 text-earth-50 hover:bg-earth-700 shadow-md'
                : 'bg-earth-100 text-earth-300 cursor-not-allowed'
            }
          `}
          aria-label={TEXTS.sendButton[language]}
        >
          {isLoading ? (
              <Loader2 className="animate-spin" size={20} strokeWidth={1.5} />
          ) : (
              <SendHorizontal size={20} strokeWidth={1.5} />
          )}
        </button>
      </div>
      
      <div className="flex justify-center mt-3">
          <button 
              onClick={onToggleOffTheRecord}
              className={`
                text-[10px] font-medium uppercase tracking-widest transition-all duration-300 flex items-center gap-2 px-3 py-1 rounded-full cursor-pointer hover:bg-earth-200/50
                ${isOffTheRecord ? 'text-earth-400' : 'text-clay-600'}
              `}
          >
              <span className={`w-2 h-2 rounded-full ${isOffTheRecord ? 'bg-earth-400' : 'bg-clay-500 animate-pulse'}`}></span>
              {isOffTheRecord ? TEXTS.saveOff[language] : TEXTS.saveOn[language]}
          </button>
      </div>
    </div>
  );
};