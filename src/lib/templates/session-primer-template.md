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
2. Stage changes: git add .
3. Commit with format: type: description
   - feat: new feature
   - fix: bug fix
   - refactor: code restructure
   - docs: documentation
   - chore: config/dependencies
4. Push to remote: git push origin main

FILE STRUCTURE:
- src/app/ — routes and pages
- src/components/ — React components
- src/lib/ — utilities (db, crypto, ai)
- src/actions/ — server actions
- src/types/ — TypeScript types

KEY FILES:
- src/lib/db/client.ts — Supabase client
- src/lib/crypto/ — AES-256-GCM encryption
- src/lib/ai/ — OpenAI embeddings, Claude incubator
- src/actions/notes.actions.ts — Note CRUD operations

Ask clarifying questions if requirements are ambiguous. Prioritize working code over perfect code.
```

---

## When to Use

- Start of a new chat session
- When Claude Code seems to forget context
- When starting a new feature
- After a long break from the project

---

## Customization

Add project-specific context as needed:

```
CURRENT TASK:
Implement [feature name] as described in CLAUDE_CODE_PRIORITY_FEATURES.md

FOCUS AREAS:
- [specific file or component]
- [specific functionality]

AVOID:
- [any anti-patterns or past mistakes]
```
