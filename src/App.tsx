import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { JournalList } from './components/JournalList';
import { JournalEditor } from './components/JournalEditor';
import { GeminiBrainstormPanel } from './components/GeminiBrainstormPanel';
import { SummaryCard } from './components/SummaryCard';
import { SecurityModal } from './components/SecurityModal';
import { StorageService } from './services/storageService';
import { ApiService } from './services/apiService';
import { JournalEntry, ChatMessage } from './types';
import { PanelLeftClose, PanelLeft, Sparkles, Shield, AlertCircle } from 'lucide-react';

function JournalMain() {
  const { user, token } = useAuth();
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [activeJournal, setActiveJournal] = useState<JournalEntry | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBrainstormOpen, setIsBrainstormOpen] = useState(true);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Create empty journal template
  const createNewJournal = useCallback((): JournalEntry => {
    const id = 'jnl-' + Math.random().toString(36).substring(2, 9);
    return {
      id,
      userId: user?.uid || 'anonymous',
      title: '',
      content: '',
      tags: ['reflection'],
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [user]);

  // Load user journals whenever user changes
  useEffect(() => {
    if (!user) {
      setJournals([]);
      setActiveJournal(null);
      return;
    }

    const loadEntries = async () => {
      try {
        const loaded = await StorageService.getUserJournals(user.uid);
        setJournals(loaded);
        if (loaded.length > 0) {
          setActiveJournal(loaded[0]);
        } else {
          // Initialize a welcoming first entry
          const firstEntry: JournalEntry = {
            id: 'jnl-welcome',
            userId: user.uid,
            title: 'Welcome to your Secure Gemini Journal',
            content: `This personal journal is built on a zero-trust architecture.

Key Security Highlights:
1. **Isolated Cloud Storage**: All entries are scoped strictly to /users/${user.uid}/journals/*, eliminating cross-user leakage.
2. **Zero Browser Exposure**: The Gemini API key is managed securely on the server via Google Cloud Secret Manager.
3. **Cognitive Privacy Shield**: An integrated DLP scanner alerts you before sensitive tokens or credentials leave your editor.
4. **AI Introspection & Brainstorming**: Use the panel on the right to bounce thoughts with Gemini 2.5 Flash.

Try writing your current goals, questions, or ideas here, then click "Synthesize Insights" above!`,
            summary: 'An introduction to the zero-trust Personal Gemini Journal, highlighting database isolation, server-side secret management, and AI reflection features.',
            sentiment: 'focused',
            sentimentScore: 92,
            keyTakeaways: [
              'Zero-trust tenant isolation strictly protects private journals',
              'Gemini 2.5 Flash runs entirely server-proxied without browser key leakage',
              'Real-time DLP scans prevent accidental credential exposure'
            ],
            actionItems: [
              { id: 'act-1', text: 'Open the Security Inspector to review STRIDE compliance', completed: false, category: 'task' },
              { id: 'act-2', text: 'Brainstorm a new project or reflection with Gemini', completed: false, category: 'creative' }
            ],
            tags: ['security', 'getting-started', 'gemini'],
            messages: [
              {
                id: 'msg-init',
                role: 'model',
                text: 'Hello! I am your personal Gemini brainstorming companion. Everything we discuss is stored in your private, isolated tenant. What is on your mind today?',
                timestamp: new Date().toISOString()
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await StorageService.saveJournal(user.uid, firstEntry);
          setJournals([firstEntry]);
          setActiveJournal(firstEntry);
        }
      } catch (err) {
        console.error('Failed to load journals:', err);
      }
    };

    loadEntries();
  }, [user]);

  // Debounced auto-save whenever active journal updates
  const handleUpdateJournal = (updates: Partial<JournalEntry>) => {
    if (!activeJournal || !user) return;

    const updated = {
      ...activeJournal,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setActiveJournal(updated);

    // Update in-memory list
    setJournals(prev => prev.map(j => (j.id === updated.id ? updated : j)));

    // Debounce save to storage
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setIsSaving(true);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await StorageService.saveJournal(user.uid, updated);
      } catch (e) {
        console.error('Auto-save error:', e);
      } finally {
        setIsSaving(false);
      }
    }, 800);
  };

  const handleManualSave = async () => {
    if (!activeJournal || !user) return;
    setIsSaving(true);
    try {
      await StorageService.saveJournal(user.uid, activeJournal);
      showToast('Saved to isolated Cloud Document DB');
    } catch (e) {
      showToast('Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewJournal = () => {
    const newEntry = createNewJournal();
    setActiveJournal(newEntry);
    setJournals(prev => [newEntry, ...prev]);
    if (user) {
      StorageService.saveJournal(user.uid, newEntry);
    }
  };

  const handleDeleteJournal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    await StorageService.deleteJournal(user.uid, id);
    const updated = journals.filter(j => j.id !== id);
    setJournals(updated);

    if (activeJournal?.id === id) {
      setActiveJournal(updated.length > 0 ? updated[0] : null);
    }
    showToast('Entry removed from Cloud Document DB');
  };

  const handleToggleActionItem = async (actionId: string, completed: boolean) => {
    if (!activeJournal || !user) return;

    const updatedItems = (activeJournal.actionItems || []).map(item =>
      item.id === actionId ? { ...item, completed } : item
    );

    handleUpdateJournal({ actionItems: updatedItems });
  };

  const handleSynthesize = async () => {
    if (!activeJournal || !user) return;
    setIsSynthesizing(true);

    try {
      const summaryData = await ApiService.summarizeEntry(
        token,
        activeJournal.title,
        activeJournal.content,
        activeJournal.messages
      );

      handleUpdateJournal({
        summary: summaryData.summary,
        sentiment: summaryData.sentiment,
        sentimentScore: summaryData.sentimentScore,
        keyTakeaways: summaryData.keyTakeaways,
        actionItems: summaryData.actionItems,
        tags: summaryData.tags,
        hashSignature: summaryData.hashSignature
      });

      showToast('Synthesized with Gemini 2.5 Flash');
    } catch (err: any) {
      showToast(err.message || 'Summarization failed', 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 ${
          notification.type === 'error'
            ? 'bg-rose-900/90 text-rose-200 border border-rose-700'
            : 'bg-emerald-900/90 text-emerald-200 border border-emerald-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Top Navbar */}
      <Navbar
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onNewJournal={handleNewJournal}
      />

      {/* Main Application Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Journal History */}
        <div
          className={`transition-all duration-300 ease-in-out border-r border-slate-800 shrink-0 ${
            isSidebarOpen ? 'w-72 sm:w-80' : 'w-0 overflow-hidden border-r-0'
          }`}
        >
          <JournalList
            journals={journals}
            activeJournalId={activeJournal?.id || null}
            onSelectJournal={(j) => setActiveJournal(j)}
            onNewJournal={handleNewJournal}
            onDeleteJournal={handleDeleteJournal}
          />
        </div>

        {/* Center: Editor + Bottom Summary Section */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Sidebar toggle bar */}
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white transition"
              title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              <span className="hidden sm:inline">{isSidebarOpen ? 'Hide History' : 'Show History'}</span>
            </button>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Isolated Tenant: <strong className="text-slate-200">{user?.uid ? user.uid.slice(0, 12) + '...' : 'Anonymous'}</strong></span>
            </div>
          </div>

          {/* Editor & Summary Scroll Area */}
          <div className="flex-1 overflow-y-auto">
            {activeJournal ? (
              <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
                {/* Editor Component */}
                <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/30">
                  <JournalEditor
                    journal={activeJournal}
                    onUpdateJournal={handleUpdateJournal}
                    onSave={handleManualSave}
                    onToggleBrainstorm={() => setIsBrainstormOpen(!isBrainstormOpen)}
                    isBrainstormOpen={isBrainstormOpen}
                    onSynthesize={handleSynthesize}
                    isSynthesizing={isSynthesizing}
                    isSaving={isSaving}
                  />
                </div>

                {/* AI Executive Summary & Action Plan Component */}
                <SummaryCard
                  summary={activeJournal.summary}
                  sentiment={activeJournal.sentiment}
                  sentimentScore={activeJournal.sentimentScore}
                  keyTakeaways={activeJournal.keyTakeaways}
                  actionItems={activeJournal.actionItems}
                  tags={activeJournal.tags}
                  hashSignature={activeJournal.hashSignature}
                  onToggleActionItem={handleToggleActionItem}
                  onGenerateSummary={handleSynthesize}
                  isSummarizing={isSynthesizing}
                />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Sparkles className="w-12 h-12 text-indigo-400 mb-3" />
                <h3 className="text-base font-semibold text-white mb-1">No Journal Entry Selected</h3>
                <p className="text-xs text-slate-400 mb-4">Select an entry from the left or create a new one.</p>
                <button
                  onClick={handleNewJournal}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
                >
                  Create New Entry
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Gemini Multi-Turn Brainstorming */}
        {isBrainstormOpen && activeJournal && (
          <div className="w-80 lg:w-96 border-l border-slate-800 shrink-0 hidden md:block">
            <GeminiBrainstormPanel
              messages={activeJournal.messages || []}
              onUpdateMessages={(msgs: ChatMessage[]) => handleUpdateJournal({ messages: msgs })}
              onAppendToJournal={(text: string) =>
                handleUpdateJournal({ content: (activeJournal.content || '') + text })
              }
              journalContent={activeJournal.content}
            />
          </div>
        )}
      </div>

      {/* Security Directives & Architecture Inspector Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <JournalMain />
    </AuthProvider>
  );
}
