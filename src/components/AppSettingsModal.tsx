import { X, User, Palette, HardDrive, MessageCircle, Users, Trophy, Battery, Package, Radio } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { db, auth, collection, doc, addDoc, onSnapshot, query, orderBy, serverTimestamp, setDoc, getDoc, getDocs, where } from '../lib/firebase';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPlan: { plan: string; limit: number };
}

export function AppSettingsModal({ isOpen, onClose, userPlan }: AppSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'tampilan' | 'data' | 'profil' | 'service' | 'group' | 'leaderboard' | 'limit' | 'paket' | 'broadcast'>('tampilan');

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

  // States for Paket
  const [reedemCode, setReedemCode] = useState('');
  // removed duplicate userPlan local state

  // States for Broadcast
  const [broadcasts, setBroadcasts] = useState<any[]>([]);

  useEffect(() => {
    if ((activeTab === 'profil' || activeTab === 'limit' || activeTab === 'paket') && auth.currentUser) {
       getDoc(doc(db, 'users', auth.currentUser.uid)).then(docSnap => {
          if (docSnap.exists()) {
             setDisplayName(docSnap.data().displayName || '');
             setBio(docSnap.data().bio || '');
          }
       })
    }
  }, [activeTab, isOpen]);

  useEffect(() => {
    if (activeTab === 'broadcast' && isOpen) {
       const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'));
       return onSnapshot(q, snap => {
          setBroadcasts(snap.docs.map(d => ({id: d.id, ...d.data()})));
       });
    }
  }, [activeTab, isOpen]);

  const handleReedemCode = async () => {
    if (!reedemCode || !auth.currentUser) return;
    
    try {
      const q = query(collection(db, 'package_codes'), where('code', '==', reedemCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
         alert("Kode tidak ditemukan.");
         return;
      }
      
      const codeDoc = snap.docs[0];
      const codeData = codeDoc.data();
      
      if (codeData.isUsed) {
         alert("Kode sudah terpakai.");
         return;
      }
      
      // Update promo unused state to used state.
      await setDoc(doc(db, 'package_codes', codeDoc.id), { isUsed: true, usedBy: auth.currentUser.uid, usedAt: serverTimestamp() }, { merge: true });
      
      // Update user plan
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
         plan: codeData.package,
         planActivatedAt: serverTimestamp()
      }, { merge: true });
      
      setReedemCode('');
      alert(`Berhasil mengaktifkan paket ${codeData.package.toUpperCase()}!`);

    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan.");
    }
  }

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
    // Limits are now tracked entirely inside DB via App state and passed here
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-none md:rounded-xl w-full max-w-5xl h-full md:h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        
        {/* Mobile Header (Tabs Toggle) */}
        <div className="md:hidden flex flex-col border-b border-zinc-800 bg-[#121214]">
          <div className="flex justify-between items-center p-4">
            <h2 className="font-bold text-zinc-100 flex items-center gap-2">
              Pengaturan Umum
            </h2>
            <button onClick={onClose} className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="flex overflow-x-auto hide-scrollbar border-t border-zinc-800 p-2 gap-1">
            <button onClick={() => setActiveTab('tampilan')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'tampilan' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Tampilan</button>
            <button onClick={() => setActiveTab('profil')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'profil' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Profil</button>
            <button onClick={() => setActiveTab('paket')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'paket' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Paket</button>
            <button onClick={() => setActiveTab('limit')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'limit' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Limit</button>
            <button onClick={() => setActiveTab('broadcast')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'broadcast' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Info</button>
            <button onClick={() => setActiveTab('leaderboard')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'leaderboard' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Leaderboard</button>
            <button onClick={() => setActiveTab('group')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'group' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Group</button>
            <button onClick={() => setActiveTab('service')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'service' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Service</button>
            <button onClick={() => setActiveTab('data')} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${activeTab === 'data' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>Data</button>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 bg-[#121214] border-r border-zinc-800 flex-col shrink-0">
          <div className="p-6 border-b border-zinc-800">
            <h2 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
              Pengaturan
            </h2>
            <p className="text-xs text-zinc-500 mt-1">Konfigurasi akun dan setelan</p>
          </div>
          <div className="p-4 flex flex-col space-y-1 overflow-y-auto flex-1 hide-scrollbar">
            <button onClick={() => setActiveTab('tampilan')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tampilan' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><Palette size={16} /> Tampilan</button>
            <button onClick={() => setActiveTab('profil')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profil' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><User size={16} /> Profil</button>
            <button onClick={() => setActiveTab('paket')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'paket' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><Package size={16} /> Paket Aktif</button>
            <button onClick={() => setActiveTab('limit')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'limit' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><Battery size={16} /> Limit & Kuota</button>
            <button onClick={() => setActiveTab('broadcast')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'broadcast' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><Radio size={16} /> Info & Pesan</button>
            <button onClick={() => setActiveTab('leaderboard')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leaderboard' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><Trophy size={16} /> Leaderboard</button>
            
            <div className="my-2 border-t border-zinc-800/50 pt-2"></div>
            
            <button onClick={() => setActiveTab('group')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'group' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><Users size={16} /> Komunitas (Grup)</button>
            <button onClick={() => setActiveTab('service')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'service' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><MessageCircle size={16} /> Chat Admin</button>
            
            <div className="my-2 border-t border-zinc-800/50 pt-2"></div>
            
            <button onClick={() => setActiveTab('data')} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'data' ? 'bg-zinc-800/80 text-zinc-100 shadow-sm' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}><HardDrive size={16} /> Data & Cache</button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col bg-[#09090b] relative w-full overflow-hidden">
          <div className="h-16 px-4 md:px-6 border-b border-zinc-800 flex justify-between items-center bg-[#121214] shrink-0">
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest flex-1 truncate">
              {activeTab === 'paket' ? 'Status Paket' : activeTab === 'broadcast' ? 'Informasi' : activeTab === 'leaderboard' ? 'Papan Peringkat' : activeTab === 'data' ? 'Data & Cache' : activeTab}
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
                    <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-blue-500/30 uppercase">{userPlan?.plan || 'free'} Plan</span>
                  </div>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-4xl font-bold text-white">{userPlan?.limit || 0}</span>
                    <span className="text-zinc-400 text-sm mb-1">Kueri tersisa</span>
                  </div>
                  <div className="w-full bg-[#09090b] rounded-full h-2 mb-4 border border-zinc-800">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(((userPlan?.limit || 0) / (userPlan?.plan === 'free' ? 10 : userPlan?.plan === 'prem' ? 300 : 999999)) * 100, 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-zinc-400">Limit akun Anda otomatis disesuaikan dengan jenis paket. Hubungi admin jika ada kendala limit.</p>
                </div>
                
                <div className="bg-zinc-800/50 border border-zinc-700/50 p-4 rounded-xl">
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Statistik Akun</h4>
                  <ul className="text-xs text-zinc-400 space-y-2">
                    <li className="flex justify-between"><span>Total Kueri Tersisa Hari Ini:</span> <span className="text-zinc-200">{userPlan?.limit || 0}</span></li>
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

            {activeTab === 'paket' && (
              <div className="space-y-6">
                <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6">
                   <h4 className="font-semibold text-zinc-200 mb-2">Paket Akun Anda Saat Ini</h4>
                   <div className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                     Plan aktif: {userPlan?.plan || 'free'}
                   </div>
                   <p className="text-sm text-zinc-400 mb-6">Nikmati akses prioritas dan limit ekstra menggunakan kode langganan Anda.</p>

                   <div className="flex gap-2">
                     <input type="text" value={reedemCode} onChange={(e) => setReedemCode(e.target.value)} className="flex-1 bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 uppercase font-mono" placeholder="MASUKAN-KODE-AKTIVASI" />
                     <button onClick={handleReedemCode} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors shadow-lg">Pakai Kode</button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="bg-[#09090b] border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-colors">
                     <div className="flex justify-between items-start mb-4">
                       <h4 className="font-bold text-zinc-100 uppercase tracking-widest text-sm">Paket Prem</h4>
                       <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">Rp 6.000</span>
                     </div>
                     <ul className="space-y-2 mb-6">
                        <li className="flex items-center gap-2 text-xs text-zinc-400"><Battery size={14} className="text-zinc-500"/> Tambahan 300 Limit Kuota / Hari</li>
                        <li className="flex items-center gap-2 text-xs text-zinc-400"><User size={14} className="text-zinc-500"/> Masa berlaku 1 Tahun</li>
                     </ul>
                   </div>
                   <div className="bg-gradient-to-br from-[#121214] to-[#09090b] border border-blue-900/50 rounded-2xl p-5 relative overflow-hidden">
                     <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/10 blur-xl rounded-full"></div>
                     <div className="flex justify-between items-start mb-4 relative z-10">
                       <h4 className="font-bold text-zinc-100 uppercase tracking-widest text-sm flex items-center gap-2">Paket Pro <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-transparent bg-clip-text text-[10px]">TERBAIK</span></h4>
                       <span className="text-xs font-bold text-white bg-blue-600 px-2 py-1 rounded shadow-lg shadow-blue-600/20">Rp 11.000</span>
                     </div>
                     <ul className="space-y-2 mb-6 relative z-10">
                        <li className="flex items-center gap-2 text-xs text-zinc-400"><Trophy size={14} className="text-blue-400"/> Akses Limit Sepenuhnya UNLIMITED</li>
                        <li className="flex items-center gap-2 text-xs text-zinc-400"><Palette size={14} className="text-blue-400"/> Fitur Premium Penuh</li>
                        <li className="flex items-center gap-2 text-xs text-zinc-400"><User size={14} className="text-zinc-500"/> Masa berlaku 1 Tahun</li>
                     </ul>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'broadcast' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 mb-4 border-b border-zinc-800">
                  <Radio size={16} className="text-blue-500" />
                  <span className="text-sm font-semibold text-zinc-200">Kotak Masuk Server</span>
                </div>
                {broadcasts.length === 0 ? (
                  <div className="bg-[#09090b] border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <Radio size={32} className="text-zinc-700 mb-3" />
                    <p className="text-sm font-medium text-zinc-400">Tidak ada pengumuman terbaru</p>
                    <p className="text-xs text-zinc-600 mt-1">Pesan dari administrasi akan muncul di sini.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {broadcasts.map((b) => (
                      <div key={b.id} className="bg-[#121214] border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors">
                        <h4 className="font-bold text-zinc-200 text-sm mb-1">{b.title}</h4>
                        <p className="text-zinc-400 text-xs mb-3 leading-relaxed">{b.message}</p>
                        <p className="text-[10px] text-zinc-600 font-medium">1 Sistem Notifikasi</p>
                      </div>
                    ))}
                  </div>
                )}
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
