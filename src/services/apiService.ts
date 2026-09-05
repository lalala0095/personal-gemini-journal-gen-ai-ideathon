import { ChatMessage, JournalSummary, SecurityAuditReport } from '../types';

export class ApiService {
  private static getHeaders(token: string | null): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || 'anonymous-token'}`
    };
  }

  /**
   * Multi-turn conversational brainstorming with server-side Gemini
   */
  static async sendChatMessage(
    token: string | null,
    messages: ChatMessage[],
    userContext?: string
  ): Promise<ChatMessage> {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify({ messages, userContext })
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
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Request automatic synthesis, sentiment scoring, and action plan extraction
   */
  static async summarizeEntry(
    token: string | null,
    title: string,
    content: string,
    messages?: ChatMessage[]
  ): Promise<JournalSummary & { hashSignature?: string }> {
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
