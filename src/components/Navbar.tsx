import React from 'react';
import { ShieldCheck, Sparkles, LogIn, LogOut, Plus, Lock, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenSecurityModal: () => void;
  onOpenMemoryPalace: () => void;
  onNewJournal: () => void;
  knowledgeCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenSecurityModal, 
  onOpenMemoryPalace, 
  onNewJournal,
  knowledgeCount = 0
}) => {
  const { user, isFirebaseLive, signInWithGoogle, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base tracking-tight text-white">Personal Gemini Journal</h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Zero-Trust
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden md:block">
              Server-Side AI • Firestore Document DB • Secret Manager Backed
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Memory Palace (Agent Knowledge Hub) Gimmick Button */}
          {user && (
            <button
              id="memory-palace-btn"
              onClick={onOpenMemoryPalace}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-sm shadow-indigo-500/20 transition"
              title="Open Memory Palace (Agent Knowledge Hub)"
            >
              <span>🧠 Memory Palace</span>
              {knowledgeCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded-full font-bold">
                  {knowledgeCount}
                </span>
              )}
            </button>
          )}

          {/* Security & Isolation Audit Inspector */}
          <button
            id="security-audit-btn"
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Inspect Security Directives and Tenant Isolation"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Security Inspector</span>
          </button>

          {/* New Entry Button */}
          <button
            id="new-journal-btn"
            onClick={onNewJournal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>

          {/* Auth State & Switcher */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[120px]">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[120px]">
                  UID: {user.uid.slice(0, 10)}...
                </div>
              </div>
              <button
                id="signout-btn"
                onClick={signOutUser}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="signin-btn"
              onClick={signInWithGoogle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-sky-600 hover:bg-sky-500 text-white transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isFirebaseLive ? 'Sign in with Google' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
