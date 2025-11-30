
import React from 'react';
import { Menu, ToggleRight, ToggleLeft, Download } from 'lucide-react';
import { Language, AppMode } from '../types';
import { TEXTS } from '../constants';

interface HeaderProps {
  language: Language;
  onToggleSidebar: () => void;
  mode: AppMode;
  onToggleMode: () => void;
  onExportSession: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  language, 
  onToggleSidebar,
  mode,
  onToggleMode,
  onExportSession
}) => {
  const isAdvanced = mode === AppMode.ADVANCED;

  return (
    <header className="sticky top-0 z-10 bg-earth-50/90 backdrop-blur-md border-b border-earth-200/50 px-4 md:px-6 py-3 transition-all duration-300">
      <div className="flex items-center justify-between">
        {/* Left Side: Sidebar Toggle & Branding */}
        <div className="flex items-center gap-3">
          {isAdvanced && (
            <button 
                onClick={onToggleSidebar}
                className="p-2 -ml-2 text-earth-600 hover:text-earth-900 hover:bg-earth-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Toggle Sidebar"
            >
                <Menu size={20} strokeWidth={1.5} />
            </button>
          )}

          <div className="flex flex-col">
            <h1 className="font-serif text-xl md:text-2xl font-bold text-earth-900 tracking-tight flex items-center gap-2">
              {TEXTS.appTitle[language]}
              {isAdvanced && <span className="text-[10px] bg-earth-200 text-earth-700 px-1.5 py-0.5 rounded uppercase tracking-widest font-sans font-semibold">Advanced</span>}
            </h1>
            <p className="hidden sm:block text-[10px] md:text-xs text-earth-500 font-medium tracking-widest uppercase">
              {TEXTS.appSubtitle[language]}
            </p>
          </div>
        </div>

        {/* Right Side: Controls */}
        <div className="flex items-center gap-2 md:gap-4">
            
            {/* Global Export Button (Advanced only) */}
            {isAdvanced && (
               <button
                 onClick={onExportSession}
                 className="p-2 text-earth-600 hover:text-earth-900 hover:bg-earth-100 rounded-lg transition-colors"
                 title={TEXTS.exportChat[language]}
               >
                 <Download size={20} strokeWidth={1.5} />
               </button>
            )}

           {/* Mode Toggle - Explicit */}
           <button 
              onClick={onToggleMode}
              className="flex items-center gap-2 px-2 py-1 hover:bg-earth-100 rounded-lg transition-colors group"
              title={isAdvanced ? "Switch to Simple Mode" : "Switch to Advanced Mode"}
          >
              <span className="text-[10px] font-bold text-earth-700 uppercase tracking-wider hidden sm:inline">{isAdvanced ? TEXTS.advancedMode[language] : TEXTS.simpleMode[language]}</span>
              {isAdvanced ? <ToggleRight size={24} strokeWidth={1.5} className="text-clay-600"/> : <ToggleLeft size={24} strokeWidth={1.5} className="text-earth-400"/>}
          </button>

        </div>
      </div>
    </header>
  );
};