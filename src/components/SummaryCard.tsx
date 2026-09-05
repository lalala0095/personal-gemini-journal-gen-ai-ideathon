import React from 'react';
import { Sparkles, CheckCircle2, Circle, Tag, Fingerprint, TrendingUp, Lightbulb, Compass } from 'lucide-react';
import { ActionItem } from '../types';

interface SummaryCardProps {
  summary?: string;
  sentiment?: string;
  sentimentScore?: number;
  keyTakeaways?: string[];
  actionItems?: ActionItem[];
  tags?: string[];
  hashSignature?: string;
  onToggleActionItem: (actionId: string, completed: boolean) => void;
  onGenerateSummary: () => void;
  isSummarizing: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  sentiment,
  sentimentScore,
  keyTakeaways,
  actionItems,
  tags,
  hashSignature,
  onToggleActionItem,
  onGenerateSummary,
  isSummarizing
}) => {
  const getSentimentBadge = (s?: string) => {
    switch (s) {
      case 'energized':
        return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', label: 'Energized & Motivated' };
      case 'reflective':
        return { color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'Reflective & Thoughtful' };
      case 'focused':
        return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Deeply Focused' };
      case 'contemplative':
        return { color: 'bg-sky-500/10 text-sky-400 border-sky-500/20', label: 'Contemplative & Calm' };
      case 'optimistic':
        return { color: 'bg-teal-500/10 text-teal-400 border-teal-500/20', label: 'Optimistic & Forward-Looking' };
      default:
        return { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'Balanced & Neutral' };
    }
  };

  const badge = getSentimentBadge(sentiment);

  if (!summary && (!actionItems || actionItems.length === 0)) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
          <Compass className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-slate-200">No AI Synthesis Yet</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Write down your thoughts or brainstorm with Gemini, then generate an executive summary with action items.
          </p>
        </div>
        <button
          id="generate-summary-btn"
          onClick={onGenerateSummary}
          disabled={isSummarizing}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSummarizing ? 'Synthesizing with Gemini...' : 'Synthesize & Extract Action Items'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 text-slate-200 shadow-xl">
      {/* Header & Sentiment */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Gemini Synthesis & Action Plan</h4>
            <p className="text-[10px] text-slate-400">Structured cognitive takeaways</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sentiment && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
              {badge.label}
            </span>
          )}
          {sentimentScore !== undefined && (
            <span className="px-2 py-1 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
              Clarity: {sentimentScore}%
            </span>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      {summary && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Executive Summary
          </div>
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800">
            {summary}
          </p>
        </div>
      )}

      {/* Key Takeaways */}
      {keyTakeaways && keyTakeaways.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Key Insights
          </div>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2 bg-slate-950/30 p-2 rounded-lg border border-slate-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Interactive Action Items */}
      {actionItems && actionItems.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Action Items & Behavioral Commitments
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              {actionItems.filter(a => a.completed).length} of {actionItems.length} completed
            </span>
          </div>
          <div className="space-y-1.5">
            {actionItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onToggleActionItem(item.id, !item.completed)}
                className={`w-full text-left flex items-start gap-2.5 p-2.5 rounded-xl transition border text-xs ${
                  item.completed
                    ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-400 line-through'
                    : 'bg-slate-950/50 hover:bg-slate-950/80 border-slate-800 text-slate-200'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                )}
                <span className="flex-1">{item.text}</span>
                {item.category && (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.category}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          <Tag className="w-3 h-3 text-slate-500 mr-1" />
          {tags.map((t, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Tamper-Evident SHA-256 Digital Fingerprint (STRIDE Repudiation Protection) */}
      {hashSignature && (
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Fingerprint className="w-3 h-3 text-indigo-400" /> Tamper-Proof SHA-256:
          </span>
          <span className="truncate max-w-[220px]" title={hashSignature}>
            {hashSignature.slice(0, 16)}...{hashSignature.slice(-8)}
          </span>
        </div>
      )}
    </div>
  );
};
