import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPane } from './components/ChatPane';
import { PreviewPane } from './components/PreviewPane';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AppSettingsModal } from './components/AppSettingsModal';
import { Auth } from './components/Auth';
import { streamWebsiteGeneration, ApiKeys } from './lib/api';
import { auth, db, onSnapshot, doc, collection, query, where, orderBy, setDoc, deleteDoc, serverTimestamp } from './lib/firebase';
import { Menu, Loader2, Code2, X, Settings, Trash2, MessageSquare, LayoutTemplate, Columns, Maximize, KeyRound, ShieldAlert } from 'lucide-react';

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
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-all active:scale-95">
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
  const [userPlan, setUserPlan] = useState<{plan: string, limit: number}>({plan: 'free', limit: 10});
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
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAppSettingsOpen, setIsAppSettingsOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');
  const [isDesktopMode, setIsDesktopMode] = useState(false);

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

  const initialLoadRef = useRef(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        // Fetch user plan limits
        onSnapshot(doc(db, 'users', u.uid), (snap) => {
           if (snap.exists()) {
             const data = snap.data();
             const plan = data.plan || 'free';
             let limit = data.dailyLimit;
             
             if (limit === undefined) {
               limit = 10;
               if (plan === 'prem') limit = 300;
               if (plan === 'pro') limit = 999999;
             }
             
             setUserPlan({ plan, limit });
             // Here we could implement the daily limit check against 'limitResetAt'
           } else {
             setDoc(doc(db, 'users', u.uid), {
               email: u.email,
               plan: 'free',
               dailyLimit: 10,
               createdAt: serverTimestamp()
             })
             setUserPlan({ plan: 'free', limit: 10 });
           }
        }, (error) => {
          console.error("Error fetching user data:", error);
        });

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
    
    // Check Daily Limit
    const today = new Date().toDateString();
    let queryData = { count: 0, date: today };
    try {
      const storedLimit = localStorage.getItem('xbuilder_queries');
      if (storedLimit) queryData = JSON.parse(storedLimit);
    } catch(e) {}
    
    if (queryData.date !== today) {
      queryData = { count: 0, date: today };
    }
    
    if (queryData.count >= 10) {
      alert("Limit harian Anda (10 kueri) telah habis. Harap perbarui akun atau tunggu hingga besok.");
      return;
    }
    
    queryData.count += 1;
    localStorage.setItem('xbuilder_queries', JSON.stringify(queryData));
    
    // Trigger custom event so AppSettingsModal can update dynamically if it's open
    window.dispatchEvent(new Event('limit_updated'));

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

      // Decrement Limit here locally and in DB
      if (user && userPlan) {
         const newLimit = Math.max(0, userPlan.limit - 1);
         setUserPlan({ ...userPlan, limit: newLimit });
         try {
            await setDoc(doc(db, 'users', user.uid), { dailyLimit: newLimit }, { merge: true });
         } catch(e) {}
      }

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
          onClearChat={handleClearChat}
          onNewProject={handleNewProject}
          onOpenAppSettings={() => {
            setIsSidebarOpen(false);
            setIsAppSettingsOpen(true);
          }}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Unified Top Header - Row 1 */}
        <div className="h-14 border-b border-zinc-800 bg-[#09090b] shrink-0 flex items-center justify-between px-3 relative">
          {/* Left: Sidebar Toggle & Title */}
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all active:scale-95">
              <Menu size={20} />
            </button>
            <span className="text-lg font-black tracking-widest bg-gradient-to-b from-red-500 to-orange-500 bg-clip-text text-transparent">
              ᙭ ᗷᑌIᒪᗪᗴᖇ
            </span>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setIsAdminPanelOpen(true)} className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-md transition-all active:scale-95" title="Admin Panel">
              <ShieldAlert size={18} />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all active:scale-95" title="Settings">
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Unified Top Header - Row 2 (Controls) */}
        <div className="h-10 border-b border-zinc-800 bg-[#121214] shrink-0 flex items-center px-3 justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile Chat/Preview Toggle */}
            <div className="md:hidden flex items-center bg-zinc-900 rounded-md p-1 mr-2">
              <button 
                onClick={() => setMobileTab('chat')} 
                className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${mobileTab === 'chat' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Chat
              </button>
              <button 
                onClick={() => setMobileTab('preview')} 
                className={`px-3 py-1 rounded text-[10px] font-medium transition-colors ${mobileTab === 'preview' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
              >
                Preview
              </button>
            </div>
          </div>

          {/* Middle & Right Side Controls (Row 2) */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsDesktopMode(!isDesktopMode)} 
                className={`flex items-center justify-center w-5 h-5 rounded hover:bg-zinc-800 transition-all active:scale-95 text-[10px] font-bold ${isDesktopMode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-zinc-400 border border-zinc-800'}`} 
                title="Mode Desktop (Split)"
              >
                [+]
              </button>
              <button 
                onClick={() => {
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen();
                  }
                }} 
                className="flex items-center justify-center w-5 h-5 rounded hover:text-zinc-100 hover:bg-zinc-800 border border-zinc-800 transition-all active:scale-95 text-[10px] font-bold text-zinc-400" 
                title="Mode Fullscreen"
              >
                [-]
              </button>
            </div>

            <div className="w-px h-4 bg-zinc-700 mx-1"></div>

            <select 
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-[#18181b] border border-zinc-700 rounded-md px-2 py-1 flex items-center justify-center outline-none text-zinc-300 font-medium cursor-pointer hover:border-zinc-600 transition-colors text-[10px] max-w-[200px] truncate"
            >
              <optgroup label="Gemini">
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite</option>
              </optgroup>
              {enableOpenAI && (
                <optgroup label="OpenAI">
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </optgroup>
              )}
              {enableOpenRouter && (
                <optgroup label="OpenRouter">
                  <option value="anthropic/claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                  <option value="openai/gpt-4o">GPT-4o (OpenRouter)</option>
                </optgroup>
              )}
              {enableGrok && (
                <optgroup label="xAI">
                  <option value="grok-2-latest">Grok 2</option>
                </optgroup>
              )}
              {enableDeepSeek && (
                <optgroup label="DeepSeek">
                  <option value="deepseek-coder">DeepSeek Coder</option>
                  <option value="deepseek-chat">DeepSeek Chat</option>
                </optgroup>
              )}
              {enableQwen && (
                <optgroup label="Qwen">
                  <option value="qwen-coder-plus">Qwen Coder Plus</option>
                  <option value="qwen-coder-turbo">Qwen Coder Turbo</option>
                </optgroup>
              )}
              {enableCustom && (
                <optgroup label="Custom API">
                  <option value="custom-gpt-4o">Custom Endpoint (GPT-4o)</option>
                  <option value="custom-claude-3-opus">Custom Endpoint (Claude)</option>
                </optgroup>
              )}
            </select>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative bg-[#09090b]">
           {/* Chat Pane */}
          <div className={`flex flex-col transition-all h-full ${isDesktopMode ? 'w-full md:w-1/2 border-r border-zinc-800' : (mobileTab === 'chat' ? 'w-full' : 'hidden md:flex md:w-full border-r border-zinc-800')}`}>
            <ChatPane 
              messages={messages} 
              onSendMessage={handleSendMessage} 
              isGenerating={isGenerating} 
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              projectMode={projectMode}
              onModeChange={setProjectMode}
              userPlan={userPlan}
            />
          </div>

          {/* Preview Pane */}
          <div className={`flex flex-col transition-all h-full ${isDesktopMode ? 'hidden md:flex md:w-1/2' : (mobileTab === 'preview' ? 'w-full' : 'hidden md:flex md:w-full')}`}>
            <PreviewPane 
              files={files} 
              onChangeFiles={setFiles} 
              projectMode={projectMode}
              isGenerating={isGenerating}
            />
          </div>
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <AdminPanelModal 
        isOpen={isAdminPanelOpen} 
        onClose={() => setIsAdminPanelOpen(false)} 
      />

      <AppSettingsModal 
        isOpen={isAppSettingsOpen} 
        onClose={() => setIsAppSettingsOpen(false)}
        userPlan={userPlan}
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
