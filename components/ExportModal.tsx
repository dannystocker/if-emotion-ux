import React from 'react';
import { FileText, FileCode, X, File } from 'lucide-react';
import { ExportFormat } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-sergio-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-sergio-100 overflow-hidden animate-slide-up">
        <div className="p-4 border-b border-sergio-100 flex items-center justify-between bg-sergio-50">
            <h3 className="font-spanish font-bold text-sergio-800">Export Conversation</h3>
            <button onClick={onClose} className="p-1 text-sergio-400 hover:text-sergio-800 transition-colors">
                <X size={18} />
            </button>
        </div>

        <div className="p-6 flex flex-col gap-3">
            <p className="text-sm text-sergio-600 mb-2">Download as:</p>

            <button
                onClick={() => onExport('pdf')}
                className="flex items-center gap-3 p-3 rounded-xl border border-sergio-200 hover:border-sergio-400 hover:bg-sergio-50 transition-all group"
            >
                <div className="bg-sergio-100 text-sergio-600 p-2 rounded-lg group-hover:bg-sergio-200 group-hover:text-sergio-800 transition-colors">
                    <File size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-semibold text-sergio-800">PDF</span>
                    <span className="block text-xs text-sergio-500">Document</span>
                </div>
            </button>

            <button
                onClick={() => onExport('md')}
                className="flex items-center gap-3 p-3 rounded-xl border border-sergio-200 hover:border-sergio-400 hover:bg-sergio-50 transition-all group"
            >
                <div className="bg-sergio-100 text-sergio-600 p-2 rounded-lg group-hover:bg-sergio-200 group-hover:text-sergio-800 transition-colors">
                    <FileText size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-semibold text-sergio-800">Markdown</span>
                    <span className="block text-xs text-sergio-500">Text format</span>
                </div>
            </button>

            <button
                onClick={() => onExport('json')}
                className="flex items-center gap-3 p-3 rounded-xl border border-sergio-200 hover:border-sergio-400 hover:bg-sergio-50 transition-all group"
            >
                <div className="bg-sergio-100 text-sergio-600 p-2 rounded-lg group-hover:bg-sergio-200 group-hover:text-sergio-800 transition-colors">
                    <FileCode size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-semibold text-sergio-800">JSON</span>
                    <span className="block text-xs text-sergio-500">Data format</span>
                </div>
            </button>

             <button
                onClick={() => onExport('txt')}
                className="flex items-center gap-3 p-3 rounded-xl border border-sergio-200 hover:border-sergio-400 hover:bg-sergio-50 transition-all group"
            >
                <div className="bg-sergio-100 text-sergio-600 p-2 rounded-lg group-hover:bg-sergio-200 group-hover:text-sergio-800 transition-colors">
                    <FileText size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-semibold text-sergio-800">Plain Text</span>
                    <span className="block text-xs text-sergio-500">Simple text</span>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};