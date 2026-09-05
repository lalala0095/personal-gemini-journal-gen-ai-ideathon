import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { JournalList } from './components/JournalList';
import { JournalEditor } from './components/JournalEditor';
import { GeminiBrainstormPanel } from './components/GeminiBrainstormPanel';
import { SummaryCard } from './components/SummaryCard';
import { SecurityModal } from './components/SecurityModal';
import { MemoryPalaceModal } from './components/MemoryPalaceModal';
import { AuthLandingPage } from './components/AuthLandingPage';
import { DashboardView } from './components/DashboardView';
import { StorageService } from './services/storageService';
import { ApiService } from './services/apiService';
import { JournalEntry, ChatMessage, KnowledgeNode } from './types';
import { PanelLeftClose, PanelLeft, Sparkles, Shield, AlertCircle, Brain, Database } from 'lucide-react';

function JournalMain() {
  const { user, token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [activeJournal, setActiveJournal] = useState<JournalEntry | null>(null);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isBrainstormOpen, setIsBrainstormOpen] = useState(true);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isMemoryPalaceOpen, setIsMemoryPalaceOpen] = useState(false);
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
      title: 'Untitled Reflection',
      content: '',
      tags: ['reflection'],
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }, [user]);

  // Load user journals and knowledge hub whenever user changes
  useEffect(() => {
    if (!user) {
      setJournals([]);
      setActiveJournal(null);
      setKnowledgeNodes([]);
      return;
    }

    const loadUserData = async () => {
      try {
        // 1. Load Journal Entries
        const loadedJournals = await StorageService.getUserJournals(user.uid);
        
        // Clean starter content without leaking internal database paths or architectural specs
        const cleanStarterContent = `# Welcome to Your Reflection Space

Take a quiet moment to pause, reflect, and capture your thoughts.

### Prompts to get started:
- **What's top of mind today?** Write freely about what captured your focus or energy.
- **Goals & intentions:** What is one meaningful project or milestone you are working toward?
- **Key takeaways or learnings:** What went well this week that you would like to remember?

---

*Tip: Click **Synthesize Insights** above whenever you want Gemini to extract themes and action items, or click **Brainstorm** to explore new angles together!*`;

        // Automatically sanitize any legacy welcome entry that contained technical invariants
        const sanitizedJournals = loadedJournals.map(j => {
          if (j.id === 'jnl-welcome' && (j.content.includes('Key Invariants:') || j.content.includes('/users/'))) {
            const updated: JournalEntry = {
              ...j,
              title: 'Welcome to Your Personal Journal',
              content: cleanStarterContent,
              summary: 'A clean starter reflection space for mindful writing, personal goals, and creative brainstorming.',
              sentiment: 'focused',
              sentimentScore: 92,
              keyTakeaways: [
                'Capture daily thoughts, priorities, and creative ideas freely',
                'Engage the Brainstorming Partner to explore new perspectives and solutions',
                'Synthesize reflections into actionable insights and lasting takeaways'
              ],
              actionItems: [
                { id: 'act-1', text: 'Write down your top priority for this week', completed: false, category: 'task' },
                { id: 'act-2', text: 'Explore a new idea with the Brainstorming Partner', completed: false, category: 'creative' }
              ],
              tags: ['welcome', 'reflection', 'goals'],
              updatedAt: new Date().toISOString()
            };
            StorageService.saveJournal(user.uid, updated);
            return updated;
          }
          return j;
        });

        setJournals(sanitizedJournals);
        if (sanitizedJournals.length > 0) {
          setActiveJournal(sanitizedJournals[0]);
        } else {
          // Initialize a welcoming first entry
          const firstEntry: JournalEntry = {
            id: 'jnl-welcome',
            userId: user.uid,
            title: 'Welcome to Your Personal Journal',
            content: cleanStarterContent,
            summary: 'A clean starter reflection space for mindful writing, personal goals, and creative brainstorming.',
            sentiment: 'focused',
            sentimentScore: 92,
            keyTakeaways: [
              'Capture daily thoughts, priorities, and creative ideas freely',
              'Engage the Brainstorming Partner to explore new perspectives and solutions',
              'Synthesize reflections into actionable insights and lasting takeaways'
            ],
            actionItems: [
              { id: 'act-1', text: 'Write down your top priority for this week', completed: false, category: 'task' },
              { id: 'act-2', text: 'Explore a new idea with the Brainstorming Partner', completed: false, category: 'creative' }
            ],
            tags: ['welcome', 'reflection', 'goals'],
            messages: [
              {
                id: 'msg-init',
                role: 'model',
                text: 'Hello! I am your personal Gemini brainstorming companion. As we chat and reflect, I will capture key context, facts, and dates into your Knowledge Hub. What would you like to explore or discuss today?',
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

        // 2. Load Knowledge Hub Nodes
        const loadedNodes = await StorageService.getUserKnowledgeHub(user.uid);
        setKnowledgeNodes(loadedNodes);
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    };

    loadUserData();
  }, [user]);

  // Debounced auto-save whenever active journal updates
  const handleUpdateJournal = useCallback((updates: Partial<JournalEntry>) => {
    if (!user) return;

    setActiveJournal(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Update in-memory list
      setJournals(all => all.map(j => (j.id === updated.id ? updated : j)));

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

      return updated;
    });
  }, [user]);

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
    setActiveTab('journals');
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

  const handleToggleActionItemAcrossJournals = async (journalId: string, itemId: string) => {
    if (!user) return;
    setJournals(prev => {
      const updated = prev.map(j => {
        if (j.id === journalId) {
          const updatedItems = (j.actionItems || []).map(item =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          );
          const updatedJournal = { ...j, actionItems: updatedItems, updatedAt: new Date().toISOString() };
          StorageService.saveJournal(user.uid, updatedJournal);
          if (activeJournal?.id === journalId) {
            setActiveJournal(updatedJournal);
          }
          return updatedJournal;
        }
        return j;
      });
      return updated;
    });
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

      // Automatically persist any synthesized knowledge nodes into the Knowledge Hub
      if (summaryData.extractedKnowledge && summaryData.extractedKnowledge.length > 0) {
        const newNodes: KnowledgeNode[] = summaryData.extractedKnowledge.map((item, idx) => ({
          id: `kn-${Date.now()}-${idx}`,
          userId: user.uid,
          category: item.category || 'General',
          title: item.title,
          summary: item.summary,
          dataPoints: item.dataPoints || [],
          keyTakeaways: item.keyTakeaways || [],
          confidence: 0.95,
          lastMentioned: new Date().toISOString(),
          createdAt: new Date().toISOString()
        }));

        for (const node of newNodes) {
          await StorageService.saveKnowledgeNode(user.uid, node);
        }

        setKnowledgeNodes(prev => [...newNodes, ...prev]);
        showToast(`Captured ${newNodes.length} context items into Knowledge Hub`);
      } else {
        showToast('Journal analysis complete');
      }
    } catch (err: any) {
      showToast(err.message || 'Summarization failed', 'error');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // If loading authentication status
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs font-mono">Initializing Zero-Trust Session...</p>
      </div>
    );
  }

  // If not authenticated, display the Auth & Overview Landing Page
  if (!user) {
    return (
      <>
        <AuthLandingPage onOpenSecurityModal={() => setIsSecurityModalOpen(true)} />
        <SecurityModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
        />
      </>
    );
  }

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

      {/* Main Top Navbar with 3 Tabs */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={(tab) => setActiveTab(tab)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenMemoryPalace={() => setIsMemoryPalaceOpen(true)}
        onNewJournal={handleNewJournal}
        knowledgeCount={knowledgeNodes.length}
      />

      {/* View Switcher based on Active Tab */}
      <div className="flex-1 flex overflow-hidden">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <DashboardView
            journals={journals}
            knowledgeNodes={knowledgeNodes}
            onSelectJournal={(j) => {
              setActiveJournal(j);
              setActiveTab('journals');
            }}
            onNewJournal={handleNewJournal}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenMemoryPalace={() => setIsMemoryPalaceOpen(true)}
            onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
            onToggleActionItem={handleToggleActionItemAcrossJournals}
            userId={user.uid}
          />
        )}

        {/* TAB 2: JOURNALS STUDIO */}
        {activeTab === 'journals' && (
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition"
                    title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                  >
                    {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isSidebarOpen ? 'Hide History' : 'Show History'}</span>
                  </button>

                  <button
                    onClick={() => setIsMemoryPalaceOpen(true)}
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition font-medium"
                  >
                    <Database className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Knowledge Hub ({knowledgeNodes.length} Nodes)</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300">Private & Encrypted Session</span>
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

            {/* Optional Collapsible Right Panel in Journal Studio */}
            {isBrainstormOpen && activeJournal && (
              <div className="w-80 lg:w-96 border-l border-slate-800 shrink-0 hidden md:block">
                <GeminiBrainstormPanel
                  messages={activeJournal.messages || []}
                  onUpdateMessages={(msgs: ChatMessage[]) => handleUpdateJournal({ messages: msgs })}
                  onAppendToJournal={(text: string) =>
                    handleUpdateJournal({ content: (activeJournal.content || '') + text })
                  }
                  journalContent={activeJournal.content}
                  knowledgeNodes={knowledgeNodes}
                  onKnowledgeNodesUpdated={(updatedNodes) => {
                    setKnowledgeNodes(updatedNodes);
                    showToast('Knowledge Hub updated by Background Worker');
                  }}
                  onOpenMemoryPalace={() => setIsMemoryPalaceOpen(true)}
                  journals={journals}
                  activeJournalId={activeJournal.id}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: DEDICATED BRAINSTORMING PARTNER STUDIO */}
        {activeTab === 'brainstorm' && (
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-6 bg-slate-950">
            <GeminiBrainstormPanel
              isStandalone={true}
              messages={activeJournal?.messages || []}
              onUpdateMessages={(msgs: ChatMessage[]) => handleUpdateJournal({ messages: msgs })}
              onAppendToJournal={(text: string) => {
                if (activeJournal) {
                  handleUpdateJournal({ content: (activeJournal.content || '') + text });
                  showToast('Appended to active journal!');
                }
              }}
              journalContent={activeJournal?.content}
              knowledgeNodes={knowledgeNodes}
              onKnowledgeNodesUpdated={(updatedNodes) => {
                setKnowledgeNodes(updatedNodes);
                showToast('Knowledge Hub updated by Background Worker');
              }}
              onOpenMemoryPalace={() => setIsMemoryPalaceOpen(true)}
              journals={journals}
              activeJournalId={activeJournal?.id}
              onSelectActiveJournal={(id) => {
                const target = journals.find(j => j.id === id);
                if (target) setActiveJournal(target);
              }}
            />
          </div>
        )}
      </div>

      {/* Security Directives & Architecture Inspector Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      {/* Memory Palace (Agent Knowledge Hub) Modal */}
      <MemoryPalaceModal
        isOpen={isMemoryPalaceOpen}
        onClose={() => setIsMemoryPalaceOpen(false)}
        userId={user.uid}
        token={token}
        knowledgeNodes={knowledgeNodes}
        onUpdateNodes={(nodes) => setKnowledgeNodes(nodes)}
        recentEntries={journals.map(j => ({
          title: j.title,
          summary: j.summary,
          content: j.content,
          createdAt: j.createdAt
        }))}
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
