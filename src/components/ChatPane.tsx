import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ChevronDown, ChevronRight, Check, Loader2, Copy, Paperclip, X, Smartphone, Globe, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { ActionLog, Message, ProjectMode } from '../App';
import { ApkConfigModal } from './ApkConfigModal';

interface ChatPaneProps {
  messages: Message[];
  onSendMessage: (text: string, attachments?: { name: string; data: string; type: string }[]) => void;
  isGenerating: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  projectMode: ProjectMode;
  onModeChange: (mode: ProjectMode) => void;
  userPlan?: {plan: string, limit: number};
}

function ActionLogsComponent({ logs }: { logs: ActionLog[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!logs || logs.length === 0) return null;
  
  const activeLog = logs.find(l => l.status === 'active') || logs[logs.length - 1];

  return (
    <div className="mb-4 bg-zinc-900/50 border border-zinc-800/50 rounded-lg overflow-hidden">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {activeLog.status === 'active' ? <Loader2 size={12} className="animate-spin text-blue-500" /> : <Check size={12} className="text-emerald-500" />}
        <span>{activeLog.text}</span>
      </button>
      {expanded && (
        <div className="px-3 py-2 border-t border-zinc-800/50 space-y-2 bg-[#0e0e11]/50">
          {logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-zinc-500">
              {log.status === 'active' ? <Loader2 size={12} className="animate-spin text-blue-500" /> : 
               log.status === 'done' ? <Check size={12} className="text-emerald-500" /> : 
               <div className="w-3 h-3 rounded-full border border-zinc-700" />}
              <span className={log.status === 'active' ? 'text-zinc-300' : ''}>{log.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionButtons({ text, onRepeat }: { text: string, onRepeat: () => void }) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 flex items-center gap-2 relative">
      {showConfirm && (
        <div className="absolute bottom-full left-0 mb-2 w-64 bg-[#18181b] border border-zinc-800 rounded-lg p-3 shadow-xl z-10">
          <p className="text-[11px] text-zinc-300 mb-3 text-center">Anda yakin mengulangi semua file?</p>
          <div className="flex gap-2">
            <button 
              onClick={() => { setShowConfirm(false); onRepeat(); }}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] py-1.5 rounded transition-colors active:scale-95"
            >
              Iya
            </button>
            <button 
              onClick={() => setShowConfirm(false)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] py-1.5 rounded transition-colors active:scale-95"
            >
              Tidak
            </button>
          </div>
        </div>
      )}
      <button 
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:text-zinc-200 hover:bg-zinc-800 transition-colors active:scale-95"
      >
        <RefreshCw size={12} />
        Ulangi
      </button>
      <button 
        onClick={handleCopy}
        className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:text-zinc-200 hover:bg-zinc-800 transition-colors active:scale-95"
      >
        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        {copied ? 'Disalin!' : 'Salin'}
      </button>
    </div>
  );
}

export function ChatPane({ messages, onSendMessage, isGenerating, selectedModel, onModelChange, projectMode, onModeChange, userPlan }: ChatPaneProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; data: string; type: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleOpenApkConfig = () => setShowApkConfig(true);
    window.addEventListener('open_apk_config', handleOpenApkConfig);
    return () => window.removeEventListener('open_apk_config', handleOpenApkConfig);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachments.length > 0) && !isGenerating) {
      onSendMessage(input.trim(), attachments);
      setInput('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Prevent zip files
      if (file.name.endsWith('.zip') || file.type === 'application/zip') {
        alert('File zip tidak didukung.');
        return;
      }

      const reader = new FileReader();
      const isText = file.type.startsWith('text/') || file.type === 'application/json' || file.name.match(/\.(js|ts|jsx|tsx|css|html|md|csv|xml)$/i);
      
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachments(prev => [...prev, {
            name: file.name,
            data: event.target!.result as string,
            type: isText ? 'text/plain' : file.type
          }]);
        }
      };
      
      if (isText) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showApkConfig, setShowApkConfig] = useState(false);

  const websiteRecommendations = [
    "Tambahkan animasi transisi",
    "Buat menjadi responsif untuk mobile",
    "Tambahkan dark mode",
    "Ubah warna tema menjadi biru"
  ];

  const apkRecommendations = [
    "Tambahkan splash screen",
    "Buat navigasi bottom bar",
    "Tambahkan fitur login",
    "Ubah warna utama aplikasi"
  ];

  const recommendations = projectMode === 'website' ? websiteRecommendations : apkRecommendations;

  const [enableOpenAI, setEnableOpenAI] = useState(false);
  const [enableOpenRouter, setEnableOpenRouter] = useState(false);
  const [enableGrok, setEnableGrok] = useState(false);
  const [enableDeepSeek, setEnableDeepSeek] = useState(false);
  const [enableQwen, setEnableQwen] = useState(false);
  const [enableCustom, setEnableCustom] = useState(false);

  useEffect(() => {
    const loadKeys = () => {
      try {
        const storedKeys = localStorage.getItem('xbuilder_api_keys');
        if (storedKeys) {
          const keys = JSON.parse(storedKeys);
          setEnableOpenAI(keys.enableOpenAI === true);
          setEnableOpenRouter(keys.enableOpenRouter === true);
          setEnableGrok(keys.enableGrok === true);
          setEnableDeepSeek(keys.enableDeepSeek === true);
          setEnableQwen(keys.enableQwen === true);
          setEnableCustom(keys.enableCustom === true);
        }
      } catch (e) {
        console.error("Failed to parse stored keys", e);
      }
    };

    loadKeys();
    window.addEventListener('api_keys_updated', loadKeys);
    return () => window.removeEventListener('api_keys_updated', loadKeys);
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0e0e11] border-r border-zinc-800">
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
              <Sparkles className="text-blue-500" size={24} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Halo, Selamat Datang di X BUILDER!</h2>
            <p className="text-zinc-400 text-xs mb-6">Pilih mode proyek yang ingin Anda buat hari ini.</p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => setShowApkConfig(true)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-95 ${projectMode === 'apk' ? 'bg-blue-600/10 border-blue-500/50' : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700'}`}
              >
                <div className={`p-2.5 rounded-lg ${projectMode === 'apk' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Smartphone size={20} />
                </div>
                <div className="text-left">
                  <div className={`font-medium text-sm ${projectMode === 'apk' ? 'text-blue-400' : 'text-zinc-200'}`}>Buat APK</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Buat aplikasi Android dengan XML dan Java/Kotlin.</div>
                </div>
              </button>

              <button 
                onClick={() => onModeChange('website')}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all active:scale-95 ${projectMode === 'website' ? 'bg-blue-600/10 border-blue-500/50' : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700'}`}
              >
                <div className={`p-2.5 rounded-lg ${projectMode === 'website' ? 'bg-blue-500/20 text-blue-400' : 'bg-zinc-800 text-zinc-400'}`}>
                  <Globe size={20} />
                </div>
                <div className="text-left">
                  <div className={`font-medium text-sm ${projectMode === 'website' ? 'text-blue-400' : 'text-zinc-200'}`}>Buat Website</div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">Buat website modern dengan HTML, CSS, JS, atau React.</div>
                </div>
              </button>
            </div>
            
            <div className="mt-8 w-full">
              <p className="text-xs text-zinc-500 mb-3 text-left">Rekomendasi Prompt:</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setInput("Buatkan saya landing page untuk toko kopi dengan tema gelap")} className="text-xs bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700/50 transition-all active:scale-95 text-left">
                  Landing page toko kopi
                </button>
                <button onClick={() => setInput("Buatkan aplikasi kalkulator sederhana dengan UI modern")} className="text-xs bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700/50 transition-all active:scale-95 text-left">
                  Aplikasi kalkulator
                </button>
                <button onClick={() => setInput("Buatkan portofolio developer dengan animasi scroll")} className="text-xs bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-700/50 transition-all active:scale-95 text-left">
                  Portofolio developer
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-4">
            {messages.map((msg) => (
              <div key={msg.id} className="flex gap-3">
                <div className="shrink-0 mt-1">
                  {msg.role === 'user' ? (
                    <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200">
                      <User size={14} />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-900/50 border border-blue-800/50 flex items-center justify-center text-blue-400">
                      <Bot size={14} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs text-zinc-400 mb-1">
                    {msg.role === 'user' ? 'User' : 'X BUILDER AI'}
                  </div>
                  
                  {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-2 bg-zinc-800/50 border border-zinc-700 rounded-md px-2 py-1 text-xs text-zinc-300">
                          <Paperclip size={12} />
                          <span className="truncate max-w-[150px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.role === 'model' && msg.logs && (
                    <ActionLogsComponent logs={msg.logs} />
                  )}

                  <div className="text-sm leading-relaxed text-zinc-200 prose prose-invert max-w-none prose-pre:bg-[#18181b] prose-pre:border prose-pre:border-zinc-800">
                    {msg.role === 'model' && msg.text === '' ? null : (
                      <div className="markdown-body text-sm">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}
                  </div>

                  {msg.role === 'model' && msg.text && (
                    <ActionButtons text={msg.text} onRepeat={() => {
                      // Find the last user message before this model message
                      const currentIndex = messages.findIndex(m => m.id === msg.id);
                      let lastUserMsg = null;
                      for (let i = currentIndex - 1; i >= 0; i--) {
                        if (messages[i].role === 'user') {
                          lastUserMsg = messages[i];
                          break;
                        }
                      }
                      if (lastUserMsg) {
                        onSendMessage(lastUserMsg.text, lastUserMsg.attachments);
                      }
                    }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#0e0e11] shrink-0 border-t border-zinc-800/50 flex flex-col">
        {messages.length > 0 && showRecommendations && !isGenerating && (
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide max-w-4xl mx-auto w-full">
            <button 
              onClick={() => setShowRecommendations(false)}
              className="shrink-0 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-all active:scale-95"
              title="Tutup rekomendasi"
            >
              <X size={12} />
            </button>
            {recommendations.map((rec, i) => (
              <button
                key={i}
                onClick={() => {
                  onSendMessage(rec);
                  setShowRecommendations(false);
                }}
                className="shrink-0 px-3 py-1.5 bg-[#18181b] border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 rounded-full text-xs text-zinc-300 transition-all active:scale-95 whitespace-nowrap"
              >
                {rec}
              </button>
            ))}
          </div>
        )}
        <div className="max-w-4xl mx-auto relative w-full">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#18181b] border border-zinc-800 rounded-lg">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300">
                  <Paperclip size={10} />
                  <span className="truncate max-w-[100px]">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="hover:text-red-400 ml-1 transition-all active:scale-95">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="relative flex items-end gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
            />
            {userPlan?.limit === 0 ? (
              <div className="flex-1 bg-red-900/20 border border-red-500/50 rounded-xl px-4 py-3 text-red-400 text-sm font-medium text-center shadow-lg">
                Limit / Kuota pertanyaan harian kamu sebesar telah mencapai 0/Habis. Mohon tingkatkan langganan Anda.
              </div>
            ) : (
              <>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2.5 bg-[#18181b] border border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-all active:scale-95"
                  title="Add file"
                >
                  <Paperclip size={16} />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe what you want to build..."
                  className="flex-1 bg-[#18181b] border border-zinc-700 rounded-xl pl-3 pr-10 py-2.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[42px] max-h-[150px] shadow-sm text-sm"
                  rows={1}
                  style={{ height: 'auto', overflowY: 'auto' }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={isGenerating || (!input.trim() && attachments.length === 0)}
                  className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      <ApkConfigModal 
        isOpen={showApkConfig} 
        onClose={() => setShowApkConfig(false)} 
        onConfirm={(config) => {
          onModeChange('apk');
          // We can store config in localStorage or pass it to parent if needed.
          // For now, we just switch mode. The AI will be instructed to use this config.
          localStorage.setItem('apk_config', JSON.stringify(config));
        }} 
      />
    </div>
  );
}
