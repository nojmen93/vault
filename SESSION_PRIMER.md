# Claude Code Session Primer

Copy and paste this at the start of every Claude Code session.

---

## The Prompt

```
You are working on Vault — a zero-knowledge idea incubator built with Next.js 15, Supabase, Clerk, Tailwind, and Shadcn/UI.

BEFORE STARTING:
1. Read CLAUDE.md for build commands and coding standards
2. Read ARCHITECTURE.md for system design and data flow
3. Read CLAUDE_CODE_WORKFLOW.md for Git workflow
4. Check ROADMAP.md to understand current sprint priorities

CODING RULES:
- TypeScript strict mode, explicit return types
- Server Components by default, 'use client' only when needed
- Server Actions for mutations (no API routes)
- Tailwind for styling, Shadcn/UI for components
- Error handling: Result pattern for expected errors, throw for unexpected
- Never hardcode secrets, always use .env.local

AFTER EACH FEATURE:
1. Verify build passes: pnpm build
2. Update documentation (see DOCUMENTATION RULE below)
3. Stage changes: git add .
4. Commit with format: type: description
   - feat: new feature
   - fix: bug fix
   - refactor: code restructure
   - docs: documentation
   - chore: config/dependencies
5. Push to remote: git push origin main

DOCUMENTATION RULE (MANDATORY):
After completing any feature, update ALL relevant md files:

- ROADMAP.md
  → Mark completed tasks with [x]
  → Add new tasks if scope expanded
  → Update sprint status

- ARCHITECTURE.md
  → Add new components to system diagram
  → Document new data flows
  → Update database schema if changed
  → Add new API integrations

- API.md
  → Document new server actions
  → Add function signatures and parameters
  → Include example usage

- DECISIONS.md
  → Log any architectural choices made
  → Document "why X over Y" reasoning
  → Record any trade-offs

- CONTEXT.md
  → Update feature list if new capabilities added
  → Adjust user stories if scope changed

- SECURITY.md
  → Document any new auth flows
  → Update encryption details if changed
  → Add new security considerations

- README.md
  → Update feature list
  → Add new environment variables
  → Update quick start if needed

Never skip documentation. It compounds over time.

FILE STRUCTURE:
- src/app/ — routes and pages
- src/components/ — React components
- src/lib/ — utilities (db, crypto, ai)
- src/actions/ — server actions
- src/types/ — TypeScript types
- src/lib/templates/ — expert doc templates for kit generation

KEY FILES:
- src/lib/db/client.ts — Supabase client
- src/lib/crypto/ — AES-256-GCM encryption
- src/lib/ai/ — OpenAI embeddings, Claude incubator
- src/lib/ai/thinking-profile.ts — Personal AI memory
- src/lib/ai/personal-rag.ts — Knowledge base context
- src/lib/github/ — GitHub integration
- src/actions/notes.actions.ts — Note CRUD operations
- src/actions/incubator.actions.ts — AI analysis actions

CURRENT FEATURES (Implemented):
- Quick Capture (Cmd+K)
- Idea Cloud with drag-drop and dark theme
- Idea Chat Interface
- Semantic "More Like This"
- Incubator Mode with streaming
- Personal Thinking Profile
- Personal RAG/Knowledge Base
- Project Kit Generation
- GitHub Integration

Ask clarifying questions if requirements are ambiguous. Prioritize working code over perfect code. Always update docs.
```

---

## When to Use

- Start of a new chat session
- When Claude Code seems to forget context
- When starting a new feature
- After a long break from the project

---

## Quick Commands

Paste these as needed:

### Check Documentation Status
```
Compare implemented features vs documentation. Update all md files to reflect current state.
```

### Run Full Test Suite
```
Run pnpm test && pnpm test:e2e and fix any failures.
```

### Pre-Commit Check
```
Before committing, verify:
1. pnpm build passes
2. pnpm lint has no errors
3. All relevant md files are updated
4. Commit message follows format
```

---

## Customization

Add project-specific context as needed:

```
CURRENT TASK:
Implement [feature name]

FOCUS AREAS:
- [specific file or component]
- [specific functionality]

AVOID:
- [any anti-patterns or past mistakes]

RELATED DOCS:
- [specific md file to reference]
```
