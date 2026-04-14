import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Code, LayoutTemplate, Maximize2, RefreshCw, Download, Github, FileCode2, FileJson, FileType2, X, Loader2, Smartphone, CloudLightning } from 'lucide-react';
import JSZip from 'jszip';
import { uploadToGithub } from '../lib/github';
import { ProjectMode } from '../App';

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

  useEffect(() => {
    if (files && Object.keys(files).length > 0) {
      if (!activeFile || !files[activeFile]) {
        setActiveFile(Object.keys(files)[0]);
      }
    }
  }, [files, activeFile]);

  // GitHub Modal State
  const [showGithubConfirm, setShowGithubConfirm] = useState(false);
  const [showGithubForm, setShowGithubForm] = useState(false);
  const [repoName, setRepoName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Netlify Modal State
  const [showNetlifyConfirm, setShowNetlifyConfirm] = useState(false);
  const [showNetlifyForm, setShowNetlifyForm] = useState(false);
  const [netlifyDomain, setNetlifyDomain] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState('');
  const [deploySuccess, setDeploySuccess] = useState('');

  useEffect(() => {
    const handleOpenNetlifyDeploy = () => setShowNetlifyConfirm(true);
    window.addEventListener('open_netlify_deploy', handleOpenNetlifyDeploy);
    return () => window.removeEventListener('open_netlify_deploy', handleOpenNetlifyDeploy);
  }, []);

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
    if (projectMode === 'website') {
      // For website, download the index.html or bundle
      const htmlContent = files['index.html'] || '';
      if (!htmlContent) {
        alert("Tidak ada file index.html untuk didownload.");
        return;
      }
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    
    if (projectMode !== 'apk') {
      alert("Mode tidak valid.");
      return;
    }
    
    const zip = new JSZip();
    Object.entries(files || {}).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xbuilder-app.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert("File yang diunduh berekstensi .apk, namun ini berisi source code karena kompilasi native di browser tidak didukung. Silakan gunakan Android Studio untuk build final.");
  };

  const handleNetlifyDeploy = async () => {
    setIsDeploying(true);
    setDeployError('');
    setDeploySuccess('');

    try {
      const zip = new JSZip();
      Object.entries(files || {}).forEach(([filename, content]) => {
        zip.file(filename, content);
      });
      const blob = await zip.generateAsync({ type: 'blob' });

      const response = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer nfp_AeUb929nKWme43zsgNMvGmPXNUJYAPe1388b',
          'Content-Type': 'application/zip'
        },
        body: blob
      });

      if (!response.ok) {
        throw new Error('Gagal deploy ke Netlify');
      }

      const data = await response.json();
      let finalUrl = data.ssl_url || data.url;
      
      // Update site name if provided
      if (netlifyDomain.trim()) {
        const siteName = netlifyDomain.replace('.netlify.app', '');
        const patchResponse = await fetch(`https://api.netlify.com/api/v1/sites/${data.id}`, {
          method: 'PATCH',
          headers: {
            'Authorization': 'Bearer nfp_AeUb929nKWme43zsgNMvGmPXNUJYAPe1388b',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: siteName })
        });
        
        if (patchResponse.ok) {
           finalUrl = `https://${siteName}.netlify.app`;
        }
      }

      setDeploySuccess(`Berhasil dideploy! Mengalihkan...`);
      setTimeout(() => {
        setShowNetlifyForm(false);
        setDeploySuccess('');
        setNetlifyDomain('');
        window.open(finalUrl, '_blank');
      }, 1500);
    } catch (err: any) {
      setDeployError(err.message || "Gagal deploy ke Netlify.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleGithubUpload = async () => {
    let token = '';
    try {
      const storedKeys = localStorage.getItem('xbuilder_api_keys');
      if (storedKeys) {
        const keys = JSON.parse(storedKeys);
        token = keys.github || '';
      }
    } catch (e) {}

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
      setUploadSuccess(`Berhasil diupload! Mengalihkan...`);
      setTimeout(() => {
        setShowGithubForm(false);
        setUploadSuccess('');
        setRepoName('');
        setCommitMessage('');
        window.open(url, '_blank');
      }, 1500);
    } catch (err: any) {
      setUploadError(err.message || "Gagal mengupload ke GitHub.");
    } finally {
      setIsUploading(false);
    }
  };

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

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFullscreen = () => {
    if (iframeRef.current) {
      if (!document.fullscreenElement) {
        iframeRef.current.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }
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
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-all active:scale-95"
              >
                Iya
              </button>
              <button 
                onClick={() => setShowGithubConfirm(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-all active:scale-95"
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
            <button onClick={() => setShowGithubForm(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 transition-all active:scale-95">
              <X size={16} />
            </button>
            <h3 className="text-sm font-medium text-white mb-1 text-center">Kasih nama repisotory mu</h3>
            <p className="text-xs text-zinc-400 text-center mb-4">Silahkan isi nama repository dan pesan commit (opsional)</p>
            
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
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Teks Lain (Opsional)</label>
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
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : null}
                Upload
              </button>
              <button 
                onClick={() => setShowGithubForm(false)}
                disabled={isUploading}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-all active:scale-95 disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Netlify Modals */}
      {showNetlifyConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 w-[300px] shadow-2xl">
            <p className="text-sm text-zinc-200 text-center mb-5">Apakah anda ingin mengupload file anda ke netlify?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => { setShowNetlifyConfirm(false); setShowNetlifyForm(true); }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-all active:scale-95"
              >
                Iya
              </button>
              <button 
                onClick={() => setShowNetlifyConfirm(false)}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-all active:scale-95"
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}

      {showNetlifyForm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-5 w-[350px] shadow-2xl relative">
            <button onClick={() => setShowNetlifyForm(false)} className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 transition-all active:scale-95">
              <X size={16} />
            </button>
            <h3 className="text-sm font-medium text-white mb-1 text-center">Deploy</h3>
            <p className="text-xs text-zinc-400 text-center mb-4">Kasih nama domain mu (opsional)</p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1">Nama Domain</label>
                <input 
                  type="text" 
                  value={netlifyDomain}
                  onChange={(e) => setNetlifyDomain(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
                  placeholder="contoh: test-111"
                />
              </div>
            </div>

            {deployError && <div className="mt-3 text-xs text-red-400 bg-red-400/10 p-2 rounded">{deployError}</div>}
            {deploySuccess && <div className="mt-3 text-xs text-emerald-400 bg-emerald-400/10 p-2 rounded">{deploySuccess}</div>}

            <div className="flex gap-3 justify-center mt-5">
              <button 
                onClick={handleNetlifyDeploy}
                disabled={isDeploying}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isDeploying ? <Loader2 size={14} className="animate-spin" /> : null}
                Deploy
              </button>
              <button 
                onClick={() => setShowNetlifyForm(false)}
                disabled={isDeploying}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-all active:scale-95 disabled:opacity-50"
              >
                Batal
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
            onClick={() => setShowNetlifyConfirm(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
            title="Deploy to Netlify"
          >
            <CloudLightning size={14} />
          </button>
          <button 
            onClick={handleDownloadApp}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
            title={projectMode === 'website' ? "Download HTML" : "Download APK (.app)"}
          >
            <Smartphone size={14} />
          </button>
          <button 
            onClick={handleDownload}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
            title="Download Project ZIP"
          >
            <Download size={14} />
          </button>
          <button 
            onClick={() => setShowGithubConfirm(true)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
            title="Upload to GitHub"
          >
            <Github size={14} />
          </button>
          {activeTab === 'preview' && (
            <button 
              onClick={handleRefresh}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
              title="Refresh Preview"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button 
            onClick={handleFullscreen}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all active:scale-95"
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
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                      activeFile === filename ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(filename)}
                      <span className="truncate">{filename}</span>
                    </div>
                    <span className="text-[9px] opacity-50 shrink-0 ml-2">
                      {formatBytes(new Blob([files[filename] || '']).size)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Editor */}
            <div className="flex-1 relative h-full">
              <div className="absolute top-0 left-0 right-0 h-8 bg-[#1e1e1e] border-b border-zinc-800 flex items-center px-4 text-[10px] text-zinc-400 z-10">
                {activeFile}
              </div>
              <div className="absolute top-8 bottom-0 left-0 right-0">
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
