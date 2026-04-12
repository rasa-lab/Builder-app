import React, { useState, useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import { Code, LayoutTemplate, Maximize2, RefreshCw, Download, Github, FileCode2, FileJson, FileType2, X, Loader2, Smartphone } from 'lucide-react';
import JSZip from 'jszip';
import { uploadToGithub } from '../lib/github';
import { ProjectMode } from '../App';

// Fix Monaco worker error
loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs' } });

interface PreviewPaneProps {
  files: Record<string, string>;
  onChangeFiles: (files: Record<string, string>) => void;
  projectMode: ProjectMode;
}

export function PreviewPane({ files, onChangeFiles, projectMode }: PreviewPaneProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [activeFile, setActiveFile] = useState<string>('index.html');
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // GitHub Modal State
  const [showGithubConfirm, setShowGithubConfirm] = useState(false);
  const [showGithubForm, setShowGithubForm] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleDownload = async () => {
    const zip = new JSZip();
    Object.entries(files || {}).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xbuilder-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadApp = async () => {
    if (projectMode !== 'apk') {
      alert("Mode 'Buat APK' tidak aktif. Silakan buat proyek baru dengan mode APK untuk mendownload aplikasi.");
      return;
    }
    
    const zip = new JSZip();
    Object.entries(files || {}).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xbuilder-android-project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGithubUpload = async () => {
    const token = localStorage.getItem('xbuilder_github_token');
    if (!token) {
      setUploadError("GitHub token tidak ditemukan. Silakan tambahkan di Pengaturan.");
      return;
    }

    if (!repoName.trim()) {
      setUploadError("Nama repository harus diisi.");
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    try {
      const url = await uploadToGithub(token, repoName, commitMessage, files);
      setUploadSuccess(`Berhasil diupload! URL: ${url}`);
      setTimeout(() => {
        setShowGithubForm(false);
        setUploadSuccess('');
        setRepoName('');
        setCommitMessage('');
      }, 3000);
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengupload ke GitHub.");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (files && !files[activeFile]) {
      const firstFile = Object.keys(files || {})[0];
      if (firstFile) setActiveFile(firstFile);
    }
  }, [files, activeFile]);

  useEffect(() => {
    if (activeTab === 'preview' && iframeRef.current && projectMode === 'website') {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        // If we have an index.html, render it. Otherwise just render the active file if it's html
        const htmlContent = (files || {})['index.html'] || (activeFile?.endsWith('.html') ? (files || {})[activeFile] : '') || '<div style="color:white; padding: 20px; font-family: sans-serif;">No index.html found.</div>';
        
        // Basic injection of other JS/CSS files if needed (simplified for this demo)
        let finalHtml = htmlContent;
        if ((files || {})['styles.css'] && finalHtml) {
          finalHtml = finalHtml.replace('</head>', `<style>${(files || {})['styles.css']}</style></head>`);
        }
        if ((files || {})['script.js'] && finalHtml) {
          finalHtml = finalHtml.replace('</body>', `<script>${(files || {})['script.js']}</script></body>`);
        }

        doc.write(finalHtml);
        doc.close();
      }
    }
  }, [files, activeTab, iframeKey, projectMode, activeFile]);

  const getLanguage = (filename: string) => {
    if (!filename) return 'plaintext';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.js') || filename.endsWith('.jsx')) return 'javascript';
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.xml')) return 'xml';
    if (filename.endsWith('.java')) return 'java';
    if (filename.endsWith('.kt')) return 'kotlin';
    return 'plaintext';
  };

  const getFileIcon = (filename: string) => {
    if (!filename) return <Code size={14} className="text-zinc-400" />;
    if (filename.endsWith('.html')) return <Code size={14} className="text-orange-400" />;
    if (filename.endsWith('.css')) return <FileType2 size={14} className="text-blue-400" />;
    if (filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.tsx')) return <FileCode2 size={14} className="text-yellow-400" />;
    if (filename.endsWith('.json')) return <FileJson size={14} className="text-green-400" />;
    return <Code size={14} className="text-zinc-400" />;
  };

  return (
    <div className="flex-1 flex flex-col bg-[#18181b] border-l border-zinc-800 h-full relative">
      {/* GitHub Modals */}
      {showGithubConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 w-[300px] shadow-2xl">
            <p className="text-sm text-zinc-200 text-center mb-5">Apakah anda yakin upload ke repisotory anda?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => { setShowGithubConfirm(false); setShowGithubForm(true); }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors"
              >
                Iya
              </button>
              <button 
                onClick={() => setShowGithubConfirm(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-colors"
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}

      {showGithubForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 w-[350px] shadow-2xl relative">
            <button onClick={() => setShowGithubForm(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300">
              <X size={16} />
            </button>
            <h3 className="text-sm font-medium text-white mb-1 text-center">Silahkan konfirmasi berikut</h3>
            <p className="text-xs text-zinc-400 text-center mb-4">dengan memberikan nama repisotory anda dan juga teks anda</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Nama Repisotory</label>
                <input 
                  type="text" 
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="my-awesome-project"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Teks Lain (Commit)</label>
                <input 
                  type="text" 
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="Initial commit"
                />
              </div>
            </div>

            {uploadError && <div className="mt-3 text-xs text-red-400 bg-red-400/10 p-2 rounded">{uploadError}</div>}
            {uploadSuccess && <div className="mt-3 text-xs text-emerald-400 bg-emerald-400/10 p-2 rounded">{uploadSuccess}</div>}

            <div className="flex gap-3 justify-center mt-5">
              <button 
                onClick={handleGithubUpload}
                disabled={isUploading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : null}
                Submit
              </button>
              <button 
                onClick={() => setShowGithubForm(false)}
                disabled={isUploading}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-colors disabled:opacity-50"
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-2 shrink-0 bg-[#09090b]">
        <div className="flex gap-1 p-1 bg-[#18181b] rounded-lg border border-zinc-800">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'preview' 
                ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <LayoutTemplate size={14} />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'code' 
                ? 'bg-zinc-800 text-zinc-100 shadow-sm' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            }`}
          >
            <Code size={14} />
            Code
          </button>
        </div>
        
        <div className="ml-auto flex items-center gap-1.5 pr-2">
          <button 
            onClick={handleDownload}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
            title="Download Project ZIP"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={() => setShowGithubConfirm(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
            title="Upload to GitHub"
          >
            <Github size={14} />
          </button>
          <button 
            onClick={handleDownloadApp}
            className={`p-1.5 rounded-md transition-colors ${projectMode === 'apk' ? 'text-emerald-400 hover:text-emerald-300 hover:bg-zinc-800' : 'text-zinc-600 cursor-not-allowed'}`}
            title={projectMode === 'apk' ? "Download Android Project" : "Hanya tersedia di mode APK"}
          >
            <Smartphone size={14} />
          </button>
          {activeTab === 'preview' && (
            <button 
              onClick={handleRefresh}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
              title="Refresh Preview"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button 
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-colors"
            title="Expand"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative bg-white flex">
        {activeTab === 'preview' ? (
          projectMode === 'website' ? (
            <iframe
              key={iframeKey}
              ref={iframeRef}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-same-origin"
              title="Preview"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#09090b] text-zinc-400 p-6 text-center">
              <Smartphone size={32} className="text-blue-500 mb-3" />
              <h2 className="text-lg font-semibold text-white mb-2">Mode APK Aktif</h2>
              <p className="max-w-md text-xs">
                Preview visual tidak tersedia untuk file Android (XML/Java/Kotlin). Silakan lihat kode atau klik tombol "Download to App" (ikon smartphone) di atas untuk mendownload project Android Studio.
              </p>
            </div>
          )
        ) : (
          <div className="flex h-full w-full bg-[#1e1e1e]">
            {/* File Explorer */}
            <div className="w-48 border-r border-zinc-800 bg-[#18181b] flex flex-col">
              <div className="px-3 py-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                Files
              </div>
              <div className="flex-1 overflow-y-auto py-2">
                {Object.keys(files || {}).map(filename => (
                  <button
                    key={filename}
                    onClick={() => setActiveFile(filename)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
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
              <div className="absolute top-0 left-0 right-0 h-8 bg-[#1e1e1e] border-b border-zinc-800 flex items-center px-4 text-[10px] text-zinc-400 z-10">
                {activeFile}
              </div>
              <div className="pt-8 h-full">
                <Editor
                  height="100%"
                  language={getLanguage(activeFile)}
                  theme="vs-dark"
                  value={(files || {})[activeFile] || ''}
                  onChange={(value) => onChangeFiles({ ...(files || {}), [activeFile]: value || '' })}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 12,
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
