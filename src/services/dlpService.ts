import { DLPIssue } from '../types';

// Regular expressions for detecting sensitive tokens and PII
const SENSITIVE_PATTERNS: { type: DLPIssue['type']; regex: RegExp; description: string }[] = [
  {
    type: 'API_KEY',
    regex: /(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36}|xox[baprs]-[0-9a-zA-Z-]{10,})/g,
    description: 'Cloud or Service API Key / Personal Access Token'
  },
  {
    type: 'SECRET_KEY',
    regex: /(?:[A-Za-z0-9+/]{40}={0,2}|BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY)/g,
    description: 'Cryptographic Private Key or High-Entropy Secret'
  },
  {
    type: 'PASSWORD',
    regex: /(?:password|passwd|pwd|secret)\s*[:=]\s*['"]?([^\s'"]{6,})['"]?/gi,
    description: 'Plaintext Password Assignment'
  },
  {
    type: 'CREDIT_CARD',
    regex: /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
    description: 'Potential Credit Card Number (16-digit)'
  },
  {
    type: 'PHONE',
    regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    description: 'Phone Number'
  }
];

export function scanForSensitiveData(text: string): DLPIssue[] {
  if (!text) return [];
  const issues: DLPIssue[] = [];

  for (const { type, regex, description } of SENSITIVE_PATTERNS) {
    let match: RegExpExecArray | null;
    // Reset regex index
    regex.lastIndex = 0;
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        type,
        description,
        match: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        suggestedReplacement: `[REDACTED_${type}]`
      });
    }
  }

  return issues;
}

export function autoRedactSensitiveData(text: string): { cleanText: string; redactedCount: number } {
  let cleanText = text;
  let redactedCount = 0;

  for (const { type, regex } of SENSITIVE_PATTERNS) {
    regex.lastIndex = 0;
    cleanText = cleanText.replace(regex, () => {
      redactedCount++;
      return `[REDACTED_${type}]`;
    });
  }

  return { cleanText, redactedCount };
}
