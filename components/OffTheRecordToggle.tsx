import React from 'react';
import { EyeOff, Eye } from 'lucide-react';

interface Props {
  enabled: boolean;
  onToggle: () => void;
}

export function OffTheRecordToggle({ enabled, onToggle }: Props) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onToggle}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300
          ${enabled 
            ? 'bg-privacy-active text-white hover:bg-red-900' 
            : 'bg-white text-sergio-600 border border-sergio-300 hover:bg-sergio-50'
          }
        `}
        title={enabled ? "Privacy Mode Active" : "Enable Privacy Mode"}
      >
        {enabled ? <EyeOff size={16} /> : <Eye size={16} />}
        <span className="text-sm font-medium">
          {enabled ? 'Off the Record' : 'Normal Mode'}
        </span>
      </button>

      <div className={`
        text-xs text-sergio-600 mt-2 text-center transition-all duration-300 overflow-hidden
        ${enabled ? 'opacity-100 max-h-10' : 'opacity-0 max-h-0'}
      `}>
        Not saved to history
      </div>
    </div>
  );
}
