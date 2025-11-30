
import React from 'react';
import { FileJson, FileText, FileCode, X, File } from 'lucide-react';
import { Language, ExportFormat } from '../types';
import { TEXTS } from '../constants';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat) => void;
  language: Language;
  title?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport, language, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-earth-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full border border-earth-100 overflow-hidden animate-slide-up">
        <div className="p-4 border-b border-earth-100 flex items-center justify-between bg-earth-50/50">
            <h3 className="font-serif font-bold text-earth-800">{title || TEXTS.exportTitle[language]}</h3>
            <button onClick={onClose} className="p-1 text-earth-400 hover:text-earth-800 transition-colors">
                <X size={18} />
            </button>
        </div>
        
        <div className="p-6 flex flex-col gap-3">
            <p className="text-sm text-earth-600 mb-2">{TEXTS.downloadAs[language]}:</p>
            
            <button 
                onClick={() => onExport('pdf')}
                className="flex items-center gap-3 p-3 rounded-xl border border-earth-200 hover:border-clay-400 hover:bg-clay-50 transition-all group"
            >
                <div className="bg-earth-100 text-earth-600 p-2 rounded-lg group-hover:bg-clay-200 group-hover:text-clay-800 transition-colors">
                    <File size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-semibold text-earth-800">PDF</span>
                    <span className="block text-xs text-earth-500">Document</span>
                </div>
            </button>

            <button 
                onClick={() => onExport('md')}
                className="flex items-center gap-3 p-3 rounded-xl border border-earth-200 hover:border-clay-400 hover:bg-clay-50 transition-all group"
            >
                <div className="bg-earth-100 text-earth-600 p-2 rounded-lg group-hover:bg-clay-200 group-hover:text-clay-800 transition-colors">
                    <FileText size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-semibold text-earth-800">Markdown</span>
                    <span className="block text-xs text-earth-500">Text format</span>
                </div>
            </button>

            <button 
                onClick={() => onExport('json')}
                className="flex items-center gap-3 p-3 rounded-xl border border-earth-200 hover:border-clay-400 hover:bg-clay-50 transition-all group"
            >
                <div className="bg-earth-100 text-earth-600 p-2 rounded-lg group-hover:bg-clay-200 group-hover:text-clay-800 transition-colors">
                    <FileCode size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-semibold text-earth-800">JSON</span>
                    <span className="block text-xs text-earth-500">Data format</span>
                </div>
            </button>
            
             <button 
                onClick={() => onExport('txt')}
                className="flex items-center gap-3 p-3 rounded-xl border border-earth-200 hover:border-clay-400 hover:bg-clay-50 transition-all group"
            >
                <div className="bg-earth-100 text-earth-600 p-2 rounded-lg group-hover:bg-clay-200 group-hover:text-clay-800 transition-colors">
                    <FileText size={20} strokeWidth={1.5} />
                </div>
                <div className="text-left">
                    <span className="block text-sm font-semibold text-earth-800">Plain Text</span>
                    <span className="block text-xs text-earth-500">Simple text</span>
                </div>
            </button>
        </div>
      </div>
    </div>
  );
};