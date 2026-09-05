import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  LogIn, 
  LogOut, 
  Plus, 
  Lock, 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'dashboard' | 'journals' | 'brainstorm';

interface NavbarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onOpenSecurityModal: () => void;
  onOpenMemoryPalace: () => void;
  onNewJournal: () => void;
  knowledgeCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab,
  onChangeTab,
  onOpenSecurityModal, 
  onOpenMemoryPalace, 
  onNewJournal,
  knowledgeCount = 0
}) => {
  const { user, isFirebaseLive, signInWithGoogle, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <div 
            onClick={() => onChangeTab('dashboard')} 
            className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white cursor-pointer hover:opacity-90 transition"
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="hidden lg:block">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-base tracking-tight text-white cursor-pointer" onClick={() => onChangeTab('dashboard')}>
                Personal Gemini Journal
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" /> Private & Secure
              </span>
            </div>
          </div>
        </div>

        {/* 3 Main Isolated Tabs (Visible when authenticated) */}
        {user && (
          <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              id="tab-dashboard-btn"
              onClick={() => onChangeTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              id="tab-journals-btn"
              onClick={() => onChangeTab('journals')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'journals'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Journals</span>
            </button>

            <button
              id="tab-brainstorm-btn"
              onClick={() => onChangeTab('brainstorm')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'brainstorm'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Brainstorming Partner</span>
            </button>
          </nav>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Knowledge Hub Button */}
          {user && (
            <button
              id="memory-palace-btn"
              onClick={onOpenMemoryPalace}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-sm shadow-indigo-500/20 transition"
              title="Open Knowledge & Context Hub"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Knowledge Hub</span>
              {knowledgeCount > 0 && (
                <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded-full font-bold">
                  {knowledgeCount}
                </span>
              )}
            </button>
          )}

          {/* Privacy & Security Modal Button */}
          <button
            id="security-audit-btn"
            onClick={onOpenSecurityModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Privacy and Data Protection"
          >
            <Lock className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Privacy & Security</span>
          </button>

          {/* New Entry Button */}
          {user && (
            <button
              id="new-journal-btn"
              onClick={() => {
                onNewJournal();
                onChangeTab('journals');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Entry</span>
            </button>
          )}

          {/* Auth State & Switcher */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="text-right hidden xl:block">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[110px]">
                  {user.displayName}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate max-w-[110px]">
                  {user.uid.slice(0, 8)}...
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
