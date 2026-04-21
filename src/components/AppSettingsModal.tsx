import { X, User, Palette, HardDrive, MessageCircle, Users, Trophy, Battery } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { db, auth, collection, doc, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, getDoc } from '../lib/firebase';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSettingsModal({ isOpen, onClose }: AppSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'tampilan' | 'data' | 'profil' | 'service' | 'group' | 'leaderboard' | 'limit'>('tampilan');
  const [queriesUsed, setQueriesUsed] = useState(0);

  // States for Profil
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');

  // States for Service
  const [serviceMsgs, setServiceMsgs] = useState<any[]>([]);
  const [serviceInput, setServiceInput] = useState('');
  const serviceEndRef = React.useRef<HTMLDivElement>(null);

  // States for Group
  const [groupMsgs, setGroupMsgs] = useState<any[]>([]);
  const [groupInput, setGroupInput] = useState('');
  const groupEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'profil' && auth.currentUser) {
       getDoc(doc(db, 'users', auth.currentUser.uid)).then(docSnap => {
          if (docSnap.exists()) {
             setDisplayName(docSnap.data().displayName || '');
             setBio(docSnap.data().bio || '');
          }
       })
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (activeTab === 'service' && auth.currentUser && isOpen) {
       const q = query(collection(db, `service_messages_${auth.currentUser.uid}`), orderBy('createdAt', 'asc'));
       return onSnapshot(q, snap => {
          setServiceMsgs(snap.docs.map(d => ({id: d.id, ...d.data()})));
          setTimeout(() => serviceEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
       });
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (activeTab === 'group' && isOpen) {
       const q = query(collection(db, 'group_messages'), orderBy('createdAt', 'asc'));
       return onSnapshot(q, snap => {
          setGroupMsgs(snap.docs.map(d => ({id: d.id, ...d.data()})));
          setTimeout(() => groupEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
       });
    }
  }, [activeTab, isOpen]);

  const saveProfile = async () => {
     if(auth.currentUser) {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
           displayName,
           bio
        }, { merge: true });
        const btn = document.getElementById('saveProfileBtn');
        if (btn) {
          btn.innerText = 'Tersimpan!';
          btn.classList.add('bg-green-600', 'hover:bg-green-500');
          btn.classList.remove('bg-blue-600', 'hover:bg-blue-500');
          setTimeout(() => {
             btn.innerText = 'Simpan Profil';
             btn.classList.remove('bg-green-600', 'hover:bg-green-500');
             btn.classList.add('bg-blue-600', 'hover:bg-blue-500');
          }, 2000);
        }
     }
  }

  const sendServiceMsg = async () => {
    if(!serviceInput.trim() || !auth.currentUser) return;
    await addDoc(collection(db, `service_messages_${auth.currentUser.uid}`), {
       text: serviceInput,
       createdAt: serverTimestamp(),
       senderId: auth.currentUser.uid,
       isAdmin: false
    });
    setServiceInput('');
  }

  const sendGroupMsg = async () => {
    if(!groupInput.trim() || !auth.currentUser) return;
    await addDoc(collection(db, `group_messages`), {
       text: groupInput,
       createdAt: serverTimestamp(),
       senderId: auth.currentUser.uid,
       senderName: displayName || auth.currentUser.email || 'User User'
    });
    setGroupInput('');
  }

  useEffect(() => {
    const updateLimit = () => {
      try {
        const today = new Date().toDateString();
        const storedLimit = localStorage.getItem('xbuilder_queries');
        if (storedLimit) {
          const queryData = JSON.parse(storedLimit);
          if (queryData.date === today) {
            setQueriesUsed(queryData.count);
          } else {
            setQueriesUsed(0);
          }
        }
      } catch (e) {}
    };
    if (isOpen) {
      updateLimit();
    }
    window.addEventListener('limit_updated', updateLimit);
    return () => window.removeEventListener('limit_updated', updateLimit);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex bg-[#09090b]">
      <div className="w-full h-full shadow-2xl overflow-hidden flex flex-col md:flex-row bg-[#18181b]">
        {/* Left Sidebar (Settings Tabs) */}
        <div className="w-full md:w-64 bg-[#09090b] border-b md:border-b-0 md:border-r border-zinc-800 flex flex-col shrink-0">
          <div className="p-4 md:p-6 border-b border-zinc-800 flex justify-between md:justify-start items-center">
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Pengaturan Umum</h2>
            <button onClick={onClose} className="md:hidden p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-2 md:p-4 flex gap-1 overflow-x-auto md:flex-col md:space-y-2 md:overflow-y-auto w-full hide-scrollbar">
            <button 
              onClick={() => setActiveTab('tampilan')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeTab === 'tampilan' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
            >
              <Palette size={14} /> Tampilan
            </button>
            <button 
              onClick={() => setActiveTab('profil')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeTab === 'profil' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
            >
              <User size={14} /> Profil
            </button>
            <button 
              onClick={() => setActiveTab('limit')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeTab === 'limit' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
            >
              <Battery size={14} /> Limit
            </button>
            <button 
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeTab === 'leaderboard' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
            >
              <Trophy size={14} /> Papan Peringkat
            </button>
            <button 
              onClick={() => setActiveTab('service')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeTab === 'service' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
            >
              <MessageCircle size={14} /> Service (Chat Admin)
            </button>
            <button 
              onClick={() => setActiveTab('group')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeTab === 'group' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
            >
              <Users size={14} /> Group
            </button>
            <button 
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${activeTab === 'data' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'}`}
            >
              <HardDrive size={14} /> Data & Cache
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col bg-[#09090b]">
          <div className="h-16 px-4 md:px-6 border-b border-zinc-800 flex justify-between items-center bg-[#121214] shrink-0">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex-1">
              {activeTab === 'leaderboard' ? 'Papan Peringkat' : activeTab === 'data' ? 'Data & Cache' : activeTab}
            </h3>
            <button onClick={onClose} className="hidden md:block p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors group">
              <X size={20} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
          <div className="p-4 md:p-8 overflow-y-auto flex-1 space-y-6">
            
            {activeTab === 'tampilan' && (
              <>
                <div>
                  <label className="text-sm font-medium text-zinc-300 block mb-2">Tema Aplikasi</label>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 rounded-lg bg-blue-600 border border-blue-500 text-white text-xs font-medium hover:bg-blue-500 transition-colors">
                      Gelap (Dark)
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-[#09090b] border border-zinc-700 text-zinc-400 text-xs font-medium cursor-not-allowed opacity-50" title="Akan datang">
                      Terang (Light)
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-2">Tema terang saat ini masih dalam tahap persiapan.</p>
                </div>

                <div className="border-t border-zinc-800 pt-6">
                  <label className="text-sm font-medium text-zinc-300 block mb-2">Ukuran Font Editor</label>
                  <select defaultValue="normal" className="bg-[#09090b] border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500 hover:border-zinc-500 transition-colors cursor-pointer w-full max-w-[200px]">
                    <option value="small">Kecil</option>
                    <option value="normal">Normal</option>
                    <option value="large">Besar</option>
                  </select>
                </div>
              </>
            )}

            {activeTab === 'profil' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 overflow-hidden">
                    <User size={24} className="text-zinc-500" />
                  </div>
                  <button onClick={() => alert("Sistem: Pilih file foto untuk diunggah (Max 5MB)")} className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-medium text-zinc-300 transition-colors">
                    Ubah Foto
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1">Nama Tampilan</label>
                  <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200" placeholder="Nama Pengguna" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-1">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-[#09090b] border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 h-20 resize-none" placeholder="Tulis sesuatu tentang Anda..."></textarea>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={saveProfile}
                    id="saveProfileBtn"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium text-sm transition-colors"
                  >
                    Simpan Profil
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'limit' && (
              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-zinc-200 font-medium">Batas Penggunaan Harian</h4>
                    <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-blue-500/30">Free Plan</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">{10 - queriesUsed}</span>
                    <span className="text-zinc-400 text-sm mb-1">/ 10 Kueri tersisa</span>
                  </div>
                  <div className="w-full bg-[#09090b] rounded-full h-2 mb-4 border border-zinc-800">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${(queriesUsed / 10) * 100}%` }}></div>
                  </div>
                  <p className="text-xs text-zinc-400">Default limit adalah 10 kueri per hari. Upgrade akun untuk limit tidak terbatas (Segera Hadir).</p>
                </div>
                
                <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Statistik Akun</h4>
                  <ul className="text-xs text-zinc-400 space-y-2">
                    <li className="flex justify-between"><span>Total Kueri Terbuat Hari Ini:</span> <span className="text-zinc-200">{queriesUsed}</span></li>
                    <li className="flex justify-between"><span>Reset Berikutnya:</span> <span className="text-zinc-200">Waktu Lokal (00:00)</span></li>
                  </ul>
                </div>
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400">Peringkat penggunaan sistem AI secara global. Hanya menampilkan Top 10.</p>
                <div className="bg-[#09090b] border border-zinc-800 rounded-lg divide-y divide-zinc-800">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-center text-sm font-bold ${i === 1 ? 'text-yellow-500' : i === 2 ? 'text-gray-400' : i === 3 ? 'text-amber-600' : 'text-zinc-600'}`}>#{i}</span>
                        <div className="w-8 h-8 rounded-full bg-zinc-800"></div>
                        <span className="text-sm font-medium text-zinc-300">User {100-i}</span>
                      </div>
                      <span className="text-xs font-medium text-blue-400">{1000 - (i * 50)} Kueri</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'service' && (
              <div className="flex flex-col h-full space-y-4 mt-2">
                <div className="flex-1 overflow-y-auto bg-[#09090b] border border-zinc-800 rounded-lg p-4 flex flex-col space-y-3 min-h-[250px] max-h-[400px]">
                  <div className="self-start bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2 text-sm text-zinc-200 max-w-[80%]">
                    Halo! Ada masalah apa dengan X BUILDER? Ada yang bisa admin bantu?
                  </div>
                  {serviceMsgs.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.isAdmin ? 'self-start items-start' : 'self-end items-end'}`}>
                      <div className={`${msg.isAdmin ? 'bg-zinc-800 rounded-tl-sm' : 'bg-blue-600 rounded-tr-sm'} rounded-2xl px-4 py-2 text-sm text-zinc-200 max-w-[80%] shadow-md`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={serviceEndRef} />
                </div>
                <div className="flex gap-2">
                  <input type="text" value={serviceInput} onChange={(e) => setServiceInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendServiceMsg()} className="flex-1 bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" placeholder="Ketik pesan ke admin..." />
                  <button 
                    onClick={sendServiceMsg}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors"
                  >Kirim</button>
                </div>
              </div>
            )}

            {activeTab === 'group' && (
              <div className="flex flex-col h-full space-y-4 mt-2">
                <div className="flex items-center gap-2 pb-2 mb-2 border-b border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Komunitas X BUILDER Global</span>
                </div>
                <div className="flex-1 overflow-y-auto bg-[#09090b] border border-zinc-800 rounded-lg p-4 flex flex-col space-y-3 min-h-[250px] max-h-[400px]">
                    <div className="flex justify-center mb-4">
                       <span className="text-xs text-zinc-600 bg-zinc-900 px-3 py-1 rounded-full">Selamat datang di Grup Pengguna!</span>
                    </div>
                    {groupMsgs.map((msg, i) => (
                      <div key={i} className={`flex flex-col ${msg.senderId === auth.currentUser?.uid ? 'self-end items-end' : 'self-start items-start'} max-w-[85%]`}>
                        {msg.senderId !== auth.currentUser?.uid && <span className="text-[10px] text-zinc-500 ml-1 mb-0.5">{msg.senderName}</span>}
                        <div className={`${msg.senderId === auth.currentUser?.uid ? 'bg-blue-600 rounded-tr-sm' : 'bg-zinc-800 rounded-tl-sm'} rounded-2xl px-4 py-2 text-sm text-zinc-200 shadow-md`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    <div ref={groupEndRef} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button onClick={() => alert("Pilih foto untuk diunggah (Maks 5MB)")} className="shrink-0 flex items-center justify-center w-10 h-10 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors" title="Kirim Foto (Max 5MB)">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </button>
                    <button onClick={() => alert("Pilih file untuk dilampirkan")} className="shrink-0 flex items-center justify-center w-10 h-10 border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors" title="Kirim File">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    </button>
                    <input type="text" value={groupInput} onChange={(e) => setGroupInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendGroupMsg()} className="flex-1 bg-[#09090b] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500" placeholder="Ketik pesan komunitas..." />
                    <button onClick={sendGroupMsg} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-sm transition-colors">Kirim</button>
                  </div>
                  <p className="text-[10px] text-zinc-500">Maksimal ukuran foto 5MB. Tetap patuhi aturan grup.</p>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#09090b] border border-zinc-800 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-zinc-300">Penyimpanan Cache Aplikasi</span>
                    <span className="text-xs text-zinc-500">~12 MB</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 w-1/4 h-full"></div>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button onClick={() => alert('Sistem: Cache aplikasi berhasil dibersihkan.')} className="px-3 py-1.5 border border-red-500/50 text-red-400 hover:bg-red-500/10 rounded transition-colors text-xs font-medium">Bersihkan Cache</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
