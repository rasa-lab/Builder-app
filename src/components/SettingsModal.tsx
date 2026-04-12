import React, { useState, useEffect } from 'react';
import { X, Save, KeyRound, Github } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [keys, setKeys] = useState({
    gemini: '',
    openrouter: '',
    grok: '',
    github: ''
  });

  useEffect(() => {
    // Load keys from local storage on mount
    const storedKeys = localStorage.getItem('xbuilder_api_keys');
    if (storedKeys) {
      try {
        setKeys(JSON.parse(storedKeys));
      } catch (e) {
        console.error("Failed to parse stored keys");
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('xbuilder_api_keys', JSON.stringify(keys));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b]">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold">
            <KeyRound size={18} className="text-blue-500" />
            API Configuration
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Gemini API Key</label>
            <input 
              type="password" 
              value={keys.gemini}
              onChange={(e) => setKeys({...keys, gemini: e.target.value})}
              placeholder="AIzaSy..."
              className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
            <p className="text-xs text-zinc-500">Leave empty to use the default system key.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">OpenRouter API Key</label>
            <input 
              type="password" 
              value={keys.openrouter}
              onChange={(e) => setKeys({...keys, openrouter: e.target.value})}
              placeholder="sk-or-v1-..."
              className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-300">Grok API Key (xAI)</label>
            <input 
              type="password" 
              value={keys.grok}
              onChange={(e) => setKeys({...keys, grok: e.target.value})}
              placeholder="xai-..."
              className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>

          <div className="space-y-2 pt-4 border-t border-zinc-800">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Github size={14} className="text-zinc-400" />
              GitHub Personal Access Token
            </label>
            <input 
              type="password" 
              value={keys.github}
              onChange={(e) => setKeys({...keys, github: e.target.value})}
              placeholder="ghp_..."
              className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all text-sm"
            />
            <p className="text-xs text-zinc-500">Required to upload code directly to your GitHub repositories.</p>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-[#18181b] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
