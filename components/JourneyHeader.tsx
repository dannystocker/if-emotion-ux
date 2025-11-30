
import React from 'react';
import { Menu, Settings, Download } from 'lucide-react';

interface Props {
  sessionCount: number;
  isOffTheRecord: boolean;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
}

export function JourneyHeader({ 
  sessionCount, 
  isOffTheRecord, 
  onOpenSidebar,
  onOpenSettings,
  onExport
}: Props) {
  return (
    <header className="sticky top-0 z-10 bg-sergio-50/95 backdrop-blur-sm border-b border-sergio-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenSidebar}
            className="p-2 -ml-2 text-sergio-600 hover:bg-sergio-200 rounded-lg transition-colors md:hidden"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex flex-col">
            <h1 className="text-xl font-spanish font-bold text-sergio-700 tracking-tight leading-none">
              if.emotion
            </h1>
            {!isOffTheRecord && (
                <p className="text-[10px] text-sergio-500 font-english uppercase tracking-widest mt-1">
                Session #{sessionCount}
                </p>
            )}
            {isOffTheRecord && (
                <p className="text-[10px] text-red-700 font-english uppercase tracking-widest mt-1 font-bold">
                Off the Record
                </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOffTheRecord && (
              <button
                onClick={onExport}
                className="p-2 text-sergio-500 hover:text-sergio-800 hover:bg-sergio-100 rounded-lg transition-colors"
                title="Export Journey"
              >
                <Download size={20} strokeWidth={1.5} />
              </button>
          )}
          <button
            onClick={onOpenSettings}
            className="p-2 text-sergio-500 hover:text-sergio-800 hover:bg-sergio-100 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
