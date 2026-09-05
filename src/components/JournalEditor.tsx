import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Save, 
  MessageSquare, 
  Download, 
  Wand2, 
  Lightbulb, 
  Check, 
  Clock, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { JournalEntry, DLPIssue } from '../types';
import { scanForSensitiveData, autoRedactSensitiveData } from '../services/dlpService';
import { PrivacyScannerBanner } from './PrivacyScannerBanner';
import { ApiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

interface JournalEditorProps {
  journal: JournalEntry;
  onUpdateJournal: (updated: Partial<JournalEntry>) => void;
  onSave: () => Promise<void>;
  onToggleBrainstorm: () => void;
  isBrainstormOpen: boolean;
  onSynthesize: () => void;
  isSynthesizing: boolean;
  isSaving: boolean;
}

export const JournalEditor: React.FC<JournalEditorProps> = ({
  journal,
  onUpdateJournal,
  onSave,
  onToggleBrainstorm,
  isBrainstormOpen,
  onSynthesize,
  isSynthesizing,
  isSaving
}) => {
  const { token } = useAuth();
  const [dlpIssues, setDlpIssues] = useState<DLPIssue[]>([]);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [showPrompts, setShowPrompts] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);

  // Run Privacy Shield DLP scan whenever content changes
  useEffect(() => {
    const issues = scanForSensitiveData(`${journal.title} ${journal.content}`);
    setDlpIssues(issues);
  }, [journal.title, journal.content]);

  const handleAutoRedact = () => {
    const titleResult = autoRedactSensitiveData(journal.title);
    const contentResult = autoRedactSensitiveData(journal.content);
    onUpdateJournal({
      title: titleResult.cleanText,
      content: contentResult.cleanText
    });
  };

  const handleLoadPrompts = async () => {
    setShowPrompts(true);
    if (prompts.length === 0) {
      setLoadingPrompts(true);
      try {
        const fetched = await ApiService.getPrompts(token, journal.sentiment || 'reflective');
        setPrompts(fetched);
      } catch {
        // Fallback
      } finally {
        setLoadingPrompts(false);
      }
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(journal, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal-${journal.id}-${journal.title.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40">
      {/* Editor Top Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/20">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Encrypted Tenant Storage</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {isSaving ? 'Saving...' : 'Saved to Document DB'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Spark Prompts Button */}
          <button
            id="spark-prompts-btn"
            onClick={handleLoadPrompts}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Spark Prompts</span>
          </button>

          {/* Toggle Brainstorm Drawer */}
          <button
            id="toggle-brainstorm-btn"
            onClick={onToggleBrainstorm}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
              isBrainstormOpen
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Brainstorm ({journal.messages?.length || 0})</span>
          </button>

          {/* Synthesize with Gemini */}
          <button
            id="synthesize-gemini-btn"
            onClick={onSynthesize}
            disabled={isSynthesizing || (!journal.content && (!journal.messages || journal.messages.length === 0))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sm transition disabled:opacity-40"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSynthesizing ? 'Synthesizing...' : 'Synthesize Insights'}</span>
          </button>

          {/* Export JSON */}
          <button
            id="export-journal-btn"
            onClick={handleExport}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Export Tamper-Proof JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Prompts Drawer / Bar */}
      {showPrompts && (
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Gemini Introspection Sparks
            </span>
            <button
              onClick={() => setShowPrompts(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              Dismiss
            </button>
          </div>
          {loadingPrompts ? (
            <div className="text-slate-400 py-1">Generating reflective sparks...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {prompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const addition = journal.content ? `\n\n### Reflection: ${p}\n` : `### Reflection: ${p}\n`;
                    onUpdateJournal({ content: journal.content + addition });
                    setShowPrompts(false);
                  }}
                  className="text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition text-[11px]"
                >
                  "{p}"
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Privacy Shield DLP Banner */}
      <div className="p-4 pb-0">
        <PrivacyScannerBanner issues={dlpIssues} onAutoRedact={handleAutoRedact} />
      </div>

      {/* Main Document Inputs */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {/* Title input */}
        <input
          id="journal-title-input"
          type="text"
          value={journal.title}
          onChange={(e) => onUpdateJournal({ title: e.target.value })}
          placeholder="Journal Session Title..."
          className="w-full bg-transparent text-xl sm:text-2xl font-semibold text-white placeholder-slate-500 focus:outline-none tracking-tight"
        />

        {/* Text / Markdown Content */}
        <textarea
          id="journal-content-textarea"
          value={journal.content}
          onChange={(e) => onUpdateJournal({ content: e.target.value })}
          placeholder="Pour your thoughts, questions, or ideas here... You can also bounce thoughts in the Gemini Brainstorm panel on the right."
          rows={16}
          className="w-full bg-transparent text-sm leading-relaxed text-slate-200 placeholder-slate-500 focus:outline-none resize-none font-sans"
        />
      </div>

      {/* Footer Word count and info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-[11px] text-slate-500">
        <div>
          {journal.content.trim() ? journal.content.trim().split(/\s+/).length : 0} words •{' '}
          {journal.content.length} characters
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          ID: {journal.id}
        </div>
      </div>
    </div>
  );
};
