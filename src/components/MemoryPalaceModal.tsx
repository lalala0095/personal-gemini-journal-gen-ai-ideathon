import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles, 
  Search, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  FolderKanban, 
  Target, 
  BookOpen, 
  Lightbulb, 
  User, 
  Smile, 
  AlertCircle,
  HelpCircle,
  Send,
  Loader2,
  X,
  Clock,
  Compass,
  Cpu
} from 'lucide-react';
import { KnowledgeNode, KnowledgeCategory } from '../types';
import { ApiService } from '../services/apiService';
import { StorageService } from '../services/storageService';

interface MemoryPalaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  token: string | null;
  knowledgeNodes: KnowledgeNode[];
  onUpdateNodes: (nodes: KnowledgeNode[]) => void;
  recentEntries: { title: string; summary?: string; content?: string; createdAt: string }[];
}

const CATEGORY_META: Record<KnowledgeCategory, { label: string; icon: any; color: string; bg: string; border: string }> = {
  Career: { label: 'Career & Work', icon: FolderKanban, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Goals: { label: 'Goals & Targets', icon: Target, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Learning: { label: 'Skills & Learning', icon: BookOpen, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
  Projects: { label: 'Ideas & Projects', icon: Lightbulb, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Personal: { label: 'Personal Life', icon: User, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  Mindset: { label: 'Mindset & Values', icon: Smile, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
  Concerns: { label: 'Reflections & Concerns', icon: AlertCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' }
};

export const MemoryPalaceModal: React.FC<MemoryPalaceModalProps> = ({
  isOpen,
  onClose,
  userId,
  token,
  knowledgeNodes,
  onUpdateNodes,
  recentEntries
}) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'ask'>('nodes');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ask Memory State
  const [memoryQuestion, setMemoryQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [memoryAnswer, setMemoryAnswer] = useState<{
    answer: string;
    relevantNodes: { id: string; title: string; category: string; snippet: string }[];
  } | null>(null);

  // New Node Modal State
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeCategory, setNewNodeCategory] = useState<KnowledgeCategory>('Goals');
  const [newNodeTitle, setNewNodeTitle] = useState('');
  const [newNodeSummary, setNewNodeSummary] = useState('');
  const [newNodeTakeaways, setNewNodeTakeaways] = useState('');

  if (!isOpen) return null;

  const filteredNodes = knowledgeNodes.filter(node => {
    const matchesCategory = selectedCategory === 'All' || node.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.keyTakeaways?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAskMemory = async (q?: string) => {
    const queryToUse = q || memoryQuestion;
    if (!queryToUse.trim()) return;
    setIsAsking(true);
    setMemoryAnswer(null);

    try {
      const result = await ApiService.askMemory(token, queryToUse, knowledgeNodes, recentEntries);
      setMemoryAnswer({
        answer: result.answer,
        relevantNodes: result.relevantNodes
      });
    } catch (err: any) {
      setMemoryAnswer({
        answer: `Unable to query memory right now: ${err.message}`,
        relevantNodes: []
      });
    } finally {
      setIsAsking(false);
    }
  };

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle.trim() || !newNodeSummary.trim()) return;

    const newNode: KnowledgeNode = {
      id: `kn-${Date.now()}`,
      userId,
      category: newNodeCategory,
      title: newNodeTitle.trim(),
      summary: newNodeSummary.trim(),
      keyTakeaways: newNodeTakeaways.split('\n').map(s => s.trim()).filter(Boolean),
      confidence: 1.0,
      lastMentioned: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    await StorageService.saveKnowledgeNode(userId, newNode);
    const updated = [newNode, ...knowledgeNodes];
    onUpdateNodes(updated);

    setNewNodeTitle('');
    setNewNodeSummary('');
    setNewNodeTakeaways('');
    setIsAddingNode(false);
  };

  const handleDeleteNode = async (id: string) => {
    await StorageService.deleteKnowledgeNode(userId, id);
    const updated = knowledgeNodes.filter(n => n.id !== id);
    onUpdateNodes(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Memory Palace</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200">
                  Agent Long-Term Memory
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                  <Cpu className="w-3 h-3 text-indigo-600" />
                  Automated Insight Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Your personal long-term knowledge base. Key ideas, milestones, and perspectives from your conversations are organized here automatically.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('nodes')}
              className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'nodes'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              Knowledge Hub ({knowledgeNodes.length})
            </button>
            <button
              onClick={() => setActiveTab('ask')}
              className={`py-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'ask'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Ask Your Memory
            </button>
          </div>

          {activeTab === 'nodes' && (
            <button
              onClick={() => setIsAddingNode(true)}
              className="my-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Knowledge Node
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/40">
          {activeTab === 'nodes' ? (
            <div className="space-y-5">
              {/* Category Filter Pills & Search */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  {['All', ...Object.keys(CATEGORY_META)].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        selectedCategory === cat
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search personal memory..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Add Node Form Dialog */}
              {isAddingNode && (
                <form 
                  onSubmit={handleCreateNode}
                  className="p-4 bg-white border border-indigo-200 rounded-xl shadow-sm space-y-3 animate-fadeIn"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      Add Custom Memory Node
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingNode(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Category</label>
                      <select
                        value={newNodeCategory}
                        onChange={e => setNewNodeCategory(e.target.value as KnowledgeCategory)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      >
                        {Object.keys(CATEGORY_META).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-slate-700 mb-1">Concept / Title</label>
                      <input
                        type="text"
                        value={newNodeTitle}
                        onChange={e => setNewNodeTitle(e.target.value)}
                        placeholder="e.g. Learning Python Machine Learning"
                        required
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Summary / Context</label>
                    <textarea
                      value={newNodeSummary}
                      onChange={e => setNewNodeSummary(e.target.value)}
                      placeholder="Explain what the AI should remember about this topic..."
                      rows={2}
                      required
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Key Takeaways (one per line)</label>
                    <textarea
                      value={newNodeTakeaways}
                      onChange={e => setNewNodeTakeaways(e.target.value)}
                      placeholder="Key milestone 1&#10;Key milestone 2"
                      rows={2}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNode(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
                    >
                      Save to Memory
                    </button>
                  </div>
                </form>
              )}

              {/* Node Cards Grid */}
              {filteredNodes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Brain className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No knowledge nodes found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Write journal reflections or click "New Knowledge Node" to train your AI partner's memory.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredNodes.map(node => {
                    const meta = CATEGORY_META[node.category] || CATEGORY_META.Personal;
                    const IconComponent = meta.icon;

                    return (
                      <div
                        key={node.id}
                        className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${meta.bg} ${meta.color} border ${meta.border}`}>
                              <IconComponent className="w-3 h-3" />
                              {meta.label}
                            </span>
                            <button
                              onClick={() => handleDeleteNode(node.id)}
                              className="text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Delete Memory Node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <h3 className="text-sm font-bold text-slate-900 mb-1">
                            {node.title}
                          </h3>

                          <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            {node.summary}
                          </p>

                          {node.keyTakeaways && node.keyTakeaways.length > 0 && (
                            <div className="space-y-1 mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Core Takeaways
                              </span>
                              {node.keyTakeaways.map((takeaway, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                                  <span className="text-indigo-500 font-bold">•</span>
                                  <span>{takeaway}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(node.lastMentioned).toLocaleDateString()}
                          </span>
                          <span className="text-emerald-600 font-medium">
                            ✓ Active in Agent Context
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* "Ask Your Memory" Tab */
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-indigo-500 to-sky-600 text-white rounded-xl p-5 shadow-sm">
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  Ask Your Memory Palace
                </h3>
                <p className="text-xs text-indigo-100 mt-1 max-w-xl">
                  Query across all your isolated journals and knowledge nodes. Gemini answers strictly using your personal archives.
                </p>

                {/* Prompt Quick Chips */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    "What have I been worried about lately?",
                    "What are my key career goals?",
                    "What skills am I currently learning?",
                    "Summarize my ongoing projects"
                  ].map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setMemoryQuestion(chip);
                        handleAskMemory(chip);
                      }}
                      className="px-2.5 py-1 text-xs bg-white/15 hover:bg-white/25 rounded-lg text-white font-medium transition-colors border border-white/20"
                    >
                      "{chip}"
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={memoryQuestion}
                  onChange={e => setMemoryQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAskMemory()}
                  placeholder="Ask a question about your personal history or ideas..."
                  className="flex-1 text-xs sm:text-sm px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  onClick={() => handleAskMemory()}
                  disabled={isAsking || !memoryQuestion.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Ask
                </button>
              </div>

              {/* Answer Box */}
              {isAsking && (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-700">Searching your private knowledge base...</p>
                  <p className="text-[11px] text-slate-400 mt-1">Cross-referencing your personal reflections and memories...</p>
                </div>
              )}

              {memoryAnswer && !isAsking && (
                <div className="p-5 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 border-b border-slate-100 pb-2">
                    <Brain className="w-4 h-4 text-indigo-600" />
                    Memory Synthesis Answer
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {memoryAnswer.answer}
                  </p>

                  {memoryAnswer.relevantNodes && memoryAnswer.relevantNodes.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[11px] font-bold uppercase text-slate-400 block mb-2">
                        Referenced Knowledge Nodes ({memoryAnswer.relevantNodes.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {memoryAnswer.relevantNodes.map(node => (
                          <div key={node.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                            <span className="font-semibold text-slate-900 block">{node.title}</span>
                            <span className="text-slate-500 text-[11px]">{node.snippet}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Private & Encrypted • Isolated to your account
          </div>
          <span className="text-slate-400">Secure Cloud Sync</span>
        </div>
      </div>
    </div>
  );
};
