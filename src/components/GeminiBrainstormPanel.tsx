import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, ArrowDownToLine, RefreshCw, AlertCircle, HelpCircle, Brain } from 'lucide-react';
import { ChatMessage, KnowledgeNode } from '../types';
import { ApiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

interface GeminiBrainstormPanelProps {
  messages: ChatMessage[];
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onAppendToJournal: (text: string) => void;
  journalContent: string;
  knowledgeNodes?: KnowledgeNode[];
  onOpenMemoryPalace?: () => void;
}

export const GeminiBrainstormPanel: React.FC<GeminiBrainstormPanelProps> = ({
  messages,
  onUpdateMessages,
  onAppendToJournal,
  journalContent,
  knowledgeNodes = [],
  onOpenMemoryPalace
}) => {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || isLoading) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toISOString()
    };

    const newHistory = [...messages, userMsg];
    onUpdateMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ApiService.sendChatMessage(
        token,
        newHistory,
        journalContent ? `Current Journal Draft: ${journalContent.slice(0, 800)}` : undefined,
        knowledgeNodes
      );
      onUpdateMessages([...newHistory, response]);
    } catch (err: any) {
      setError(err.message || 'Failed to brainstorm with Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickSparks = [
    "Help me explore why this feels challenging",
    "What is a productive perspective shift for this?",
    "Brainstorm 3 bold creative experiments",
    "What blind spots might I be missing here?"
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-200">Gemini Brainstorming Partner</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span>Gemini 2.5 Flash</span>
              {knowledgeNodes.length > 0 && (
                <>
                  <span>•</span>
                  <button 
                    onClick={onOpenMemoryPalace}
                    className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
                  >
                    <Brain className="w-3 h-3" />
                    <span>{knowledgeNodes.length} Memory Nodes</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          Rate-Guarded
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="font-medium text-slate-300 mb-1">Start a Brainstorm Session</h4>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Bounce raw ideas, unravel emotional friction, or ask Gemini to challenge your assumptions.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
              {quickSparks.map((spark, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(spark)}
                  className="text-left px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition text-[11px]"
                >
                  "{spark}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className={`max-w-[85%] space-y-1.5`}>
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'model' && (
                  <div className="flex items-center gap-2 pl-1">
                    <button
                      onClick={() => onAppendToJournal(`\n\n> **Gemini Insight:**\n> ${msg.text}\n`)}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-sky-300 transition"
                      title="Insert this reply into your journal text"
                    >
                      <ArrowDownToLine className="w-3 h-3" />
                      <span>Insert into Journal</span>
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/80 text-slate-400 flex items-center gap-2 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
              <span>Gemini is reflecting...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
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
            placeholder="Ask Gemini to unpack a thought or brainstorm..."
            disabled={isLoading}
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
          <button
            id="brainstorm-send-btn"
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition flex items-center justify-center shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
