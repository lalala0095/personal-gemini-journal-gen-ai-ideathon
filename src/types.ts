export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAnonymous?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  category?: 'reflection' | 'task' | 'habit' | 'creative';
}

export interface JournalSummary {
  summary: string;
  sentiment: 'energized' | 'reflective' | 'focused' | 'contemplative' | 'neutral' | 'optimistic';
  sentimentScore: number; // 0 to 100
  keyTakeaways: string[];
  actionItems: ActionItem[];
  tags: string[];
  cognitiveBiasesNoticed?: string[];
  growthInsight?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary?: string;
  sentiment?: 'energized' | 'reflective' | 'focused' | 'contemplative' | 'neutral' | 'optimistic';
  sentimentScore?: number;
  tags: string[];
  keyTakeaways?: string[];
  actionItems?: ActionItem[];
  messages?: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  hashSignature?: string;
  isBookmarked?: boolean;
  dlpScanPassed?: boolean;
}

export interface SecurityAuditReport {
  timestamp: string;
  tenantIsolation: {
    status: 'ACTIVE_ZERO_TRUST';
    pathPattern: '/users/{uid}/*';
    crossTenantAllowed: false;
  };
  secretManager: {
    geminiKeyConfigured: boolean;
    storageMethod: 'Google Cloud Secret Manager / Runtime Env';
    clientSideExposure: false;
  };
  strideStatus: {
    spoofing: 'Protected via UID Token Claims & JWT Validation';
    tampering: 'Protected via Immutable Timestamps & SHA-256 Hashes';
    repudiation: 'Protected via Audit Logs & Nonce Signatures';
    infoDisclosure: 'Protected via Zero-Trust Per-User Subcollections';
    denialOfService: 'Protected via 30KB Payload Limits & Rate Guard';
    elevationOfPrivilege: 'Protected via ABAC Static Validation Rules';
  };
  activeUserUid?: string;
}

export interface DLPIssue {
  type: 'API_KEY' | 'PASSWORD' | 'CREDIT_CARD' | 'EMAIL' | 'PHONE' | 'SECRET_KEY';
  description: string;
  match: string;
  startIndex: number;
  endIndex: number;
  suggestedReplacement: string;
}
