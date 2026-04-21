import { X, User, Palette, HardDrive } from 'lucide-react';
import React from 'react';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AppSettingsModal({ isOpen, onClose }: AppSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[60vh] max-h-[600px]">
        {/* Left Sidebar (Settings Tabs) */}
        <div className="md:w-48 bg-[#09090b] border-r border-zinc-800 flex flex-col shrink-0">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="text-xs font-semibold text-zinc-100 uppercase tracking-widest">Pengaturan Umum</h2>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-800 text-zinc-100 text-xs font-medium">
              <Palette size={14} /> Tampilan
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 text-xs font-medium transition-colors">
              <HardDrive size={14} /> Data & Cache
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 text-xs font-medium transition-colors">
              <User size={14} /> Akun
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="flex-1 flex flex-col bg-[#121214]">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-sm font-medium text-zinc-200">Tampilan</h3>
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
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
              <select className="bg-[#09090b] border border-zinc-700 rounded-md px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-blue-500 hover:border-zinc-500 transition-colors cursor-pointer w-full max-w-[200px]">
                <option value="small">Kecil</option>
                <option value="normal" selected>Normal</option>
                <option value="large">Besar</option>
              </select>
            </div>
            
            <div className="border-t border-zinc-800 pt-6">
               <label className="text-sm font-medium text-zinc-300 block mb-2">Kurangi Animasi (Reduce Motion)</label>
               <label className="relative inline-flex items-center cursor-pointer">
                 <input type="checkbox" className="sr-only peer" />
                 <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 outline-none"></div>
                 <span className="ml-3 text-xs font-medium text-zinc-400">Nonaktifkan</span>
               </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
