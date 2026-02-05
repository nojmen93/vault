# Architectural Decisions

This document records significant architectural decisions made during development. Check here before proposing alternatives.

---

## ADR-001: Client-Side Encryption

**Date:** 2024-01

**Status:** Accepted

**Context:**
Users need confidence that their ideas are private. Server-side encryption still requires trusting the server operator.

**Decision:**
Implement client-side encryption using Web Crypto API with AES-256-GCM.

**Consequences:**
- (+) True zero-knowledge: server never sees plaintext
- (+) No trust required in server operator
- (-) Lost password = lost data (no recovery possible)
- (-) More complex client-side code
- (-) Can't search encrypted content server-side

---

## ADR-002: Embeddings for Search

**Date:** 2024-01

**Status:** Accepted

**Context:**
Need semantic search, but content is encrypted. Can't search ciphertext.

**Decision:**
Generate embeddings from plaintext before encryption, store only embeddings. Plaintext is discarded immediately after embedding generation.

**Consequences:**
- (+) Enables semantic search on encrypted notes
- (+) Embeddings can't be reversed to plaintext
- (-) Requires sending plaintext to OpenAI (momentarily)
- (-) Additional API cost per note
- (-) Search quality depends on embedding model

**Alternatives Considered:**
- Local embedding models: Too slow for real-time, but planned for future
- No search: Poor UX for note-taking app

---

## ADR-003: Next.js Server Actions

**Date:** 2024-01

**Status:** Accepted

**Context:**
Need server-side logic for database operations and API calls.

**Decision:**
Use Next.js Server Actions instead of API routes.

**Consequences:**
- (+) Type safety between client and server
- (+) Automatic CSRF protection
- (+) Simpler code (no fetch boilerplate)
- (+) Works with React Server Components
- (-) Vendor lock-in to Next.js
- (-) Less familiar pattern for some developers

**Alternatives Considered:**
- tRPC: Additional dependency, similar benefits
- REST API routes: More boilerplate, manual type safety

---

## ADR-004: Clerk for Authentication

**Date:** 2024-01

**Status:** Accepted

**Context:**
Authentication is security-critical. DIY auth is error-prone.

**Decision:**
Use Clerk for all authentication needs.

**Consequences:**
- (+) Secure by default (no auth vulnerabilities)
- (+) OAuth providers included
- (+) User management UI included
- (+) Handles sessions, tokens, refresh
- (-) External dependency
- (-) Monthly cost at scale
- (-) Less customization

**Alternatives Considered:**
- NextAuth: More control, more responsibility
- Auth0: Similar to Clerk, higher cost
- DIY: Too risky for MVP

---

## ADR-005: Supabase + pgvector

**Date:** 2024-01

**Status:** Accepted

**Context:**
Need a database that supports both relational data and vector similarity search.

**Decision:**
Use Supabase (PostgreSQL) with pgvector extension.

**Consequences:**
- (+) Single database for all data
- (+) Excellent vector search performance
- (+) Row Level Security built-in
- (+) Generous free tier
- (-) Vendor lock-in to Supabase
- (-) pgvector less mature than Pinecone

**Alternatives Considered:**
- PostgreSQL + Pinecone: Two systems to manage
- MongoDB Atlas: Less mature vector search

---

## ADR-006: Result Pattern for Errors

**Date:** 2024-01

**Status:** Accepted

**Context:**
Server Actions need consistent error handling that works with TypeScript.

**Decision:**
All Server Actions return `{ success: true, data } | { success: false, error }`.

**Consequences:**
- (+) Type-safe error handling
- (+) Explicit success/failure states
- (+) Consistent across all actions
- (+) No try/catch needed in components
- (-) Slightly more verbose
- (-) Different from throw-based patterns

**Alternatives Considered:**
- Throw exceptions: Harder to type, requires boundaries
- Return null on error: No error information

---

## ADR-007: Shadcn/UI Components

**Date:** 2024-01

**Status:** Accepted

**Context:**
Need UI components that are customizable and don't add runtime bloat.

**Decision:**
Use Shadcn/UI (copy-paste components, not a package).

**Consequences:**
- (+) Full ownership of component code
- (+) Easy to customize
- (+) No external runtime dependency
- (+) Excellent Tailwind integration
- (-) Manual updates (no npm update)
- (-) Initial setup complexity

**Alternatives Considered:**
- Radix UI directly: Less styling out of box
- Material UI: Heavy runtime, different aesthetic
- Headless UI: Less comprehensive

---

## ADR-008: Anthropic Claude for Analysis

**Date:** 2024-01

**Status:** Accepted

**Context:**
Need an LLM for idea analysis and roadmap generation.

**Decision:**
Use Anthropic Claude (Claude 3.5 Sonnet) for Incubator Mode.

**Consequences:**
- (+) Excellent at structured analysis
- (+) Long context window
- (+) Good at following complex prompts
- (-) API cost
- (-) Another external dependency

**Alternatives Considered:**
- OpenAI GPT-4: Similar capabilities, privacy concerns
- Local LLM: Too slow, lower quality

---

## ADR-009: PBKDF2 Key Derivation

**Date:** 2024-01

**Status:** Accepted

**Context:**
Need to derive encryption key from user password.

**Decision:**
Use PBKDF2 with SHA-256, 100,000 iterations.

**Consequences:**
- (+) Browser-native (Web Crypto API)
- (+) Well-understood security properties
- (+) Configurable iteration count
- (-) Less memory-hard than Argon2
- (-) 100k iterations adds ~100ms latency

**Alternatives Considered:**
- Argon2: Better, but not in Web Crypto API
- scrypt: Also not browser-native
- bcrypt: Not designed for key derivation

---

## Template for New Decisions

```markdown
## ADR-XXX: [Title]

**Date:** YYYY-MM

**Status:** Proposed | Accepted | Deprecated | Superseded

**Context:**
[What is the issue that we're seeing that is motivating this decision?]

**Decision:**
[What is the change that we're proposing and/or doing?]

**Consequences:**
[What becomes easier or more difficult to do because of this change?]

**Alternatives Considered:**
[What other options were considered and why were they rejected?]
```
