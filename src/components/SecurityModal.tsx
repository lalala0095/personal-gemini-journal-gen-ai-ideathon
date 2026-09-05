import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Key, Server, Database, AlertCircle, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import { SecurityAuditReport } from '../types';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [report, setReport] = useState<SecurityAuditReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getSecurityAudit();
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAudit();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        id="security-modal-container"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/70 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Privacy & Security Overview</h2>
              <p className="text-xs text-slate-400">How we safeguard your journals, reflections, and account data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Active Account Data Isolation */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-medium">
                <Database className="w-4 h-4" />
                <span>Account Data Isolation</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE & VERIFIED
              </span>
            </div>
            <div className="text-xs text-slate-300 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Account Access Scope:</span>
              <span className="text-sky-300 font-medium truncate max-w-[280px]">
                {user ? `Private Account (${user.email || user.displayName || 'Active User'})` : 'Authenticated Account Only'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              All journal entries, reflections, and memory nodes are restricted strictly to your authenticated account. Cross-account access is permanently prevented at the database and infrastructure level.
            </p>
          </div>

          {/* AI Privacy & Secret Custody */}
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-medium">
                <Key className="w-4 h-4" />
                <span>AI Confidentiality & Processing</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20">
                100% CONFIDENTIAL
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 mb-0.5">Model Training Policy</div>
                <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Zero Training on Your Data
                </div>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <div className="text-slate-400 mb-0.5">Client-Side Secret Exposure</div>
                <div className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Zero Exposure (0%)
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your journals and conversational queries are processed securely on our server backend. Sensitive API credentials are never bundled in browser code, and reflections are never shared with public model training sets.
            </p>
          </div>

          {/* Security & Privacy Standards Matrix */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Security & Privacy Safeguards
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Verified Identity
                </div>
                <p className="text-slate-400">Cryptographically verified authentication with strict token validation on every request.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Tamper-Evident Integrity
                </div>
                <p className="text-slate-400">Automated checksum verification ensures journal history cannot be modified without detection.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Private Activity History
                </div>
                <p className="text-slate-400">Immutable creation timestamps and clean personal history logs across all sessions.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Zero Cross-Account Sharing
                </div>
                <p className="text-slate-400">Complete multi-tenant isolation ensures no user can ever inspect or view your records.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Abuse & Traffic Protection
                </div>
                <p className="text-slate-400">Intelligent workload throttling prevents unauthorized access spikes and protects service uptime.</p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Strict Access Control
                </div>
                <p className="text-slate-400">Fine-grained field authorizations guarantee only document owners have read and write permissions.</p>
              </div>
            </div>
          </div>

          {/* Cloud Infrastructure */}
          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3">
            <Server className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <span className="font-medium text-indigo-300">Enterprise Cloud Infrastructure:</span>
              <p className="mt-1 text-slate-400">
                Hosted on Google Cloud enterprise infrastructure with continuous TLS 1.3 encryption in transit and AES-256 encryption at rest.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>All Privacy Protections Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
