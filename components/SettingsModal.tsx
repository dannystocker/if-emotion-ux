import React, { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { UserSettings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

export function SettingsModal({ isOpen, onClose, settings, onSave }: Props) {
  const [formData, setFormData] = useState(settings);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-sergio-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slide-up">
        <div className="p-4 border-b border-sergio-100 flex items-center justify-between bg-sergio-50">
          <h3 className="font-spanish font-bold text-sergio-800">Settings</h3>
          <button onClick={onClose} className="text-sergio-400 hover:text-sergio-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Advanced Mode Toggle */}
          <div className="flex items-center justify-between p-3 bg-sergio-50 rounded-xl border border-sergio-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${formData.advancedMode ? 'bg-sergio-500 text-white' : 'bg-sergio-200 text-sergio-500'}`}>
                <Sparkles size={18} />
              </div>
              <div>
                <p className="font-bold text-sergio-800 text-sm">Personality DNA</p>
                <p className="text-xs text-sergio-500">Enable Sergio's deep memory</p>
              </div>
            </div>
            <button
              onClick={() => setFormData({...formData, advancedMode: !formData.advancedMode})}
              className={`relative w-12 h-6 rounded-full transition-colors ${formData.advancedMode ? 'bg-sergio-500' : 'bg-sergio-300'}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.advancedMode ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-sergio-500 uppercase tracking-wider mb-1">
              API URL
            </label>
            <input
              type="text"
              value={formData.baseUrl}
              onChange={e => setFormData({...formData, baseUrl: e.target.value})}
              placeholder="http://localhost:3000"
              className="w-full p-2 rounded-lg border border-sergio-200 focus:border-sergio-500 focus:ring-1 focus:ring-sergio-500 outline-none font-mono text-sm"
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
              className="w-full p-2 rounded-lg border border-sergio-200 focus:border-sergio-500 focus:ring-1 focus:ring-sergio-500 outline-none font-mono text-sm"
            />
          </div>
        </div>

        <div className="p-4 border-t border-sergio-100 flex justify-end">
          <button
            onClick={() => { onSave(formData); onClose(); }}
            className="flex items-center gap-2 px-4 py-2 bg-sergio-600 text-white rounded-lg hover:bg-sergio-700 transition-colors"
          >
            <Save size={16} />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
}
