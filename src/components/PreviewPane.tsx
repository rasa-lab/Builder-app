import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Code, LayoutTemplate, Maximize2, RefreshCw, Download, Github, FileCode2, FileJson, FileType2 } from 'lucide-react';

// Fix Monaco worker error
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } });

interface PreviewPaneProps {
  files: Record<string, string>;
  onChangeFiles: (files: Record<string, string>) => void;
}

export function PreviewPane({ files, onChangeFiles }: PreviewPaneProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleDownload = () => {
    const code = files[activeFile] || '';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGithubUpload = () => {
    const confirmUpload = window.confirm("Are you sure you want to upload this code to your GitHub repository? (This feature requires a GitHub Personal Access Token in Settings)");
    if (confirmUpload) {
      alert("GitHub upload initiated. (Note: Full implementation requires backend proxy or PAT configuration)");
    }
  };

  useEffect(() => {
    if (activeTab === 'preview' && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        // If we have an index.html, render it. Otherwise just render the active file if it's html
        const htmlContent = files['index.html'] || (activeFile.endsWith('.html') ? files[activeFile] : '<h1>No index.html found</h1>');
        
        // Basic injection of other JS/CSS files if needed (simplified for this demo)
        let finalHtml = htmlContent;
        if (files['styles.css']) {
          finalHtml = finalHtml.replace('</head>', `<style>${files['styles.css']}</style></head>`);
        }
        if (files['script.js']) {
          finalHtml = finalHtml.replace('</body>', `<script>${files['script.js']}</script></body>`);
        }

        doc.write(finalHtml);
        doc.close();
      }
    }
  }, [files, activeTab, iframeKey]);

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.py')) return 'python';
    return 'plaintext';
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return <Code size={14} className="text-orange-400" />;
    if (filename.endsWith('.css')) return <FileType2 size={14} className="text-blue-400" />;
    if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.tsx')) return <FileCode2 size={14} className="text-yellow-400" />;
    if (filename.endsWith('.json')) return <FileJson size={14} className="text-green-400" />;
    return <Code size={14} className="text-zinc-400" />;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#18181b] border-l border-zinc-800 h-full">
      {/* Tabs */}
      <div className="h-14 border-b border-zinc-800 flex items-center px-2 shrink-0 bg-[#09090b]">
        <div className="flex gap-1 p-1 bg-[#18181b] rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'preview' 
                ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <LayoutTemplate size={16} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'code' 
                ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <Code size={16} />
            Code
          </button>
        </div>
        
        <div className="ml-auto flex items-center gap-2 pr-2">
          <button 
            onClick={handleDownload}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
            title="Download File"
          >
            <Download size={16} />
          </button>
          <button 
            onClick={handleGithubUpload}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
            title="Upload to GitHub"
          >
            <Github size={16} />
          </button>
          {activeTab === 'preview' && (
            <button 
              onClick={handleRefresh}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
              title="Refresh Preview"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <button 
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
            title="Expand"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-white flex">
        {activeTab === 'preview' ? (
          <iframe
            key={iframeKey}
            ref={iframeRef}
            className="w-full h-full border-none bg-white"
            sandbox="allow-scripts allow-same-origin"
            title="Preview"
          />
        ) : (
          <div className="flex h-full w-full bg-[#1e1e1e]">
            {/* File Explorer */}
            <div className="w-48 border-r border-zinc-800 bg-[#18181b] flex flex-col">
              <div className="px-3 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                Files
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {Object.keys(files).map(filename => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors ${
                      activeFile === filename ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    {getFileIcon(filename)}
                    <span className="truncate">{filename}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Editor */}
            <div className="flex-1 h-full relative">
              <div className="absolute top-0 left-0 right-0 h-8 bg-[#1e1e1e] border-b border-zinc-800 flex items-center px-4 text-xs text-zinc-400 z-10">
                {activeFile}
              </div>
              <div className="pt-8 h-full">
                <Editor
                  height="100%"
                  language={getLanguage(activeFile)}
                  theme="vs-dark"
                  value={files[activeFile] || ''}
                  onChange={(value) => onChangeFiles({ ...files, [activeFile]: value || '' })}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
