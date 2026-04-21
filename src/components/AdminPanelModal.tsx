import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, Users, MessageCircle, Database, Trash2, Ban } from 'lucide-react';
import { db, auth, collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from '../lib/firebase';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanelModal({ isOpen, onClose }: AdminPanelModalProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [activeView, setActiveView] = useState<'menu' | 'service' | 'group' | 'data'>('menu');

  const handleAdminUnlock = () => {
    if (adminPassword === '926285638382789282786527827') {
      setIsAdminUnlocked(true);
      setAdminError('');
    } else {
      setAdminError('Password salah');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex bg-[#09090b]">
      <div className="w-full h-full flex flex-col relative">
        
        {!isAdminUnlocked ? (
          <div className="flex-1 flex flex-col justify-center items-center p-8 bg-[#09090b]">
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition">
              <X size={24} />
            </button>
            <ShieldAlert size={64} className="text-red-500 mb-6" />
            <h2 className="text-2xl font-bold text-red-500 mb-2">OTORISASI ADMIN</h2>
            <p className="text-sm text-zinc-400 mb-8 text-center max-w-md">Area terlarang. Hanya admin yang diizinkan untuk melihat, mengubah, atau menghapus data sistem.</p>
            <div className="w-full max-w-sm space-y-4">
              <input 
                type="password" 
                placeholder="Masukkan Sandi Admin" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdminUnlock()}
                className="w-full bg-[#18181b] border border-red-900/40 rounded-xl px-4 py-3 text-zinc-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-medium"
              />
              {adminError && <p className="text-xs text-red-400 text-center font-medium">{adminError}</p>}
              <button 
                onClick={handleAdminUnlock}
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-transform active:scale-95"
              >
                Konfirmasi
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row w-full h-full bg-[#18181b] overflow-hidden">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-[#18181b] border-b md:border-b-0 md:border-r border-red-900/30 flex flex-col shrink-0">
              <div className="p-4 md:p-6 border-b border-red-900/30 flex items-center justify-between md:justify-start gap-3">
                <div className="flex items-center gap-3">
                  <ShieldAlert size={20} className="text-red-500" />
                  <h2 className="text-sm md:text-base font-bold text-red-500 tracking-widest hidden md:block">ADMIN PANEL</h2>
                  <h2 className="text-sm md:text-base font-bold text-red-500 tracking-widest md:hidden">ADMIN</h2>
                </div>
                <button onClick={onClose} className="md:hidden p-2 bg-red-900/20 rounded-lg text-red-400 hover:bg-red-900/40 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-2 md:p-4 flex gap-2 overflow-x-auto md:flex-col md:space-y-2 md:overflow-y-auto w-full hide-scrollbar">
                <button 
                  onClick={() => setActiveView('service')}
                  className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${activeView === 'service' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200 border border-transparent'}`}
                >
                  <MessageCircle size={16} className="md:w-[18px] md:h-[18px]" /> Service
                </button>
                <button 
                  onClick={() => setActiveView('group')}
                  className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${activeView === 'group' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200 border border-transparent'}`}
                >
                  <Users size={16} className="md:w-[18px] md:h-[18px]" /> Pantau Group
                </button>
                <button 
                  onClick={() => setActiveView('data')}
                  className={`flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${activeView === 'data' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200 border border-transparent'}`}
                >
                  <Database size={16} className="md:w-[18px] md:h-[18px]" /> Data & Log
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 flex flex-col bg-[#09090b] relative w-full overflow-hidden">
              <div className="h-16 px-4 md:px-6 border-b border-zinc-800 flex justify-between items-center bg-[#121214] shrink-0">
                <h3 className="text-xs md:text-sm font-bold text-zinc-100 uppercase tracking-widest truncate">
                  {activeView === 'menu' && 'Menu Utama Administrasi'}
                  {activeView !== 'menu' && activeView}
                </h3>
                <button onClick={onClose} className="hidden md:block p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-red-600 hover:text-white transition-colors group shrink-0 ml-2">
                  <X size={20} className="group-hover:rotate-90 transition-transform" />
                </button>
              </div>

              <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                {activeView === 'menu' && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-zinc-500 text-sm font-medium">Silakan pilih menu di panel sebelah kiri untuk memulai tugas administratif.</p>
                  </div>
                )}

                {activeView === 'service' && (
                  <div className="h-full flex flex-col bg-[#121214] border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                       <h4 className="font-semibold text-zinc-200">Terminal Customer Service</h4>
                       <p className="text-xs text-zinc-500 mt-1">Sistem komunikasi terpadu untuk merespons pelaporan pengguna secara real-time.</p>
                    </div>
                    <div className="flex-1 p-6 flex flex-col items-center justify-center">
                      <MessageCircle size={48} className="text-zinc-700 mb-4" />
                      <p className="text-sm text-zinc-500">Antrean pesan keluhan pengguna saat ini kosong.</p>
                    </div>
                  </div>
                )}

                {activeView === 'group' && (
                  <div className="space-y-6 h-full flex flex-col">
                    <div className="flex flex-wrap gap-4">
                      <button 
                        onClick={() => alert("Sistem: Memulai proses penghapusan seluruh riwayat grup secara permanen. Tindakan ini memerlukan otorisasi lanjutan.")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 hover:bg-red-500 transition-all active:scale-95"
                      >
                        <Trash2 size={16} /> Sapu Bersih Chat Group (Clear Firebase)
                      </button>
                      <button 
                        onClick={() => alert("Sistem: Membuka panel kelola daftar hitam (Blacklist).")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#18181b] border border-zinc-700 text-zinc-200 rounded-xl text-sm font-bold shadow-lg hover:border-zinc-500 transition-all active:scale-95"
                      >
                        <Ban size={16} /> Kelola Daftar Hitam (Blacklist)
                      </button>
                    </div>
                    <div className="flex-1 bg-[#121214] border border-zinc-800 rounded-2xl p-6 overflow-y-auto flex flex-col items-center justify-center">
                      <Users size={48} className="text-zinc-700 mb-4" />
                      <p className="text-sm text-zinc-500">Log pesan grup publik akan ditampilkan di sini. Monitoring aktif diaktifkan.</p>
                    </div>
                  </div>
                )}

                {activeView === 'data' && (
                  <div className="space-y-6 h-full flex flex-col">
                     <div className="bg-[#18181b] border border-zinc-800 rounded-2xl p-5">
                       <p className="text-sm text-zinc-300 font-medium">Modul Keamanan & Analytics: <span className="text-red-400">Aktif</span></p>
                       <p className="text-xs text-zinc-500 mt-1">Merekam segala bentuk injeksi, multi-login, IP abnormal, beserta lokasi GPS (jika diizinkan). Gunakan data ini dengan bijak untuk memblokir bot / ancaman sistem.</p>
                     </div>
                     <div className="flex-1 overflow-x-auto bg-[#121214] border border-zinc-800 rounded-2xl relative">
                      <table className="w-full text-left text-sm text-zinc-300 min-w-[800px]">
                        <thead className="bg-[#18181b] text-zinc-400 border-b border-zinc-800 sticky top-0 z-10 font-semibold">
                          <tr>
                            <th className="p-4">ID/Nama Pengguna</th>
                            <th className="p-4">Autentikasi (Email)</th>
                            <th className="p-4">Akses Terakhir (IP/Log)</th>
                            <th className="p-4">Jumlah Kueri</th>
                            <th className="p-4">Indikasi Bahaya</th>
                            <th className="p-4">Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                            <td className="p-4 text-center font-medium text-zinc-500" colSpan={6}>Memuat log terbaru dari server... (Saat ini kosong)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
