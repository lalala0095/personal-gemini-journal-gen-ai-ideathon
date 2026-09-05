import React from 'react';
import { 
  BookOpen, 
  Sparkles, 
  Brain, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  ArrowRight,
  Plus,
  MessageSquare,
  Lock,
  Tag,
  Database
} from 'lucide-react';
import { JournalEntry, KnowledgeNode } from '../types';

interface DashboardViewProps {
  journals: JournalEntry[];
  knowledgeNodes: KnowledgeNode[];
  onSelectJournal: (journal: JournalEntry) => void;
  onNewJournal: () => void;
  onNavigateTab: (tab: 'journals' | 'brainstorm') => void;
  onOpenMemoryPalace: () => void;
  onOpenSecurityModal: () => void;
  onToggleActionItem: (journalId: string, itemId: string) => void;
  userId: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  journals,
  knowledgeNodes,
  onSelectJournal,
  onNewJournal,
  onNavigateTab,
  onOpenMemoryPalace,
  onOpenSecurityModal,
  onToggleActionItem,
  userId
}) => {
  // Compute metrics
  const totalEntries = journals.length;
  const entriesWithSummary = journals.filter(j => j.summary);
  const avgClarityScore = entriesWithSummary.length > 0
    ? Math.round(entriesWithSummary.reduce((acc, j) => acc + (j.sentimentScore || 70), 0) / entriesWithSummary.length)
    : 85;

  // Gather all action items
  const allActionItems: Array<{ journalId: string; journalTitle: string; item: any }> = [];
  journals.forEach(j => {
    if (j.actionItems && j.actionItems.length > 0) {
      j.actionItems.forEach(item => {
        allActionItems.push({
          journalId: j.id,
          journalTitle: j.title,
          item
        });
      });
    }
  });

  const completedActions = allActionItems.filter(a => a.item.completed).length;
  const pendingActions = allActionItems.filter(a => !a.item.completed);

  // Sentiment breakdown
  const sentimentCounts: Record<string, number> = {};
  journals.forEach(j => {
    const s = j.sentiment || 'reflective';
    sentimentCounts[s] = (sentimentCounts[s] || 0) + 1;
  });

  const latestJournal = journals[0] || null;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-950 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Introspective Insights Dashboard</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Welcome back to your private sanctuary.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Your reflections, insights, and long-term memories are encrypted, completely private, and accessible only to your authenticated account.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('journals')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Write Entry</span>
          </button>
          <button
            onClick={() => onNavigateTab('brainstorm')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>Brainstorm with Gemini</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Journal Entries</span>
            <div className="text-2xl font-bold text-white tracking-tight">{totalEntries}</div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3 h-3" /> Encrypted & Private
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Memory Palace Nodes</span>
            <div className="text-2xl font-bold text-white tracking-tight">{knowledgeNodes.length}</div>
            <button 
              onClick={onOpenMemoryPalace}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium underline underline-offset-2"
            >
              Explore Knowledge Hub &rarr;
            </button>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Emotional Clarity Index</span>
            <div className="text-2xl font-bold text-white tracking-tight">{avgClarityScore} / 100</div>
            <span className="text-[11px] text-sky-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Gemini 3.5 Synthesized
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 font-medium">Action Items</span>
            <div className="text-2xl font-bold text-white tracking-tight">
              {completedActions} <span className="text-sm font-normal text-slate-500">/ {allActionItems.length}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {pendingActions.length} pending reflection goals
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Insights & Action Plan + Memory Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Latest Synthesis & Pending Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Latest Journal Executive Summary */}
          {latestJournal ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Latest Reflection Highlight</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(latestJournal.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <button
                  onClick={() => {
                    onSelectJournal(latestJournal);
                    onNavigateTab('journals');
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
                >
                  <span>Open in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-100">{latestJournal.title}</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
                  {latestJournal.summary || latestJournal.content.slice(0, 240) + '...'}
                </p>
              </div>

              {latestJournal.keyTakeaways && latestJournal.keyTakeaways.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Key Takeaways</span>
                  <div className="space-y-1">
                    {latestJournal.keyTakeaways.slice(0, 3).map((takeaway, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span>{takeaway}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestJournal.tags && latestJournal.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {latestJournal.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                      <Tag className="w-2.5 h-2.5 text-sky-400" />
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-900/30 border border-slate-800 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="text-sm font-semibold text-slate-300">No Journal Entries Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Begin your reflective journey. Every entry is isolated and encrypted by Firestore security rules.
              </p>
              <button
                onClick={onNewJournal}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition"
              >
                Create First Entry
              </button>
            </div>
          )}

          {/* Pending Action Items Across Journals */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Action & Growth Habits</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {completedActions} of {allActionItems.length} done
              </span>
            </div>

            {allActionItems.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No action items extracted yet. Click "Synthesize Insights" in the Journal tab to generate actionable habits from your writing.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {allActionItems.map(({ journalId, journalTitle, item }) => (
                  <div
                    key={`${journalId}-${item.id}`}
                    onClick={() => onToggleActionItem(journalId, item.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                      item.completed
                        ? 'bg-slate-950/20 border-slate-800/40 opacity-60'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-indigo-500/40'
                    }`}
                  >
                    <button className="mt-0.5 text-slate-400 hover:text-white transition shrink-0">
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {item.text}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
                        Source: {journalTitle}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Knowledge & Context Hub Highlights & Security */}
        <div className="space-y-6">
          {/* Knowledge & Context Hub Highlights */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-900/50 border border-indigo-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-white">Knowledge & Context Hub</h3>
              </div>
              <button
                onClick={onOpenMemoryPalace}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition"
              >
                View All &rarr;
              </button>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/30 border border-indigo-700/40 text-[11px] text-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Captures concrete facts, key dates & context for AI grounding</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Your AI partner uses these captured data points to ground its guidance in your actual reality:
            </p>

            {knowledgeNodes.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-500 space-y-2">
                <p>No context nodes recorded yet.</p>
                <button
                  onClick={onOpenMemoryPalace}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  + Add First Context Node
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {knowledgeNodes.slice(0, 4).map((node) => (
                  <div key={node.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded-full font-semibold bg-indigo-500/20 text-indigo-300">
                        {node.category}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {new Date(node.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-slate-200">{node.title}</h5>
                    <p className="text-[11px] text-slate-400 line-clamp-2">{node.summary}</p>
                    
                    {/* Render first 2 captured data points if present */}
                    {node.dataPoints && node.dataPoints.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {node.dataPoints.slice(0, 2).map((dp, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/90 text-indigo-300 border border-indigo-800/60"
                          >
                            <Tag className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{dp}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy & Protection Standards Card */}
          <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacy & Data Protection</span>
            </div>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>100% Private Cloud Storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Strict Account-Level Isolation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>Zero AI Model Training on Your Data</span>
              </li>
            </ul>
            <button
              onClick={onOpenSecurityModal}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition mt-2 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-sky-400" />
              <span>Privacy & Security Overview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
