# Google AI Studio Security & Production Constitution

This document defines the mandatory, enterprise-grade production directives for this workspace. All development in this application must adhere strictly to these security invariants.

---

## 1. Threat Modeling & Risk Mitigation (STRIDE-Compliant)

Every feature and endpoint must be designed against the STRIDE threat model:
- **Spoofing**: Never trust client identity or unverified claims. All requests must validate authenticated identity (`request.auth.uid` or verified Firebase JWT).
- **Tampering**: Enforce strict schema boundaries, regex validation, and length constraints on all inputs. System timestamps (`request.time` / server-generated UTC) cannot be client-overridden.
- **Repudiation**: State transitions and journal entries must maintain immutable timestamps and author IDs that cannot be modified after initial write.
- **Information Disclosure**: Prevent data leakage through zero-trust tenant isolation. Queries must be constrained by owner UID; blanket collection scans or client-side filtering without database-level isolation are strictly forbidden.
- **Denial of Service / Wallet**: Enforce strict payload size limits (e.g., max 20,000 characters per journal entry), debounce AI invocations, and order rule evaluation (static checks before relational/document lookups).
- **Elevation of Privilege**: Users cannot grant themselves roles or elevate access. RBAC definitions must reside in trusted server logic or isolated admin collections.

---

## 2. Zero-Trust Cloud Firestore Isolation Rules

To eliminate cross-tenant data leakage in Google Cloud Firestore:
1. **Per-User Subcollections**: Store all personal data strictly under `/users/{userId}/...` paths.
2. **Access Control**: Every read, list, create, update, and delete operation must strictly verify `request.auth != null && request.auth.uid == userId`.
3. **Immutability of Ownership**: The document's `ownerId` and `createdAt` must match `request.auth.uid` and `request.time`, and must be immutable on update.
4. **Anti-Update Gaps**: Updates must use explicit `.diff(existing()).affectedKeys().hasOnly([...])` field whitelists.
5. **Default Deny**: The root database rule must begin with a default-deny catch-all: `match /{document=**} { allow read, write: if false; }`.

---

## 3. Secret & API Key Security Architecture

1. **Zero Browser Exposure**: Under no circumstance may the Gemini API key or any cloud credentials be exposed to the client-side bundle or browser network inspect panel.
2. **Server-Side Proxying**: All interactions with `@google/genai` must execute on the backend server.
3. **Secret Retrieval Strategy**: The server accesses keys via runtime environment variables injected through Google Cloud Secret Manager (`process.env.GEMINI_API_KEY`).
4. **Resilient Key Fallback**: Use lazy initialization with graceful error handling so missing keys fail fast with actionable server diagnostics without crashing startup.

---

## 4. Secure Coding Standards

- **Input Sanitization**: Escape or sanitize AI-rendered markdown to prevent Cross-Site Scripting (XSS).
- **Type Safety**: Strictly typed models across client and server with explicit response schemas for AI outputs.
- **Error Obfuscation**: Never expose stack traces, database schema specifics, or raw provider errors to the client.
- **Telemetry**: Server calls must identify with appropriate telemetry (`User-Agent: 'aistudio-build'`).
