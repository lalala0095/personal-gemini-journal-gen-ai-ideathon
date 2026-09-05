import React from 'react';
import { ShieldAlert, ShieldCheck, Sparkles, Wand2 } from 'lucide-react';
import { DLPIssue } from '../types';

interface PrivacyScannerBannerProps {
  issues: DLPIssue[];
  onAutoRedact: () => void;
}

export const PrivacyScannerBanner: React.FC<PrivacyScannerBannerProps> = ({
  issues,
  onAutoRedact
}) => {
  if (issues.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-400">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span>Cognitive Privacy Shield: No credentials or PII detected. Safe for AI processing.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-xs animate-in fade-in">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-amber-300">
            DLP Warning ({issues.length} sensitive {issues.length === 1 ? 'item' : 'items'} detected):
          </span>
          <p className="text-amber-300/80 mt-0.5">
            {issues.map(i => i.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')} found in draft. We recommend redacting before AI transmission.
          </p>
        </div>
      </div>

      <button
        id="auto-redact-btn"
        onClick={onAutoRedact}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium text-xs shadow-sm transition whitespace-nowrap"
      >
        <Wand2 className="w-3.5 h-3.5" />
        <span>Auto-Redact All</span>
      </button>
    </div>
  );
};
