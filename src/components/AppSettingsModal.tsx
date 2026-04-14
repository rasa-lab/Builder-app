import React, { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSettingsModal({ isOpen, onClose }: AppSettingsModalProps) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem('xbuilder_api_keys');
      if (storedKeys) {
        const parsed = JSON.parse(storedKeys);
        if (parsed.theme) {
          setTheme(parsed.theme);
        }
      }
    } catch (e) {
      console.error("Failed to parse stored keys", e);
    }
  }, [isOpen]);

  const handleSave = () => {
    try {
      const storedKeys = localStorage.getItem('xbuilder_api_keys');
      let keys: any = {};
      if (storedKeys) {
        keys = JSON.parse(storedKeys);
      }
      keys = { ...keys, theme };
      localStorage.setItem('xbuilder_api_keys', JSON.stringify(keys));
      
      if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    } catch (e) {
      console.error("Failed to save theme", e);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b]">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold">
            <Settings size={18} className="text-blue-500" />
            Pengaturan Aplikasi
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Tema</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  Dark
                </button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  Light
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800 bg-[#121214] flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center gap-2"
          >
            Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
