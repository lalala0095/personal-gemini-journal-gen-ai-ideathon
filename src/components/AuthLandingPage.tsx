import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Brain, 
  Lock, 
  BookOpen, 
  MessageSquare, 
  KeyRound, 
  CheckCircle2, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthLandingPageProps {
  onOpenSecurityModal: () => void;
}

export const AuthLandingPage: React.FC<AuthLandingPageProps> = ({ onOpenSecurityModal }) => {
  const { signInWithGoogle, signInWithSandbox, error } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || 'Sign in with Google failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSandboxSignIn = () => {
    setAuthError(null);
    signInWithSandbox('Security Architect', 'architect@journal.internal');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500/30">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
                Zero Browser Secret Exposure • Firestore Document DB • Gemini 2.5 Flash
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSecurityModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              <span>Security Inspector</span>
            </button>

            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Signing In...' : 'Sign In with Google'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Overview */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-12 flex flex-col justify-center">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>OAuth & Rate-Gated Introspection Environment</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white">
            Your Private Introspective Journal & <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400">Agent Memory Palace</span>
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            A reflective personal sanctuary powered by server-side Gemini 2.5 Flash. Write freely with real-time DLP privacy guards, converse with a thoughtful brainstorming partner, and preserve your evolving goals in a zero-trust long-term knowledge hub.
          </p>

          {/* Authentication Action Box */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="hero-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSigningIn ? 'Authenticating with Google...' : 'Sign In with Google to Enter'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="hero-sandbox-btn"
              onClick={handleSandboxSignIn}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
              title="Test with an authenticated tenant session"
            >
              <KeyRound className="w-3.5 h-3.5 text-sky-400" />
              <span>Launch Authenticated Sandbox</span>
            </button>
          </div>

          {(authError || error) && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-center gap-2 max-w-md mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError || error}</span>
            </div>
          )}
        </div>

        {/* 3 Core Isolations & Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Dashboard Tab Overview */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition space-y-4">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-sky-400 uppercase tracking-wider font-semibold">Tab 1</div>
              <h3 className="text-base font-semibold text-white mt-0.5">Reflection Dashboard</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Synthesize your mental patterns, emotional clarity scores, recent breakthroughs, and executive action items across all recorded sessions.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Emotional Tone & Clarity Metrics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Interactive Habit & Action Plan</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-Trust Database Telemetry</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Journal Tab Overview */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-indigo-400 uppercase tracking-wider font-semibold">Tab 2</div>
              <h3 className="text-base font-semibold text-white mt-0.5">Private Journaling Studio</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Distraction-free Markdown editor guarded by client-side DLP regex sanitizers, autosaving directly to per-user isolated Firestore subcollections.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Client-Side Token DLP Scanner</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Firestore `/users/{'{uid}'}/journals`</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>SHA-256 Tamper-Evident Signatures</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Brainstorming Partner Tab Overview */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition space-y-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono text-purple-400 uppercase tracking-wider font-semibold">Tab 3</div>
              <h3 className="text-base font-semibold text-white mt-0.5">Gemini Brainstorming Partner</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Multi-turn conversational partner with persistent memory. Grounded in your evolving Memory Palace knowledge nodes without data leakage.
            </p>
            <ul className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800/60">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Server-Side Gemini 2.5 Flash Proxy</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Knowledge Hub Memory Integration</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rate-Guarded (35 req/min Sliding Window)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Zero-Trust Architecture Guarantee Banner */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-200">OAuth & STRIDE Compliant Security Constitution:</strong> Anonymous direct chats and cross-user data scraping are strictly prohibited. Every request requires verified user credentials.
            </div>
          </div>
          <button
            onClick={onOpenSecurityModal}
            className="shrink-0 text-sky-400 hover:text-sky-300 underline underline-offset-4 font-medium"
          >
            Review Security Audit Spec &rarr;
          </button>
        </div>
      </main>
    </div>
  );
};
