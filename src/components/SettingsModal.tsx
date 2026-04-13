import React, { useState, useEffect } from 'react';
import { X, Save, KeyRound, Github } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [keys, setKeys] = useState({
    gemini: '',
    openai: '',
    openrouter: '',
    grok: '',
    github: '',
    customEndpoint: '',
    enableOpenAI: false,
    enableOpenRouter: false,
    enableGrok: false,
    enableDeepSeek: false,
    enableQwen: false,
    enableCustom: false,
    deepseek: '',
    qwen: '',
    theme: 'dark'
  });

  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    // Load keys from local storage on mount
    try {
      const storedKeys = localStorage.getItem('xbuilder_api_keys');
      if (storedKeys) {
        setKeys(JSON.parse(storedKeys));
      }
    } catch (e) {
      console.error("Failed to parse stored keys", e);
    }
  }, [isOpen]);

  const handleSave = () => {
    try {
      localStorage.setItem('xbuilder_api_keys', JSON.stringify(keys));
      window.dispatchEvent(new Event('api_keys_updated'));
      // Apply theme
      if (keys.theme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    } catch (e) {
      console.error("Failed to save keys", e);
    }
    onClose();
  };

  const handleAdminUnlock = () => {
    if (adminPassword === '926285638382789282786527827') {
      setIsAdminUnlocked(true);
      setAdminError('');
    } else {
      setAdminError('Password salah');
    }
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
          {/* Theme Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Tema</label>
              <div className="flex gap-2">
                <button 
                  onClick={() => setKeys({...keys, theme: 'dark'})}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${keys.theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  Dark
                </button>
                <button 
                  onClick={() => setKeys({...keys, theme: 'light'})}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${keys.theme === 'light' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                >
                  Light
                </button>
              </div>
            </div>
          </div>

          {/* Admin Panel */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <label className="text-sm font-medium text-zinc-300">Admin Panel</label>
            {!isAdminUnlocked ? (
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="flex-1 bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
                <button 
                  onClick={handleAdminUnlock}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all active:scale-95"
                >
                  Buka
                </button>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                <div className="text-xs font-semibold text-blue-400 mb-2">ADMIN PANEL TERBUKA</div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => alert('Fitur ini sedang dalam pengembangan.')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 text-left active:scale-95 transition-transform">PROJECT</button>
                  <button onClick={() => alert('Fitur ini sedang dalam pengembangan.')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 text-left active:scale-95 transition-transform">CONVERT</button>
                  <button onClick={() => alert('Fitur ini sedang dalam pengembangan.')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 text-left active:scale-95 transition-transform">DEPLOY (Coming Soon)</button>
                  <button onClick={() => alert('Fitur ini sedang dalam pengembangan.')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 text-left active:scale-95 transition-transform">LEADERBOARD</button>
                  <button onClick={() => alert('Fitur ini sedang dalam pengembangan.')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 text-left active:scale-95 transition-transform">GROUP</button>
                  <button onClick={() => alert('Fitur ini sedang dalam pengembangan.')} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-zinc-300 text-left active:scale-95 transition-transform">CUSTOMER SERVICE</button>
                </div>
              </div>
            )}
            {adminError && <p className="text-xs text-red-400 mt-1">{adminError}</p>}
          </div>

          <div className="space-y-2 pt-4 border-t border-zinc-800">
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

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Aktifkan API OpenAI?</label>
              <button
                onClick={() => setKeys({...keys, enableOpenAI: !keys.enableOpenAI})}
                className={`w-10 h-5 rounded-full transition-colors relative ${keys.enableOpenAI ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${keys.enableOpenAI ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>
            {keys.enableOpenAI && (
              <div className="space-y-2 mt-2">
                <label className="text-sm font-medium text-zinc-300">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={keys.openai || ''}
                  onChange={(e) => setKeys({...keys, openai: e.target.value})}
                  placeholder="sk-proj-..."
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Aktifkan API OpenRouter?</label>
              <button
                onClick={() => setKeys({...keys, enableOpenRouter: !keys.enableOpenRouter})}
                className={`w-10 h-5 rounded-full transition-colors relative ${keys.enableOpenRouter ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${keys.enableOpenRouter ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>
            {keys.enableOpenRouter && (
              <div className="space-y-2 mt-2">
                <label className="text-sm font-medium text-zinc-300">OpenRouter API Key</label>
                <input 
                  type="password" 
                  value={keys.openrouter}
                  onChange={(e) => setKeys({...keys, openrouter: e.target.value})}
                  placeholder="sk-or-v1-..."
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Aktifkan API Grok (xAI)?</label>
              <button
                onClick={() => setKeys({...keys, enableGrok: !keys.enableGrok})}
                className={`w-10 h-5 rounded-full transition-colors relative ${keys.enableGrok ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${keys.enableGrok ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>
            {keys.enableGrok && (
              <div className="space-y-2 mt-2">
                <label className="text-sm font-medium text-zinc-300">Grok API Key (xAI)</label>
                <input 
                  type="password" 
                  value={keys.grok}
                  onChange={(e) => setKeys({...keys, grok: e.target.value})}
                  placeholder="xai-..."
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Aktifkan API DeepSeek?</label>
              <button
                onClick={() => setKeys({...keys, enableDeepSeek: !keys.enableDeepSeek})}
                className={`w-10 h-5 rounded-full transition-colors relative ${keys.enableDeepSeek ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${keys.enableDeepSeek ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>
            {keys.enableDeepSeek && (
              <div className="space-y-2 mt-2">
                <label className="text-sm font-medium text-zinc-300">DeepSeek API Key</label>
                <input 
                  type="password" 
                  value={keys.deepseek || ''}
                  onChange={(e) => setKeys({...keys, deepseek: e.target.value})}
                  placeholder="sk-..."
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Aktifkan API Qwen?</label>
              <button
                onClick={() => setKeys({...keys, enableQwen: !keys.enableQwen})}
                className={`w-10 h-5 rounded-full transition-colors relative ${keys.enableQwen ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${keys.enableQwen ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>
            {keys.enableQwen && (
              <div className="space-y-2 mt-2">
                <label className="text-sm font-medium text-zinc-300">Qwen API Key</label>
                <input 
                  type="password" 
                  value={keys.qwen || ''}
                  onChange={(e) => setKeys({...keys, qwen: e.target.value})}
                  placeholder="sk-..."
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">Aktifkan Custom API Endpoint?</label>
              <button
                onClick={() => setKeys({...keys, enableCustom: !keys.enableCustom})}
                className={`w-10 h-5 rounded-full transition-colors relative ${keys.enableCustom ? 'bg-blue-600' : 'bg-zinc-700'}`}
              >
                <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${keys.enableCustom ? 'translate-x-5.5' : 'translate-x-1'}`} />
              </button>
            </div>
            {keys.enableCustom && (
              <div className="space-y-2 mt-2">
                <label className="text-sm font-medium text-zinc-300">Custom API Endpoint (Puter.js / OpenAI Compatible)</label>
                <input 
                  type="text" 
                  value={keys.customEndpoint || ''}
                  onChange={(e) => setKeys({...keys, customEndpoint: e.target.value})}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                />
                <p className="text-xs text-zinc-500">Gunakan URL ini untuk Puter.js atau API lain yang kompatibel dengan OpenAI.</p>
              </div>
            )}
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
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-all active:scale-95"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95"
          >
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
