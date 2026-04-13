import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPane } from './components/ChatPane';
import { PreviewPane } from './components/PreviewPane';
import { SettingsModal } from './components/SettingsModal';
import { Auth } from './components/Auth';
import { streamWebsiteGeneration, ApiKeys } from './lib/api';
import { auth, db, onSnapshot, doc, collection, query, where, orderBy, setDoc, deleteDoc, serverTimestamp } from './lib/firebase';
import { Menu, Loader2, Code2, X } from 'lucide-react';

export type ActionLog = {
  status: 'pending' | 'active' | 'done';
  text: string;
};

export type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  logs?: ActionLog[];
  attachments?: { name: string; data: string; type: string }[];
};

export type ProjectMode = 'website' | 'apk';

export type Project = {
  id: string;
  name: string;
  mode: ProjectMode;
  files: Record<string, string>;
  messages: Message[];
  userId: string;
  createdAt: any;
  updatedAt: any;
};

// Security measures
const securityCheck = () => {
  // Anti-Scraping & Anti-DDoS (Basic Client-Side)
  const requestCount = parseInt(sessionStorage.getItem('req_count') || '0');
  const lastRequest = parseInt(sessionStorage.getItem('last_req') || '0');
  const now = Date.now();

  if (now - lastRequest < 1000) { // Max 1 request per second
    sessionStorage.setItem('req_count', (requestCount + 1).toString());
    if (requestCount > 10) {
      alert('Terlalu banyak permintaan. Harap tunggu sebentar.');
      return false;
    }
  } else {
    sessionStorage.setItem('req_count', '1');
  }
  sessionStorage.setItem('last_req', now.toString());
  return true;
};

// Anti-XSS (Basic Sanitization for display)
const sanitizeInput = (input: string) => {
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// --- BootScreen Component ---
function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Mengakses system ai...');

  useEffect(() => {
    const steps = [
      { p: 33, text: 'Mengakses system ai...' },
      { p: 66, text: 'Mengecek ai...' },
      { p: 100, text: 'Active' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setProgress(steps[currentStep].p);
        setStatus(steps[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 600);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-[#09090b] flex flex-col items-center justify-center z-[200] font-mono">
      <div className="w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-6 justify-center animate-pulse">
          <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
            <Code2 size={20} className="text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-wider">X BUILDER</h1>
        </div>
        
        <div className="space-y-4">
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider">
            <span>{status}</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Welcome Modal Component ---
function WelcomeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        <div className="p-6 text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
            <Code2 size={24} className="text-blue-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Halo selamat datang di X BUILDER</h2>
          <p className="text-zinc-400 text-xs mb-6">
            Platform pembuatan aplikasi dan website berbasis AI tercanggih. Silakan pilih mode proyek Anda untuk memulai.
          </p>
          <button 
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-all active:scale-95 text-sm"
          >
            Mulai Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [showBoot, setShowBoot] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectMode, setProjectMode] = useState<ProjectMode>('website');

  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({
    'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div class="flex items-center justify-center h-screen bg-[#09090b] text-zinc-300 font-sans">\n    <div class="text-center">\n      <h1 class="text-3xl font-semibold mb-2 text-blue-500">Preview</h1>\n      <p class="text-zinc-400">Describe what you want to build in the chat.</p>\n    </div>\n  </div>\n</body>\n</html>'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  
  // Mobile & Modal State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');

  const initialLoadRef = useRef(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        // Only show welcome once per login session
        if (!sessionStorage.getItem('xbuilder_welcomed')) {
          setShowWelcome(true);
          sessionStorage.setItem('xbuilder_welcomed', 'true');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'projects'), where('userId', '==', user.uid), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projs: Project[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        let parsedFiles = {};
        let parsedMessages = [];
        try { parsedFiles = typeof data.files === 'string' ? JSON.parse(data.files) : (data.files || {}); } catch(e){}
        try { parsedMessages = typeof data.messages === 'string' ? JSON.parse(data.messages) : (data.messages || []); } catch(e){}
        
        projs.push({
          id: doc.id,
          name: data.name,
          mode: data.mode || 'website',
          files: parsedFiles,
          messages: parsedMessages,
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      setProjects(projs);

      if (initialLoadRef.current) {
        if (projs.length > 0 && !currentProjectId) {
          setCurrentProjectId(projs[0].id);
          setMessages(projs[0].messages);
          setFiles(projs[0].files);
          setProjectMode(projs[0].mode || 'website');
        }
        initialLoadRef.current = false;
      }
    });
    return () => unsubscribe();
  }, [user]);

  const saveProject = async (msgs: Message[], currentFiles: Record<string, string>, mode: ProjectMode) => {
    if (!user) return;
    
    let projId = currentProjectId;
    if (!projId) {
      projId = Date.now().toString();
      setCurrentProjectId(projId);
    }

    const title = msgs.find(m => m.role === 'user')?.text.slice(0, 30) + '...' || 'Untitled Project';

    await setDoc(doc(db, 'projects', projId), {
      id: projId,
      userId: user.uid,
      name: title,
      mode: mode,
      files: JSON.stringify(currentFiles),
      messages: JSON.stringify(msgs),
      updatedAt: serverTimestamp(),
      createdAt: currentProjectId ? undefined : serverTimestamp()
    }, { merge: true });
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'projects', projectId));
      if (currentProjectId === projectId) {
        handleClearChat();
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'projects', projectId), {
        name: newName,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error renaming project:", error);
    }
  };

  const lastMessageTimeRef = React.useRef<number>(0);

  const handleSendMessage = async (text: string, attachments?: { name: string; data: string; type: string }[]) => {
    if (!securityCheck()) return;
    
    const sanitizedText = sanitizeInput(text);

    const now = Date.now();
    if (now - lastMessageTimeRef.current < 2000) {
      alert("Anti-DDoS: Harap tunggu sebentar sebelum mengirim pesan lagi.");
      return;
    }
    lastMessageTimeRef.current = now;

    const userMsgId = Date.now().toString();
    const modelMsgId = (Date.now() + 1).toString();
    
    const newMessages: Message[] = [...messages, { id: userMsgId, role: 'user', text: sanitizedText, attachments }];
    setMessages(newMessages);
    setIsGenerating(true);
    
    if (window.innerWidth < 768) {
      setMobileTab('preview');
    }

    try {
      const contents = newMessages.map(m => {
        const parts: any[] = [{ text: m.text }];
        if (m.attachments) {
          m.attachments.forEach(att => {
            if (att.data.startsWith('data:')) {
              parts.push({
                inlineData: {
                  data: att.data.split(',')[1],
                  mimeType: att.type || 'application/octet-stream'
                }
              });
            } else {
              parts.push({ text: `\n\nAttached File (${att.name}):\n${att.data}` });
            }
          });
        }
        return { role: m.role, parts };
      });

      const storedKeys = localStorage.getItem('xbuilder_api_keys');
      const apiKeys: ApiKeys = storedKeys ? JSON.parse(storedKeys) : { gemini: '', openrouter: '', grok: '' };

      let promptText = sanitizedText;
      if (projectMode === 'apk') {
        try {
          const apkConfigStr = localStorage.getItem('apk_config');
          if (apkConfigStr) {
            const apkConfig = JSON.parse(apkConfigStr);
            promptText += `\n\n[SYSTEM: User has configured the APK with the following settings:\n- Package Name: ${apkConfig.packageName}\n- Mode: ${apkConfig.isOnline ? 'Online' : 'Offline'}\n- Permissions: ${apkConfig.permissions.join(', ')}\n- Has Custom Icon: ${!!apkConfig.icon}\n- Has Boot Video: ${!!apkConfig.bootVideo}\nPlease incorporate these settings into the AndroidManifest.xml, build.gradle, and Java/Kotlin code accordingly.]`;
          }
        } catch (e) {
          console.error("Failed to parse apk_config", e);
        }
      }

      // Update the last user message with the modified promptText for the AI, but keep the UI clean
      const contentsForAI = newMessages.map((m, index) => {
        const parts: any[] = [{ text: index === newMessages.length - 1 ? promptText : m.text }];
        if (m.attachments) {
          m.attachments.forEach(att => {
            if (att.data.startsWith('data:')) {
              parts.push({
                inlineData: {
                  data: att.data.split(',')[1],
                  mimeType: att.type || 'application/octet-stream'
                }
              });
            } else {
              parts.push({ text: `\n\nAttached File (${att.name}):\n${att.data}` });
            }
          });
        }
        return { role: m.role, parts };
      });

      const stream = streamWebsiteGeneration(contentsForAI, selectedModel, apiKeys, files || {}, projectMode);
      let fullResponse = "";
      
      const isErrorFix = text.toLowerCase().match(/error|bug|fix|rusak|salah|perbaiki|gagal/);

      let THINKING_STEPS = [
        "Membaca dan memahami permintaan kamu...",
        "Memikirkan arsitektur yang paling cocok...",
        "Menyiapkan struktur proyek dan library...",
        "Mendesain tampilan UI/UX yang profesional...",
        "Mulai menulis kerangka komponen...",
        "Mengimplementasikan logika utama aplikasi...",
        "Menambahkan styling agar terlihat modern...",
        "Memastikan responsivitas di semua perangkat...",
        "Mengecek kembali kode untuk menghindari error...",
        "Menyelesaikan dan merapikan semua file..."
      ];

      if (isErrorFix) {
        THINKING_STEPS = [
          "Menganalisis pesan error dari kamu...",
          "Memeriksa file yang relevan dengan error...",
          "Mencari akar penyebab masalah (debugging)...",
          "Menemukan solusi yang tepat...",
          "Merencanakan perubahan kode...",
          "Menerapkan perbaikan pada komponen...",
          "Menyesuaikan logika agar tidak terjadi error lagi...",
          "Memastikan perbaikan tidak merusak fitur lain...",
          "Mengecek ulang kode yang telah diperbarui...",
          "Menyimpan perubahan dan menyelesaikan perbaikan..."
        ];
      } else if (projectMode === 'apk') {
        THINKING_STEPS = [
          "Menganalisis kebutuhan aplikasi Android...",
          "Menyiapkan struktur AndroidManifest.xml...",
          "Mengkonfigurasi build.gradle dan dependencies...",
          "Mendesain layout XML untuk UI aplikasi...",
          "Menulis logika Java/Kotlin di MainActivity...",
          "Menghubungkan UI XML dengan kode backend...",
          "Menambahkan resource (string, warna, drawable)...",
          "Memastikan kompatibilitas versi Android...",
          "Mengecek potensi error pada kompilasi...",
          "Menyelesaikan struktur project Android Studio..."
        ];
      }

      setMessages(prev => [...prev, { 
        id: modelMsgId, 
        role: 'model', 
        text: '',
        logs: [{ status: 'active', text: THINKING_STEPS[0] }]
      }]);

      let newFiles = { ...(files || {}) };
      let hasStartedCode = false;
      const startTime = Date.now();

      for await (const chunk of stream) {
        fullResponse += chunk;
        
        const elapsed = Date.now() - startTime;
        const progressIndex = Math.min(
          Math.floor(elapsed / 2500), 
          THINKING_STEPS.length - 1
        );

        let currentLogs: ActionLog[] = [];
        for (let i = 0; i <= progressIndex; i++) {
          if (i === progressIndex) {
            currentLogs.push({ status: 'active', text: THINKING_STEPS[i] });
          } else {
            currentLogs.push({ status: 'done', text: THINKING_STEPS[i] });
          }
        }

        if (fullResponse.includes('```')) {
          hasStartedCode = true;
        }

        // Match completed or partial blocks with filename
        // Format 1: ```html filename: index.html
        // Format 2: ```html\n<!-- filename: index.html -->
        // Format 3: ```html\n/* filename: index.html */
        const fileRegex = /```(?:[a-zA-Z0-9]+)?\s*(?:<!--|\/\*|#|\/\/)?\s*filename:\s*([^\n`]+?)(?:-->|\*\/)?\s*\n([\s\S]*?)(?:```|$)/gi;
        let tempFiles = { ...(files || {}) };
        let hasFiles = false;

        const blocks = [...fullResponse.matchAll(fileRegex)];
        for (const m of blocks) {
          const filename = m[1].trim();
          const content = m[2].trim();
          if (content === '') {
            tempFiles[filename] = '';
          } else {
            tempFiles[filename] = content;
          }
          hasFiles = true;
        }

        if (!hasFiles && projectMode === 'website') {
          const htmlMatch = fullResponse.match(/```(?:html)?\n([\s\S]*?)(?:```|$)/i);
          if (htmlMatch && htmlMatch[1]) {
            tempFiles['index.html'] = htmlMatch[1];
          }
        }

        newFiles = tempFiles;
        setFiles(newFiles);

        setMessages(prev => prev.map(m => 
          m.id === modelMsgId ? { ...m, text: '', logs: currentLogs } : m
        ));
      }

      const finalLogs: ActionLog[] = THINKING_STEPS.map(step => ({
        status: 'done',
        text: step
      }));

      let finalDisplayText = fullResponse.replace(/```[\s\S]*?(```|$)/g, '').trim();

      const finalMessages = messages.map(m => m).concat([{ id: userMsgId, role: 'user', text: sanitizedText, attachments }, { 
        id: modelMsgId, 
        role: 'model', 
        text: finalDisplayText,
        logs: finalLogs
      }]);

      setMessages(finalMessages);
      await saveProject(finalMessages, newFiles, projectMode);

    } catch (error: any) {
      console.error("Generation error:", error);
      setMessages(prev => prev.map(m => 
        m.id === modelMsgId ? { 
          ...m, 
          text: `Error: ${error.message || 'Failed to generate code. Please check your API keys in Settings.'}`,
          logs: m.logs?.map(l => ({ ...l, status: 'done' }))
        } : m
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewProject = () => {
    setMessages([]);
    setFiles({
      'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div class="flex items-center justify-center h-screen bg-[#09090b] text-zinc-300 font-sans">\n    <div class="text-center">\n      <h1 class="text-3xl font-semibold mb-2 text-blue-500">Preview</h1>\n      <p class="text-zinc-400">Describe what you want to build in the chat.</p>\n    </div>\n  </div>\n</body>\n</html>'
    });
    setCurrentProjectId(null);
    setProjectMode('website');
  };

  const handleClearChat = () => {
    setShowClearConfirm(true);
  };

  const confirmClearChat = async () => {
    if (currentProjectId && user) {
      try {
        await deleteDoc(doc(db, 'projects', currentProjectId));
      } catch (error) {
        console.error("Error deleting project:", error);
      }
    }
    handleNewProject();
    setShowClearConfirm(false);
  };

  const loadProject = (proj: Project) => {
    setCurrentProjectId(proj.id);
    setMessages(proj.messages);
    setFiles(proj.files);
    setProjectMode(proj.mode || 'website');
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  if (showBoot) {
    return <BootScreen onComplete={() => setShowBoot(false)} />;
  }

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-zinc-300 font-sans overflow-hidden">
      {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          projects={projects}
          currentProjectId={currentProjectId}
          onLoadProject={loadProject}
          onDeleteProject={handleDeleteProject}
          onRenameProject={handleRenameProject}
          onClose={() => setIsSidebarOpen(false)} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
          onClearChat={handleClearChat}
          onNewProject={handleNewProject}
        />
      </div>

      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        <div className="md:hidden flex items-center justify-between p-3 border-b border-zinc-800 bg-[#09090b] shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex gap-1 bg-[#18181b] p-1 rounded-lg border border-zinc-800">
            <button 
              onClick={() => setMobileTab('chat')} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mobileTab === 'chat' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400'}`}
            >
              Chat
            </button>
            <button 
              onClick={() => setMobileTab('preview')} 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${mobileTab === 'preview' ? 'bg-zinc-800 text-zinc-100 shadow-sm' : 'text-zinc-400'}`}
            >
              Preview
            </button>
          </div>
        </div>

        <div className={`flex-1 overflow-hidden md:w-1/2 lg:w-[45%] flex flex-col ${mobileTab === 'chat' ? 'flex' : 'hidden md:flex'}`}>
          <ChatPane 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isGenerating={isGenerating} 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            projectMode={projectMode}
            onModeChange={setProjectMode}
          />
        </div>

        <div className={`flex-1 overflow-hidden md:w-1/2 lg:w-[55%] flex flex-col ${mobileTab === 'preview' ? 'flex' : 'hidden md:flex'}`}>
          <PreviewPane 
            files={files} 
            onChangeFiles={setFiles} 
            projectMode={projectMode}
          />
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Clear Chat Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <p className="text-sm text-zinc-200">Anda yakin untuk menghapus semua chat anda?</p>
            </div>
            <div className="p-4 border-t border-zinc-800 bg-[#09090b] flex gap-3">
              <button 
                onClick={confirmClearChat}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-all active:scale-95"
              >
                Iya
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all active:scale-95"
              >
                Tidak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
