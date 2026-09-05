import { ChatMessage, JournalSummary, SecurityAuditReport, KnowledgeNode, MemoryQueryResult } from '../types';

export class ApiService {
  private static getHeaders(token: string | null): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || 'anonymous-token'}`
    };
  }

  /**
   * Multi-turn conversational brainstorming with server-side Gemini,
   * infused with long-term context from the user's Knowledge Hub.
   */
  static async sendChatMessage(
    token: string | null,
    messages: ChatMessage[],
    userContext?: string,
    knowledgeHub?: KnowledgeNode[]
  ): Promise<ChatMessage & { knowledgeNodesReferenced?: number }> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ messages, userContext, knowledgeHub })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      role: 'model',
      text: data.text,
      timestamp: data.timestamp || new Date().toISOString(),
      knowledgeNodesReferenced: data.knowledgeNodesReferenced
    };
  }

  /**
   * Request automatic synthesis, sentiment scoring, and action plan extraction,
   * plus extracted Knowledge Hub nodes for the Memory Palace.
   */
  static async summarizeEntry(
    token: string | null,
    title: string,
    content: string,
    messages?: ChatMessage[]
  ): Promise<JournalSummary & { 
    hashSignature?: string; 
    extractedKnowledge?: Array<{
      category: any;
      title: string;
      summary: string;
      keyTakeaways?: string[];
    }>;
  }> {
    const res = await fetch('/api/gemini/summarize', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ title, content, messages })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Summarization failed: ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Query the user's private Memory Palace / Knowledge Hub
   */
  static async askMemory(
    token: string | null,
    query: string,
    knowledgeNodes: KnowledgeNode[],
    recentEntries: { title: string; summary?: string; content?: string; createdAt: string }[]
  ): Promise<MemoryQueryResult> {
    const res = await fetch('/api/gemini/ask-memory', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ query, knowledgeNodes, recentEntries })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Memory query failed: ${res.status}`);
    }

    return await res.json();
  }

  /**
   * Generate creative spark reflection prompts
   */
  static async getPrompts(
    token: string | null,
    mood?: string,
    theme?: string
  ): Promise<string[]> {
    try {
      const res = await fetch('/api/gemini/prompts', {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify({ mood, theme })
      });
      if (!res.ok) throw new Error('Prompts failed');
      const data = await res.json();
      return data.prompts || [];
    } catch {
      return [
        "What gave you the most energy today, and why?",
        "What is one challenge that helped you learn something new recently?",
        "What belief or assumption are you reconsidering right now?",
        "If you had complete confidence, what idea would you test tomorrow?"
      ];
    }
  }

  /**
   * Fetch server-side security audit details (STRIDE compliance status)
   */
  static async getSecurityAudit(): Promise<SecurityAuditReport> {
    const res = await fetch('/api/security/audit');
    if (!res.ok) throw new Error('Failed to retrieve security audit');
    return await res.json();
  }
}
