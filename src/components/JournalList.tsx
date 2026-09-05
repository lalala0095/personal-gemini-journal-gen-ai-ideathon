import React, { useState } from 'react';
import { Search, Plus, Calendar, Trash2, Bookmark, Sparkles, Filter } from 'lucide-react';
import { JournalEntry } from '../types';

interface JournalListProps {
  journals: JournalEntry[];
  activeJournalId: string | null;
  onSelectJournal: (journal: JournalEntry) => void;
  onNewJournal: () => void;
  onDeleteJournal: (id: string, e: React.MouseEvent) => void;
}

export const JournalList: React.FC<JournalListProps> = ({
  journals,
  activeJournalId,
  onSelectJournal,
  onNewJournal,
  onDeleteJournal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');

  const sentiments = ['all', 'energized', 'reflective', 'focused', 'contemplative', 'optimistic'];

  const filteredJournals = journals.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (j.tags && j.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesSentiment =
      selectedSentiment === 'all' || j.sentiment === selectedSentiment;

    return matchesSearch && matchesSentiment;
  });

  return (
    <div className="flex flex-col h-full bg-slate-900/40 border-r border-slate-800/80">
      {/* Search & Header */}
      <div className="p-3.5 border-b border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Your Journals ({journals.length})
          </h2>
          <button
            onClick={onNewJournal}
            className="p-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white transition text-xs"
            title="Create New Entry"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search entries or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Sentiment Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
          {sentiments.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSentiment(s)}
              className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition ${
                selectedSentiment === s
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredJournals.length === 0 ? (
          <div className="text-center py-8 px-4 text-xs text-slate-500">
            {journals.length === 0
              ? 'No journal entries yet. Click "New Entry" above to start!'
              : 'No entries match your search criteria.'}
          </div>
        ) : (
          filteredJournals.map((j) => {
            const isActive = j.id === activeJournalId;
            return (
              <div
                key={j.id}
                onClick={() => onSelectJournal(j)}
                className={`group relative p-3 rounded-xl cursor-pointer transition border text-left ${
                  isActive
                    ? 'bg-slate-800/90 border-indigo-500/50 shadow-md shadow-indigo-500/5'
                    : 'bg-slate-950/30 hover:bg-slate-800/40 border-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {j.title || 'Untitled Session'}
                  </h3>
                  <button
                    onClick={(e) => onDeleteJournal(j.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                  {j.content || (j.summary ? j.summary : 'Empty entry...')}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(j.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {j.summary && (
                      <span className="flex items-center gap-0.5 text-sky-400 font-mono" title="AI Synthesized">
                        <Sparkles className="w-3 h-3" />
                      </span>
                    )}
                    {j.actionItems && j.actionItems.length > 0 && (
                      <span className="text-emerald-400 font-mono">
                        {j.actionItems.filter(a => a.completed).length}/{j.actionItems.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
