import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, Loader2 } from 'lucide-react';

interface Props {
  onSend: (text: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: Props) {
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
        relative flex items-end gap-2 p-2 rounded-3xl bg-white border border-sergio-200 shadow-lg 
        transition-all duration-300 focus-within:ring-2 focus-within:ring-sergio-300 focus-within:border-sergio-400
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Write to your future self..."
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
      <p className="text-center text-[10px] text-sergio-400 mt-2 font-english">
        Private. Secure. For your journey.
      </p>
    </div>
  );
}
