import React from 'react';
import { Menu, Settings, Download } from 'lucide-react';
// Export button v2
import { OffTheRecordToggle } from './OffTheRecordToggle';

interface Props {
  sessionCount: number;
  isOffTheRecord: boolean;
  onToggleOffTheRecord: () => void;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onOpenExport: () => void;
}

export function JourneyHeader({
  sessionCount,
  isOffTheRecord,
  onToggleOffTheRecord,
  onOpenSidebar,
  onOpenSettings,
  onOpenExport
}: Props) {
  return (
    <header className="sticky top-0 z-10 bg-sergio-50/95 backdrop-blur-sm border-b border-sergio-200 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenSidebar}
            className="p-2 text-sergio-600 hover:bg-sergio-200 rounded-lg transition-colors md:hidden"
          >
            <Menu size={20} />
          </button>
          
          <div>
            <h1 className="text-xl font-spanish font-bold text-sergio-700 tracking-tight">
              if.emotion
            </h1>
            <p className="text-xs text-sergio-500 font-english">
              {isOffTheRecord ? 'Private Session' : `Session #${sessionCount} with Sergio`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <OffTheRecordToggle
            enabled={isOffTheRecord}
            onToggle={onToggleOffTheRecord}
          />
          <button
            onClick={onOpenExport}
            className="p-2 text-sergio-400 hover:text-sergio-700 transition-colors"
            title="Export conversation"
            data-testid="export-btn"
          >
            <Download size={20} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-2 text-sergio-400 hover:text-sergio-700 transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
