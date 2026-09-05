import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseClient';
import { JournalEntry, ActionItem, KnowledgeNode } from '../types';

export class StorageService {
  /**
   * Generates isolated storage key for local mirroring
   */
  private static getLocalKey(userId: string): string {
    return `pj_tenant_vault_${userId}`;
  }

  private static getKnowledgeKey(userId: string): string {
    return `pj_knowledge_hub_${userId}`;
  }

  /**
   * Fetch all journal entries for the current user
   * Guarantees zero cross-tenant leakage by querying ONLY /users/{userId}/journals
   */
  static async getUserJournals(userId: string): Promise<JournalEntry[]> {
    if (!userId) return [];

    let entries: JournalEntry[] = [];

    if (isFirebaseConfigured && db) {
      try {
        const journalsRef = collection(db, 'users', userId, 'journals');
        const q = query(journalsRef, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);
        entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
      } catch (err) {
        console.warn('[Firestore] Query failed or offline, loading local mirror:', err);
      }
    }

    // Fallback/Mirror from tenant-isolated local store
    if (entries.length === 0) {
      const localData = localStorage.getItem(this.getLocalKey(userId));
      if (localData) {
        try {
          entries = JSON.parse(localData);
        } catch (e) {
          entries = [];
        }
      }
    }

    return entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Fetch all Knowledge Hub nodes for the user
   * Scoped strictly to /users/{userId}/knowledge_hub
   */
  static async getUserKnowledgeHub(userId: string): Promise<KnowledgeNode[]> {
    if (!userId) return [];

    let nodes: KnowledgeNode[] = [];

    if (isFirebaseConfigured && db) {
      try {
        const hubRef = collection(db, 'users', userId, 'knowledge_hub');
        const snapshot = await getDocs(hubRef);
        nodes = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeNode));
      } catch (err) {
        console.warn('[Firestore Knowledge Hub] Query failed or offline, loading local mirror:', err);
      }
    }

    if (nodes.length === 0) {
      const localData = localStorage.getItem(this.getKnowledgeKey(userId));
      if (localData) {
        try {
          nodes = JSON.parse(localData);
        } catch (e) {
          nodes = [];
        }
      }
    }

    // Clean up any legacy pre-seeded mock nodes (e.g. kn-1, kn-2, kn-3 or old template titles)
    const mockTitles = [
      'Transitioning to AI Engineering',
      '30-Day Deep Work Habit',
      'Mastering Agent Development Kit (ADK)',
      'Technical Role & Primary Architecture',
      'Deep Work Schedule & Focus Routine',
      'Communication & Output Preferences'
    ];
    const legacyMockNodes = nodes.filter(n => 
      ['kn-1', 'kn-2', 'kn-3'].includes(n.id) || mockTitles.includes(n.title)
    );

    if (legacyMockNodes.length > 0) {
      for (const mockNode of legacyMockNodes) {
        if (isFirebaseConfigured && db) {
          try {
            const docRef = doc(db, 'users', userId, 'knowledge_hub', mockNode.id);
            deleteDoc(docRef).catch(() => {});
          } catch (e) {
            // ignore
          }
        }
      }
      nodes = nodes.filter(n => !['kn-1', 'kn-2', 'kn-3'].includes(n.id) && !mockTitles.includes(n.title));
      try {
        localStorage.setItem(this.getKnowledgeKey(userId), JSON.stringify(nodes));
      } catch (e) {}
    }

    return nodes.sort((a, b) => new Date(b.lastMentioned).getTime() - new Date(a.lastMentioned).getTime());
  }

  /**
   * Save or update a Knowledge Node
   */
  static async saveKnowledgeNode(userId: string, node: KnowledgeNode): Promise<void> {
    if (!userId) return;

    const nodeToSave: KnowledgeNode = {
      ...node,
      userId,
      lastMentioned: new Date().toISOString()
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'users', userId, 'knowledge_hub', node.id);
        await setDoc(docRef, nodeToSave, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Live knowledge save failed, caching locally:', err);
      }
    }

    try {
      const existing = await this.getUserKnowledgeHub(userId);
      const idx = existing.findIndex(n => n.id === node.id);
      let updated: KnowledgeNode[];
      if (idx >= 0) {
        updated = [...existing];
        updated[idx] = nodeToSave;
      } else {
        updated = [nodeToSave, ...existing];
      }
      localStorage.setItem(this.getKnowledgeKey(userId), JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update local knowledge hub:', e);
    }
  }

  /**
   * Delete a Knowledge Node
   */
  static async deleteKnowledgeNode(userId: string, nodeId: string): Promise<void> {
    if (!userId || !nodeId) return;

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'users', userId, 'knowledge_hub', nodeId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[Firestore] Delete knowledge node failed:', err);
      }
    }

    try {
      const existing = await this.getUserKnowledgeHub(userId);
      const filtered = existing.filter(n => n.id !== nodeId);
      localStorage.setItem(this.getKnowledgeKey(userId), JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete from local knowledge hub:', e);
    }
  }

  /**
   * Save or update a journal entry
   * Writes directly to /users/{userId}/journals/{journalId}
   */
  static async saveJournal(userId: string, journal: JournalEntry): Promise<void> {
    if (!userId) throw new Error('User ID is required to enforce zero-trust isolation.');

    const docToSave: JournalEntry = {
      ...journal,
      userId,
      updatedAt: new Date().toISOString()
    };

    // 1. Cloud Firestore write (if configured)
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'users', userId, 'journals', journal.id);
        await setDoc(docRef, docToSave, { merge: true });
      } catch (err) {
        console.warn('[Firestore] Live write failed, saving to local tenant cache:', err);
      }
    }

    // 2. Tenant-partitioned local cache
    try {
      const existing = await this.getUserJournals(userId);
      const index = existing.findIndex(e => e.id === journal.id);
      let updated: JournalEntry[];
      if (index >= 0) {
        updated = [...existing];
        updated[index] = docToSave;
      } else {
        updated = [docToSave, ...existing];
      }
      localStorage.setItem(this.getLocalKey(userId), JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to update local mirror:', e);
    }
  }

  /**
   * Delete a journal entry
   */
  static async deleteJournal(userId: string, journalId: string): Promise<void> {
    if (!userId || !journalId) return;

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'users', userId, 'journals', journalId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[Firestore] Live delete failed:', err);
      }
    }

    try {
      const existing = await this.getUserJournals(userId);
      const updated = existing.filter(e => e.id !== journalId);
      localStorage.setItem(this.getLocalKey(userId), JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete from local mirror:', e);
    }
  }

  /**
   * Toggle action item completion in a journal
   */
  static async toggleActionItem(
    userId: string,
    journalId: string,
    actionId: string,
    completed: boolean
  ): Promise<JournalEntry | null> {
    const journals = await this.getUserJournals(userId);
    const target = journals.find(j => j.id === journalId);
    if (!target || !target.actionItems) return null;

    const updatedItems = target.actionItems.map(item =>
      item.id === actionId ? { ...item, completed } : item
    );

    const updatedJournal: JournalEntry = {
      ...target,
      actionItems: updatedItems,
      updatedAt: new Date().toISOString()
    };

    await this.saveJournal(userId, updatedJournal);
    return updatedJournal;
  }
}
