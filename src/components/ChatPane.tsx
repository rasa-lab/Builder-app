import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ChevronDown, ChevronRight, Check, Loader2, Copy, Paperclip, X, Smartphone, Globe } from 'lucide-react';
import Markdown from 'react-markdown';
import { ActionLog, Message, ProjectMode } from '../App';

interface ChatPaneProps {
  messages: Message[];
  onSendMessage: (text: string, attachments?: { name: string; data: string; type: string }[]) => void;
  isGenerating: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
  projectMode: ProjectMode;
  onModeChange: (mode: ProjectMode) => void;
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="mt-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-md hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
    >
      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
      {copied ? 'Disalin!' : 'Salin'}
    </button>
  );
}

export function ChatPane({ messages, onSendMessage, isGenerating, selectedModel, onModelChange, projectMode, onModeChange }: ChatPaneProps) {
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
      reader.onload = (event) => {
        if (event.target?.result) {
          setAttachments(prev => [...prev, {
            name: file.name,
            data: event.target!.result as string,
            type: file.type
          }]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0e0e11] border-r border-zinc-800">
      {/* Top Bar */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-3 justify-between bg-[#09090b] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs text-zinc-200">Untitled Project</span>
          <span className="bg-zinc-800 text-zinc-400 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold">Chat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mr-1">
            <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 outline-none text-zinc-200 font-medium cursor-pointer hover:border-zinc-700 transition-colors text-xs"
            >
              <optgroup label="Gemini">
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
              </optgroup>
              <optgroup label="OpenRouter">
                <option value="anthropic/claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                <option value="openai/gpt-4o">GPT-4o</option>
              </optgroup>
              <optgroup label="xAI">
                <option value="grok-2-latest">Grok 2</option>
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
              <Sparkles className="text-blue-500" size={24} />
            </div>
            <h2 className="text-lg font-semibold text-zinc-200 mb-1">Mulai Proyek Baru</h2>
            <p className="text-zinc-400 text-xs mb-6">Pilih mode proyek yang ingin Anda buat hari ini.</p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => onModeChange('apk')}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${projectMode === 'apk' ? 'bg-blue-600/10 border-blue-500/50' : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700'}`}
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
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${projectMode === 'website' ? 'bg-blue-600/10 border-blue-500/50' : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700'}`}
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
                    <CopyButton text={msg.text} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 bg-[#0e0e11] shrink-0 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto relative">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#18181b] border border-zinc-800 rounded-lg">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded text-[10px] text-zinc-300">
                  <Paperclip size={10} />
                  <span className="truncate max-w-[100px]">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="hover:text-red-400 ml-1">
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
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 bg-[#18181b] border border-zinc-700 rounded-xl text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 transition-colors"
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
              className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
