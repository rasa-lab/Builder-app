import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, ArrowLeft, Send, User } from 'lucide-react';
import { db, auth, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from '../lib/firebase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanelModal({ isOpen, onClose }: AdminPanelModalProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [activeView, setActiveView] = useState<'menu' | 'project' | 'convert' | 'deploy' | 'leaderboard' | 'group' | 'support'>('menu');

  // Group Chat State
  const [groupMessages, setGroupMessages] = useState<any[]>([]);
  const [newGroupMsg, setNewGroupMsg] = useState('');
  const groupScrollRef = useRef<HTMLDivElement>(null);

  // Support Chat State
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [newSupportMsg, setNewSupportMsg] = useState('');
  const supportScrollRef = useRef<HTMLDivElement>(null);

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  // Project State
  const [allProjects, setAllProjects] = useState<any[]>([]);

  useEffect(() => {
    if (activeView === 'project' && isAdminUnlocked) {
      const q = query(collection(db, 'projects'), orderBy('updatedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAllProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => unsubscribe();
    }
  }, [activeView, isAdminUnlocked]);

  useEffect(() => {
    if (activeView === 'group' && isAdminUnlocked) {
      const q = query(collection(db, 'group_messages'), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setGroupMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => groupScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
      return () => unsubscribe();
    }
  }, [activeView, isAdminUnlocked]);

  useEffect(() => {
    if (activeView === 'support' && isAdminUnlocked) {
      const q = query(collection(db, 'support_messages'), orderBy('createdAt', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setSupportMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => supportScrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      });
      return () => unsubscribe();
    }
  }, [activeView, isAdminUnlocked]);

  useEffect(() => {
    if (activeView === 'leaderboard' && isAdminUnlocked) {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().displayName || doc.data().email || 'Unknown User',
          score: doc.data().projectsCount || 0
        }));
        // Sort by score descending
        users.sort((a, b) => b.score - a.score);
        setLeaderboard(users);
      });
      return () => unsubscribe();
    }
  }, [activeView, isAdminUnlocked]);

  const handleAdminUnlock = () => {
    if (adminPassword === '926285638382789282786527827') {
      setIsAdminUnlocked(true);
      setAdminError('');
    } else {
      setAdminError('Password salah');
    }
  };

  const sendGroupMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupMsg.trim()) return;
    try {
      await addDoc(collection(db, 'group_messages'), {
        text: newGroupMsg,
        userId: auth.currentUser?.uid || 'anonymous',
        userName: auth.currentUser?.displayName || 'Admin',
        createdAt: serverTimestamp()
      });
      setNewGroupMsg('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const sendSupportMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupportMsg.trim()) return;
    try {
      await addDoc(collection(db, 'support_messages'), {
        text: newSupportMsg,
        userId: auth.currentUser?.uid || 'anonymous',
        userName: auth.currentUser?.displayName || 'Admin',
        isAdmin: true,
        createdAt: serverTimestamp()
      });
      setNewSupportMsg('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b] shrink-0">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold">
            {activeView !== 'menu' && isAdminUnlocked && (
              <button onClick={() => setActiveView('menu')} className="mr-2 text-zinc-400 hover:text-white transition-colors">
                <ArrowLeft size={18} />
              </button>
            )}
            <ShieldAlert size={18} className="text-red-500" />
            {activeView === 'menu' ? 'Admin Panel' : activeView.toUpperCase()}
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {!isAdminUnlocked ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Masukkan password admin"
                  className="flex-1 bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
                />
                <button 
                  onClick={handleAdminUnlock}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all active:scale-95"
                >
                  Buka
                </button>
              </div>
              {adminError && <p className="text-xs text-red-400 mt-1">{adminError}</p>}
            </div>
          ) : (
            <>
              {activeView === 'menu' && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="text-xs font-semibold text-red-400 mb-2">ADMIN PANEL TERBUKA</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setActiveView('project')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-200 text-center active:scale-95 transition-transform border border-zinc-700/50">PROJECT</button>
                    <button onClick={() => setActiveView('convert')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-200 text-center active:scale-95 transition-transform border border-zinc-700/50">CONVERT</button>
                    <button onClick={() => setActiveView('deploy')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-200 text-center active:scale-95 transition-transform border border-zinc-700/50">DEPLOY</button>
                    <button onClick={() => setActiveView('leaderboard')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-200 text-center active:scale-95 transition-transform border border-zinc-700/50">PAPAN PERINGKAT</button>
                    <button onClick={() => setActiveView('group')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-200 text-center active:scale-95 transition-transform border border-zinc-700/50">GROUP</button>
                    <button onClick={() => setActiveView('support')} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs font-medium text-zinc-200 text-center active:scale-95 transition-transform border border-zinc-700/50">CUSTOMER SERVICE</button>
                  </div>
                </div>
              )}

              {activeView === 'project' && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-zinc-400 mb-2">SEMUA PROJECT ({allProjects.length})</div>
                  {allProjects.map((proj) => (
                    <div key={proj.id} className="flex flex-col p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                      <span className="text-sm font-medium text-zinc-200">{proj.name}</span>
                      <span className="text-[10px] text-zinc-500 mt-1">ID: {proj.id}</span>
                      <span className="text-[10px] text-zinc-500">User: {proj.userId}</span>
                    </div>
                  ))}
                  {allProjects.length === 0 && (
                    <div className="text-center py-8 text-zinc-500 text-xs">Belum ada project.</div>
                  )}
                </div>
              )}

              {activeView === 'convert' && (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  <p>Konversi ke APK</p>
                  <button onClick={() => { onClose(); window.dispatchEvent(new Event('open_apk_config')); }} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-500 transition-colors">Buka Konfigurasi APK</button>
                </div>
              )}

              {activeView === 'deploy' && (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  <p>Deploy Project</p>
                  <button onClick={() => { onClose(); window.dispatchEvent(new Event('open_netlify_deploy')); }} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-500 transition-colors">Buka Netlify Deploy</button>
                </div>
              )}

              {activeView === 'leaderboard' && (
                <div className="space-y-2">
                  {leaderboard.map((user, index) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : index === 1 ? 'bg-zinc-300/20 text-zinc-300' : index === 2 ? 'bg-amber-600/20 text-amber-600' : 'bg-zinc-800 text-zinc-500'}`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium text-zinc-200">{user.name}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-400">{user.score} pts</span>
                    </div>
                  ))}
                </div>
              )}

              {activeView === 'group' && (
                <div className="flex flex-col h-[400px]">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                    {groupMessages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.userId === auth.currentUser?.uid ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-zinc-500 mb-1 ml-1">{msg.userName}</span>
                        <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${msg.userId === auth.currentUser?.uid ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={groupScrollRef} />
                  </div>
                  <form onSubmit={sendGroupMessage} className="flex gap-2 shrink-0">
                    <input 
                      type="text" 
                      value={newGroupMsg}
                      onChange={(e) => setNewGroupMsg(e.target.value)}
                      placeholder="Ketik pesan..."
                      className="flex-1 bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                    <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors active:scale-95">
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              )}

              {activeView === 'support' && (
                <div className="flex flex-col h-[400px]">
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                    {supportMessages.map((msg) => (
                      <div key={msg.id} className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-zinc-500 mb-1 ml-1">{msg.isAdmin ? 'Admin' : msg.userName}</span>
                        <div className={`px-3 py-2 rounded-xl text-sm max-w-[85%] ${msg.isAdmin ? 'bg-red-600 text-white rounded-tr-sm' : 'bg-zinc-800 text-zinc-200 rounded-tl-sm'}`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={supportScrollRef} />
                  </div>
                  <form onSubmit={sendSupportMessage} className="flex gap-2 shrink-0">
                    <input 
                      type="text" 
                      value={newSupportMsg}
                      onChange={(e) => setNewSupportMsg(e.target.value)}
                      placeholder="Balas sebagai Admin..."
                      className="flex-1 bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500 text-sm"
                    />
                    <button type="submit" className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors active:scale-95">
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

