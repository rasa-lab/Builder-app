import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ChevronDown, ChevronRight, Check, Loader2, Copy } from 'lucide-react';
import Markdown from 'react-markdown';
import { ActionLog, Message } from '../App';

interface ChatPaneProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isGenerating: boolean;
  selectedModel: string;
  onModelChange: (model: string) => void;
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

export function ChatPane({ messages, onSendMessage, isGenerating, selectedModel, onModelChange }: ChatPaneProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0e0e11] border-r border-zinc-800">
      {/* Top Bar */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-4 justify-between bg-[#09090b] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-zinc-200">Untitled Project</span>
          <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-semibold">Chat</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-zinc-400 mr-2">
            <select 
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 outline-none text-zinc-200 font-medium cursor-pointer hover:border-zinc-700 transition-colors"
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
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
        {/* System Instructions */}
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">System Instructions</div>
          <p className="text-sm text-zinc-300 opacity-90">
            You are an expert full-stack developer and website builder. Your task is to generate a complete project based on the user's request. You can create multiple files (HTML, CSS, JS, TS, Python, etc.).
          </p>
        </div>

        {/* Chat History */}
        <div className="flex flex-col gap-6 pb-4">
          {messages.map((msg) => (
            <div key={msg.id} className="flex gap-4">
              <div className="shrink-0 mt-1">
                {msg.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200">
                    <User size={16} />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-800/50 flex items-center justify-center text-blue-400">
                    <Bot size={16} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-zinc-400 mb-1">
                  {msg.role === 'user' ? 'User' : 'X BUILDER AI'}
                </div>
                
                {msg.role === 'model' && msg.logs && (
                  <ActionLogsComponent logs={msg.logs} />
                )}

                <div className="text-[15px] leading-relaxed text-zinc-200 prose prose-invert max-w-none prose-pre:bg-[#18181b] prose-pre:border prose-pre:border-zinc-800">
                  {msg.role === 'model' && msg.text === '' ? null : (
                    <div className="markdown-body">
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
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0e0e11] shrink-0 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the website you want to build..."
            className="w-full bg-[#18181b] border border-zinc-700 rounded-xl pl-4 pr-12 py-3.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none min-h-[56px] max-h-[200px] shadow-sm text-[15px]"
            rows={1}
            style={{ height: 'auto', overflowY: 'auto' }}
          />
          <button
            onClick={handleSubmit}
            disabled={isGenerating || !input.trim()}
            className="absolute right-3 bottom-3 p-1.5 bg-blue-600 text-white hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
