import React from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  messageId: string;
  onDelete: (id: string) => void;
}

export function MessageActions({ messageId, onDelete }: Props) {
  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center">
      <button
        onClick={() => onDelete(messageId)}
        className="p-1.5 rounded-full hover:bg-sergio-200 text-sergio-400 hover:text-red-700 transition-colors"
        title="Remove without trace"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
