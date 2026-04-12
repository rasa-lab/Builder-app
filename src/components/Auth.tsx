import React, { useState } from 'react';
import { auth, signInWithPopup, db, doc, setDoc, serverTimestamp } from '../lib/firebase';
import { GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { Loader2, Code2, Github, X } from 'lucide-react';

const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();

export function Auth() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGithubTokenOverlay, setShowGithubTokenOverlay] = useState(false);
  const [githubTokenInput, setGithubTokenInput] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'Google User',
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, githubProvider);
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'GitHub User',
        createdAt: serverTimestamp()
      }, { merge: true });
      setShowGithubTokenOverlay(true);
    } catch (err: any) {
      setError(err.message || 'GitHub login failed');
    } finally {
      setLoading(false);
    }
  };

  const saveGithubToken = (skip: boolean) => {
    if (!skip && githubTokenInput.trim()) {
      const storedKeys = localStorage.getItem('xbuilder_api_keys');
      const keys = storedKeys ? JSON.parse(storedKeys) : { gemini: '', openai: '', openrouter: '', grok: '', github: '' };
      keys.github = githubTokenInput.trim();
      localStorage.setItem('xbuilder_api_keys', JSON.stringify(keys));
    }
    setShowGithubTokenOverlay(false);
  };

  if (showGithubTokenOverlay) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="bg-[#18181b] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 animate-in fade-in zoom-in duration-300">
          <h2 className="text-xl font-bold text-white mb-2 text-center">Apakah kamu sudah ada github token?</h2>
          <p className="text-zinc-400 text-xs mb-6 text-center">
            Token ini digunakan untuk mengupload project langsung ke repository GitHub Anda (Opsional).
          </p>
          <input 
            type="password" 
            value={githubTokenInput}
            onChange={(e) => setGithubTokenInput(e.target.value)}
            placeholder="ghp_..."
            className="w-full bg-[#09090b] border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm mb-6"
          />
          <div className="flex gap-3">
            <button 
              onClick={() => saveGithubToken(true)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              Lewati
            </button>
            <button 
              onClick={() => saveGithubToken(false)}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              Iya
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4 font-sans text-zinc-300">
      <div className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30">
            <Code2 size={24} className="text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">X BUILDER</h1>
          <p className="text-zinc-400 text-sm mt-2 text-center">
            Log in to your account to save your projects.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-zinc-200 text-zinc-900 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
            )}
            Continue with Google
          </button>

          <button
            onClick={handleGithubLogin}
            disabled={loading}
            className="w-full bg-[#24292e] hover:bg-[#2f363d] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Github size={20} />
            )}
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
