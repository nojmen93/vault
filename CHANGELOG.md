# Vault Changelog

> Single source of truth for what changed and when.
> Claude Code updates this after every feature. Web Claude reads it to sync memory.

---

## Format

```
## [DATE] - Session Summary

### Added
- feat: description (file paths affected)

### Changed
- refactor: description (file paths affected)

### Fixed
- fix: description (file paths affected)

### Removed
- removed: description (file paths affected)

### Decisions
- Chose X over Y because Z (update DECISIONS.md)

### Status Update
- Feature X: not started | in progress | spec done | implemented | shipped
```

---

## Current Feature Status

| Feature                    | Status         | Notes                                      |
|----------------------------|----------------|--------------------------------------------|
| Quick Capture (Cmd+K)     | implemented    | Working, deployed                          |
| Idea Cloud (drag bubbles) | in progress    | Dark grayscale theme, free drag            |
| Incubator Mode             | in progress    | Streaming Claude analysis                  |
| Encryption (AES-256-GCM)  | not wired up   | Crypto lib exists, notes still plaintext   |
| Embeddings / Search        | not started    | pgvector ready, generation not wired       |
| Personal RAG               | spec done      | Context injection into AI prompts          |
| Theme Clustering           | spec done      | k-means + Claude for theme names           |
| The Honest Mirror          | spec done      | Proactive AI agent, accountability partner |
| Speech-to-Text             | spec done      | Web Speech API, mic in Quick Capture       |
| Idea Discovery Wizard      | spec done      | Project Kit, GitHub integration, EU focus  |
| Personal Thinking Profile  | spec done      | Pulsating brain viz, pattern learning      |
| Settings in sidebar        | removed        | Accessible via Profile page only           |

---

## Log

<!-- Most recent first -->

### [2026-02-09] - Documentation & Memory Sync

#### Added
- CHANGELOG.md (this file) for cross-session context tracking
- Updated SESSION_PRIMER.md with post-session sync instructions

#### Status Update
- No implementation changes this session (planning/docs only)

---

### [2026-02-09] - The Honest Mirror Spec

#### Added
- Full implementation guide for The Honest Mirror agent
- Database schemas: agent_conversations, agent_commitments, agent_key_moments, agent_interventions, agent_behavior_metrics
- Proactive intervention triggers (ghosting, pivot fatigue, momentum, etc.)
- Agent chat UI component specs

#### Decisions
- Agent should be proactive, not reactive -- daily cron checks for stuck patterns
- Agent references specific user history, not generic advice

#### Status Update
- The Honest Mirror: spec done (not implemented)

---

### [2026-02-06] - UI & Feature Design Session

#### Changed
- Color scheme: purple → warm amber (#D97706) on black/gray base
- Removed Settings from sidebar navigation

#### Added
- Speech-to-text spec for Quick Capture (Web Speech API)
- Personal RAG / knowledge base design (pgvector context injection)
- Region-specific suggestions for Idea Discovery (Europe/Scandinavia)
- Minimalist pulsating brain visualization for Thinking Profile

#### Decisions
- Amber over teal -- "lightbulb moment" feel fits idea incubator
- Web Speech API over paid transcription -- free, built-in, good mobile support

#### Status Update
- Quick Capture: implemented
- Idea Cloud: in progress (drag + dark theme designed)
- Incubator: in progress

---

### [2026-02-05] - Documentation Framework

#### Added
- 10-file documentation framework established
- Recommended additions: SCHEMAS.md, TESTING.md, DEPLOYMENT.md, ERRORS.md
- SESSION_PRIMER.md for Claude Code context loading
- CLAUDE_CODE_PRIORITY_FEATURES.md

#### Decisions
- CLAUDE.md is the primary control plane for AI sessions
- Start with 3 core files (CLAUDE.md, ARCHITECTURE.md, README.md), scale from there
