import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPane } from './components/ChatPane';
import { PreviewPane } from './components/PreviewPane';
import { SettingsModal } from './components/SettingsModal';
import { Auth } from './components/Auth';
import { streamWebsiteGeneration, ApiKeys } from './lib/api';
import { auth, db, onSnapshot, doc, collection, query, where, orderBy, setDoc, deleteDoc, serverTimestamp } from './lib/firebase';
import { Menu, Loader2 } from 'lucide-react';

export type ActionLog = {
  status: 'pending' | 'active' | 'done';
  text: string;
};

export type Message = {
  id: string;
  role: 'user' | 'model';
  text: string;
  logs?: ActionLog[];
};

export type Project = {
  id: string;
  name: string;
  files: Record<string, string>;
  messages: Message[];
  userId: string;
  createdAt: any;
  updatedAt: any;
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [files, setFiles] = useState<Record<string, string>>({
    'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div class="flex items-center justify-center h-screen bg-[#09090b] text-zinc-300 font-sans">\n    <div class="text-center">\n      <h1 class="text-3xl font-semibold mb-2 text-blue-500">Website Preview</h1>\n      <p class="text-zinc-400">Describe the website you want to build in the chat.</p>\n    </div>\n  </div>\n</body>\n</html>'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-pro-preview');
  
  // Mobile & Modal State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'preview'>('chat');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
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
        projs.push({
          id: doc.id,
          name: data.name,
          files: JSON.parse(data.files || '{}'),
          messages: JSON.parse(data.messages || '[]'),
          userId: data.userId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      setProjects(projs);
    });
    return () => unsubscribe();
  }, [user]);

  const saveProject = async (msgs: Message[], currentFiles: Record<string, string>) => {
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

  const handleSendMessage = async (text: string) => {
    const userMsgId = Date.now().toString();
    const modelMsgId = (Date.now() + 1).toString();
    
    const newMessages: Message[] = [...messages, { id: userMsgId, role: 'user', text }];
    setMessages(newMessages);
    setIsGenerating(true);
    
    if (window.innerWidth < 768) {
      setMobileTab('preview');
    }

    try {
      const contents = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const storedKeys = localStorage.getItem('xbuilder_api_keys');
      const apiKeys: ApiKeys = storedKeys ? JSON.parse(storedKeys) : { gemini: '', openrouter: '', grok: '' };

      const stream = streamWebsiteGeneration(contents, selectedModel, apiKeys, files);
      let fullResponse = "";
      
      const isErrorFix = text.toLowerCase().match(/error|bug|fix|rusak|salah|perbaiki|gagal/);

      const THINKING_STEPS = isErrorFix ? [
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
      ] : [
        "Membaca dan memahami permintaan kamu...",
        "Memikirkan arsitektur yang paling cocok...",
        "Menyiapkan struktur proyek dan library...",
        "Mendesain tampilan UI/UX yang profesional...",
        "Mulai menulis kerangka komponen...",
        "Mengimplementasikan logika utama aplikasi...",
        "Menambahkan styling agar terlihat modern...",
        "Memastikan website responsif di semua perangkat...",
        "Mengecek kembali kode untuk menghindari error...",
        "Menyelesaikan dan merapikan semua file..."
      ];

      setMessages(prev => [...prev, { 
        id: modelMsgId, 
        role: 'model', 
        text: '',
        logs: [{ status: 'active', text: THINKING_STEPS[0] }]
      }]);

      let newFiles = { ...files };
      let hasStartedCode = false;

      for await (const chunk of stream) {
        fullResponse += chunk;
        
        // Calculate progress based on response length. 
        // Assume an average full response is around 3000-4000 characters.
        // We cap it at the last step.
        const progressIndex = Math.min(
          Math.floor(fullResponse.length / 300), 
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

        // Extract explanation (anything outside of ``` blocks) and files
        const fileRegex = /```(?:[a-z]+)?\s*(?:<!--|#|\/\/)?\s*filename:\s*([^\n]+)\n([\s\S]*?)```/gi;
        let tempFiles = { ...files };
        let hasFiles = false;

        // We need to parse all complete file blocks
        const completedBlocks = [...fullResponse.matchAll(fileRegex)];
        for (const m of completedBlocks) {
          const filename = m[1].trim();
          const content = m[2].trim();
          if (content === '') {
            delete tempFiles[filename];
          } else {
            tempFiles[filename] = content;
          }
          hasFiles = true;
        }

        // Also check for standard html block if no filename provided
        if (!hasFiles) {
          const htmlMatch = fullResponse.match(/```(?:html)?\n([\s\S]*?)(```|$)/i);
          if (htmlMatch && htmlMatch[1]) {
            tempFiles['index.html'] = htmlMatch[1];
          }
        }

        newFiles = tempFiles;
        setFiles(newFiles);

        // DO NOT update text yet, only update logs to keep UI clean and fast
        setMessages(prev => prev.map(m => 
          m.id === modelMsgId ? { ...m, text: '', logs: currentLogs } : m
        ));
      }

      // Finalize logs
      const finalLogs: ActionLog[] = THINKING_STEPS.map(step => ({
        status: 'done',
        text: step
      }));

      let finalDisplayText = fullResponse.replace(/```[\s\S]*?(```|$)/g, '').trim();

      const finalMessages = messages.map(m => m).concat([{ id: userMsgId, role: 'user', text }, { 
        id: modelMsgId, 
        role: 'model', 
        text: finalDisplayText,
        logs: finalLogs
      }]);

      setMessages(finalMessages);
      await saveProject(finalMessages, newFiles);

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

  const handleClearChat = () => {
    setMessages([]);
    setFiles({
      'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <script src="https://cdn.tailwindcss.com"></script>\n</head>\n<body>\n  <div class="flex items-center justify-center h-screen bg-[#09090b] text-zinc-300 font-sans">\n    <div class="text-center">\n      <h1 class="text-3xl font-semibold mb-2 text-blue-500">Website Preview</h1>\n      <p class="text-zinc-400">Describe the website you want to build in the chat.</p>\n    </div>\n  </div>\n</body>\n</html>'
    });
    setCurrentProjectId(null);
  };

  const loadProject = (proj: Project) => {
    setCurrentProjectId(proj.id);
    setMessages(proj.messages);
    setFiles(proj.files);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

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

        <div className={`flex-1 overflow-hidden md:w-1/2 lg:w-[45%] ${mobileTab === 'chat' ? 'block' : 'hidden md:block'}`}>
          <ChatPane 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isGenerating={isGenerating} 
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
          />
        </div>

        <div className={`flex-1 overflow-hidden md:w-1/2 lg:w-[55%] ${mobileTab === 'preview' ? 'block' : 'hidden md:block'}`}>
          <PreviewPane 
            files={files} 
            onChangeFiles={setFiles} 
          />
        </div>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </div>
  );
}
