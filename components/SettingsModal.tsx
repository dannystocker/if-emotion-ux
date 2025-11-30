import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import { UserSettings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  models: string[];
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave, models, selectedModel, onSelectModel }: Props) {
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-sergio-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up border border-sergio-100">
        <div className="p-4 border-b border-sergio-100 flex items-center justify-between bg-sergio-50">
          <h3 className="font-spanish font-bold text-sergio-800">Settings</h3>
          <button onClick={onClose} className="text-sergio-400 hover:text-sergio-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          
          {/* Connection Settings */}
          <div className="space-y-4">
              <h4 className="text-xs font-bold text-sergio-400 uppercase tracking-widest border-b border-sergio-100 pb-2">Connection</h4>
              <div>
                <label className="block text-xs font-bold text-sergio-500 uppercase tracking-wider mb-1">
                  Open WebUI URL
                </label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={e => setFormData({...formData, baseUrl: e.target.value})}
                  placeholder="http://localhost:3000"
                  className="w-full p-2.5 rounded-lg border border-sergio-200 focus:border-sergio-500 focus:ring-1 focus:ring-sergio-500 outline-none font-mono text-sm bg-sergio-50/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-sergio-500 uppercase tracking-wider mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.apiKey}
                  onChange={e => setFormData({...formData, apiKey: e.target.value})}
                  placeholder="sk-..."
                  className="w-full p-2.5 rounded-lg border border-sergio-200 focus:border-sergio-500 focus:ring-1 focus:ring-sergio-500 outline-none font-mono text-sm bg-sergio-50/50"
                />
              </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-4">
               <h4 className="text-xs font-bold text-sergio-400 uppercase tracking-widest border-b border-sergio-100 pb-2">Intelligence</h4>
               <div>
                <label className="block text-xs font-bold text-sergio-500 uppercase tracking-wider mb-1">
                  Active Model
                </label>
                <div className="relative">
                    <select
                        value={selectedModel}
                        onChange={(e) => onSelectModel(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-sergio-200 focus:border-sergio-500 focus:ring-1 focus:ring-sergio-500 outline-none text-sm bg-white appearance-none"
                    >
                        {models.length === 0 && <option value="">No models detected</option>}
                        {models.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    {models.length > 0 && (
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-sergio-400">
                             <RefreshCw size={14} />
                        </div>
                    )}
                </div>
                {models.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1">
                        Could not fetch models. Check your connection settings.
                    </p>
                )}
              </div>
          </div>
        </div>

        <div className="p-4 border-t border-sergio-100 flex justify-end bg-sergio-50/30">
          <button
            onClick={() => { onSave(formData); onClose(); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-sergio-600 text-white rounded-lg hover:bg-sergio-700 transition-all shadow-sm font-medium text-sm"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  );
}