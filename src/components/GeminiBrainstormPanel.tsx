import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ArrowDownToLine, 
  RefreshCw, 
  AlertCircle, 
  Brain, 
  Copy, 
  Check, 
  Trash2, 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Loader2,
  CheckCircle,
  CheckCheck,
  Clock,
  Database
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, KnowledgeNode, JournalEntry } from '../types';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { useAuth } from '../context/AuthContext';

const MarkdownMessage: React.FC<{ content: string; isUser: boolean }> = ({ content, isUser }) => {
  if (isUser) {
    return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>;
  }

  return (
    <div className="text-xs sm:text-sm leading-relaxed space-y-2">
      <Markdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-slate-200">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-300">{children}</em>,
          h1: ({ children }) => <h1 className="text-base font-bold text-white mt-3 mb-1.5 pb-1 border-b border-slate-700/60">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-semibold text-white mt-2.5 mb-1">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xs font-semibold text-sky-300 mt-2 mb-1 uppercase tracking-wide">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1 my-2 text-slate-200">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1 my-2 text-slate-200">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-indigo-400 pl-3 py-1 my-2 text-slate-300 italic bg-slate-900/40 rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = Boolean(className);
            return isBlock ? (
              <code className="block bg-slate-950/80 p-2.5 rounded-lg text-sky-300 font-mono text-[11px] overflow-x-auto border border-slate-700/60 my-2">
                {children}
              </code>
            ) : (
              <code className="bg-slate-950/70 text-sky-300 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-700/50">
                {children}
              </code>
            );
          },
          hr: () => <hr className="border-slate-700/60 my-3" />
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

interface GeminiBrainstormPanelProps {
  messages: ChatMessage[];
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onAppendToJournal?: (text: string) => void;
  journalContent?: string;
  knowledgeNodes?: KnowledgeNode[];
  onKnowledgeNodesUpdated?: (nodes: KnowledgeNode[]) => void;
  onOpenMemoryPalace?: () => void;
  isStandalone?: boolean;
  journals?: JournalEntry[];
  activeJournalId?: string;
  onSelectActiveJournal?: (id: string) => void;
}

export const GeminiBrainstormPanel: React.FC<GeminiBrainstormPanelProps> = ({
  messages,
  onUpdateMessages,
  onAppendToJournal,
  journalContent = '',
  knowledgeNodes = [],
  onKnowledgeNodesUpdated,
  onOpenMemoryPalace,
  isStandalone = false,
  journals = [],
  activeJournalId,
  onSelectActiveJournal
}) => {
  const { token, user } = useAuth();
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(messages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sparksScrollRef = useRef<HTMLDivElement>(null);

  // Background Knowledge Distiller Worker State
  const [isDistilling, setIsDistilling] = useState(false);
  const [distillStatus, setDistillStatus] = useState<string | null>(null);
  const lastDistilledTurnCountRef = useRef<number>(0);
  const isWorkerBusyRef = useRef<boolean>(false);

  const scrollSparks = (direction: 'left' | 'right') => {
    if (sparksScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      sparksScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Synchronize incoming prop messages if different length
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    if (!user || !token) {
      setError('Please sign in to chat with your brainstorming partner.');
      return;
    }

    setError(null);
    const userMsg: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
      analyzedForKnowledge: false
    };

    // Immediately push user turn into view
    const newHistory = [...localMessages, userMsg];
    setLocalMessages(newHistory);
    onUpdateMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ApiService.sendChatMessage(
        token,
        newHistory,
        journalContent ? `Current Journal Draft: ${journalContent.slice(0, 1000)}` : undefined,
        knowledgeNodes
      );

      // Append Gemini's turn immediately, marked as pending knowledge analysis
      const modelMsg: ChatMessage = {
        ...response,
        analyzedForKnowledge: false
      };
      const finalHistory = [...newHistory, modelMsg];
      setLocalMessages(finalHistory);
      onUpdateMessages(finalHistory);

      // Persist conversation turns to current journal in Firestore
      if (activeJournalId && user?.uid) {
        const activeJournalObj = journals.find(j => j.id === activeJournalId);
        if (activeJournalObj) {
          StorageService.saveJournal(user.uid, {
            ...activeJournalObj,
            messages: finalHistory,
            updatedAt: new Date().toISOString()
          }).catch(err => console.warn('[Firestore] Background turn sync error:', err));
        }
      }

      // Evaluate automated background knowledge extraction:
      // When 4-5 or more unanalyzed conversation turns accumulate,
      // spawn the background worker using Gemini 3.5 Flash-Lite to compress & store knowledge
      const unanalyzedTurns = finalHistory.filter(m => !m.analyzedForKnowledge);
      if (
        unanalyzedTurns.length >= 4 &&
        !isWorkerBusyRef.current
      ) {
        // Run asynchronously in background without blocking conversation UI
        runBackgroundDistillation(finalHistory);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to brainstorm with Gemini. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Autonomous Background Worker:
   * Ingests 5-10 unanalyzed turns of agent-user conversation, calls Gemini 3.5 Flash-Lite
   * to analyze & compress durable takeaways, stores them in the Knowledge Hub,
   * and marks the ingested turns as analyzed to guarantee strict idempotency (no duplicate analytics).
   */
  const runBackgroundDistillation = useCallback(async (historyToAnalyze?: ChatMessage[]) => {
    if (!user || !token || isWorkerBusyRef.current) return;
    const history = historyToAnalyze || localMessages;
    
    // Idempotency: filter ONLY unanalyzed turns
    const unanalyzedTurns = history.filter(m => !m.analyzedForKnowledge);
    
    if (unanalyzedTurns.length === 0) {
      setDistillStatus('All conversation turns are already analyzed (Idempotent: No duplicates).');
      setTimeout(() => setDistillStatus(null), 3500);
      return;
    }

    if (unanalyzedTurns.length < 2) {
      setDistillStatus('Need at least 2 unanalyzed conversation turns to synthesize knowledge.');
      setTimeout(() => setDistillStatus(null), 3000);
      return;
    }

    isWorkerBusyRef.current = true;
    setIsDistilling(true);
    const turnsToProcess = unanalyzedTurns.slice(-10);
    setDistillStatus(`Syncing ${turnsToProcess.length} context item${turnsToProcess.length > 1 ? 's' : ''} to Knowledge Hub...`);

    try {
      const activeTitle = journals.find(j => j.id === activeJournalId)?.title;
      const result = await ApiService.distillConversation(
        token,
        turnsToProcess,
        knowledgeNodes,
        activeTitle
      );

      // Turn Idempotency: Mark the processed turns as analyzed
      const newlyAnalyzedSet = new Set(
        result.analyzedMessageIds && result.analyzedMessageIds.length > 0 
          ? result.analyzedMessageIds 
          : turnsToProcess.map(m => m.id)
      );

      const nowIso = new Date().toISOString();
      const updatedHistory = history.map(m => 
        newlyAnalyzedSet.has(m.id)
          ? { ...m, analyzedForKnowledge: true, analyzedAt: nowIso }
          : m
      );

      setLocalMessages(updatedHistory);
      onUpdateMessages(updatedHistory);

      // Persist the updated turn flags to Firestore so idempotency holds across sessions/devices
      if (activeJournalId) {
        const activeJournalObj = journals.find(j => j.id === activeJournalId);
        if (activeJournalObj) {
          const updatedJournal: JournalEntry = {
            ...activeJournalObj,
            messages: updatedHistory,
            updatedAt: nowIso
          };
          await StorageService.saveJournal(user.uid, updatedJournal);
        }
      }

      if (result.newKnowledgeNodes && result.newKnowledgeNodes.length > 0) {
        const savedNewNodes: KnowledgeNode[] = [];
        for (const item of result.newKnowledgeNodes) {
          const newNode: KnowledgeNode = {
            id: `kn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: user.uid,
            category: item.category,
            title: item.title,
            summary: item.summary,
            dataPoints: item.dataPoints || [],
            keyTakeaways: item.keyTakeaways || [],
            confidence: item.confidence || 0.95,
            lastMentioned: nowIso,
            sourceEntryId: activeJournalId,
            createdAt: nowIso
          };

          await StorageService.saveKnowledgeNode(user.uid, newNode);
          savedNewNodes.push(newNode);
        }

        const combinedNodes = [...savedNewNodes, ...knowledgeNodes];
        if (onKnowledgeNodesUpdated) {
          onKnowledgeNodesUpdated(combinedNodes);
        }

        const firstTitle = savedNewNodes[0]?.title ? ` ("${savedNewNodes[0].title}")` : '';
        setDistillStatus(`Captured ${savedNewNodes.length} context item${savedNewNodes.length > 1 ? 's' : ''}${firstTitle} to Knowledge Hub.`);
      } else {
        setDistillStatus('Knowledge Hub is up to date with your latest conversation context.');
      }
    } catch (workerErr: any) {
      console.warn('[Insight Sync Notice]:', workerErr?.message || workerErr);
      setDistillStatus('Sync scheduled for next cycle.');
    } finally {
      setIsDistilling(false);
      isWorkerBusyRef.current = false;
      setTimeout(() => setDistillStatus(null), 5000);
    }
  }, [user, token, localMessages, knowledgeNodes, journals, activeJournalId, onKnowledgeNodesUpdated]);

  // Hourly recurring background knowledge distillation task (every 60 minutes)
  useEffect(() => {
    if (!user || !token) return;
    const HOURLY_MS = 60 * 60 * 1000;
    const hourlyTimer = setInterval(() => {
      const pendingTurns = localMessages.filter(m => !m.analyzedForKnowledge);
      if (pendingTurns.length >= 2 && !isWorkerBusyRef.current) {
        console.log('[Hourly Client Worker] Running hourly scheduled context distillation...');
        runBackgroundDistillation();
      }
    }, HOURLY_MS);

    return () => clearInterval(hourlyTimer);
  }, [user, token, localMessages, runBackgroundDistillation]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (confirm('Clear current brainstorming conversation?')) {
      const initMsg: ChatMessage = {
        id: 'msg-cleared-' + Date.now(),
        role: 'model',
        text: 'Brainstorm history reset. What new thought or project would you like to explore?',
        timestamp: new Date().toISOString()
      };
      setLocalMessages([initMsg]);
      onUpdateMessages([initMsg]);
    }
  };

  const quickSparks = [
    "Help me explore why this feels challenging",
    "What is a productive perspective shift for this?",
    "Brainstorm 3 bold creative experiments",
    "What blind spots might I be missing here?",
    "Synthesize this into a core philosophy"
  ];

  return (
    <div className={`flex flex-col h-full bg-slate-900/60 border border-slate-800 ${isStandalone ? 'rounded-3xl max-w-5xl mx-auto my-4 shadow-2xl' : 'rounded-2xl'} overflow-hidden`}>
      {/* Header */}
      <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Gemini Brainstorming Partner</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                AI Active
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Private Session</span>
              {knowledgeNodes.length > 0 && (
                <>
                  <span>•</span>
                  <button 
                    onClick={onOpenMemoryPalace}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{knowledgeNodes.length} Context Nodes Linked</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Grounding Journal Selector (if standalone) */}
          {isStandalone && journals.length > 0 && onSelectActiveJournal && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={activeJournalId || ''}
                onChange={(e) => onSelectActiveJournal(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
              >
                {journals.map((j) => (
                  <option key={j.id} value={j.id} className="bg-slate-900 text-white">
                    Context: {j.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Autonomous Background Worker Trigger & Status */}
          {(() => {
            const unanalyzedCount = localMessages.filter(m => !m.analyzedForKnowledge).length;
            const analyzedCount = localMessages.filter(m => m.analyzedForKnowledge).length;
            const isAllAnalyzed = unanalyzedCount === 0 && localMessages.length > 0;

            return (
              <button
                id="worker-distill-btn"
                onClick={() => runBackgroundDistillation()}
                disabled={isDistilling || (unanalyzedCount === 0 && localMessages.length === 0)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition ${
                  isDistilling
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                    : isAllAnalyzed
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/50'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={
                  isAllAnalyzed
                    ? `All ${analyzedCount} conversation turns are synced to your Knowledge Hub.`
                    : `Capture facts & context from your ${unanalyzedCount} recent message${unanalyzedCount === 1 ? '' : 's'} into Knowledge Hub.`
                }
              >
                {isDistilling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                    <span className="hidden sm:inline">Capturing Context...</span>
                  </>
                ) : isAllAnalyzed ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Context Synced ({analyzedCount})</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">
                      {unanalyzedCount > 0 ? `Capture Context (${unanalyzedCount})` : 'Capture Context'}
                    </span>
                  </>
                )}
              </button>
            );
          })()}

          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/30 transition"
            title="Clear brainstorm history"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Background Worker Notification Banner */}
      {distillStatus && (
        <div className="px-4 py-2 bg-indigo-950/80 border-b border-indigo-800/60 flex items-center justify-between text-xs text-indigo-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{distillStatus}</span>
          </div>
          <button
            onClick={() => setDistillStatus(null)}
            className="text-slate-400 hover:text-white text-xs ml-2"
          >
            &times;
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
        {localMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Bot className="w-7 h-7" />
            </div>
            <h4 className="font-semibold text-slate-200 text-base mb-1">Start a Brainstorm Session</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
              Unpack raw thoughts, work through difficult trade-offs, or ask Gemini to challenge your assumptions. All turns remain confidential in your tenant.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md text-left">
              {quickSparks.map((spark, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(spark)}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition text-xs"
                >
                  "{spark}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          localMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-600/30 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 border border-sky-500/30 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[80%] space-y-1.5`}>
                <div className="flex items-center gap-2 px-1">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {msg.role === 'user' ? 'You' : 'Brainstorming Partner'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <MarkdownMessage content={msg.text} isUser={msg.role === 'user'} />
                </div>

                {/* Turn Actions */}
                <div className="flex items-center gap-3 pl-1 pt-0.5">
                  <button
                    onClick={() => handleCopy(msg.id, msg.text)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
                    title="Copy to clipboard"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {msg.role === 'model' && onAppendToJournal && (
                    <button
                      onClick={() => onAppendToJournal(`\n\n> **Gemini Insight:**\n> ${msg.text}\n`)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-sky-300 transition"
                      title="Insert this reply into current active journal"
                    >
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>Insert into Journal</span>
                    </button>
                  )}

                  {/* Turn Sync Status Badge */}
                  {msg.analyzedForKnowledge ? (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40 font-medium"
                      title={
                        msg.analyzedAt ? `Synced to Knowledge Hub on ${new Date(msg.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Synced to Knowledge Hub'
                      }
                    >
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span>Synced</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded border border-slate-700/50 font-medium"
                      title="New conversation turn ready for insight sync"
                    >
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      <span>New</span>
                    </span>
                  )}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-600/30">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Turn */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 animate-pulse border border-sky-500/30">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700/80 text-slate-300 flex items-center gap-2.5 text-xs sm:text-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              <span>Reflecting on your thoughts...</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleSend()}
              className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-white font-medium transition"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sparks Bar (if standalone) */}
      {isStandalone && localMessages.length > 0 && (
        <div className="relative border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex items-center px-2 py-2">
          {/* Label */}
          <div className="shrink-0 flex items-center gap-1.5 pl-2 pr-2.5 py-0.5 text-[11px] font-medium text-slate-400 border-r border-slate-800/60 select-none">
            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">Sparks:</span>
          </div>

          {/* Scroll Navigation: Left */}
          <button
            type="button"
            onClick={() => scrollSparks('left')}
            className="shrink-0 p-1 ml-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition hidden sm:flex items-center justify-center"
            title="Scroll sparks left"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Horizontally scrollable pill track without default scrollbar */}
          <div
            ref={sparksScrollRef}
            onWheel={(e) => {
              if (e.currentTarget && e.deltaY !== 0) {
                e.currentTarget.scrollLeft += e.deltaY;
              }
            }}
            className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-2 text-[11px]"
          >
            {quickSparks.map((spark, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => handleSend(spark)}
                className="whitespace-nowrap px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800/90 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/40 transition-all duration-150 active:scale-95 disabled:opacity-40 shrink-0 flex items-center gap-1.5 shadow-sm"
              >
                <span>{spark}</span>
              </button>
            ))}
          </div>

          {/* Scroll Navigation: Right */}
          <button
            type="button"
            onClick={() => scrollSparks('right')}
            className="shrink-0 p-1 mr-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition hidden sm:flex items-center justify-center"
            title="Scroll sparks right"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            id="brainstorm-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Gemini to unpack a thought, brainstorm ideas, or review assumptions..."
            disabled={isLoading}
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            id="brainstorm-send-btn"
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium transition flex items-center justify-center shadow-md shadow-indigo-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

