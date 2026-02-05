# Product Context

## Vision

Vault is a **zero-knowledge idea incubator** for entrepreneurs and developers. It's the place where fragmented thoughts become validated projects — without sacrificing privacy.

## Problem Statement

Entrepreneurs and developers have ideas scattered across:
- Notes apps (unconnected)
- Chat histories (lost)
- Paper notebooks (unsearchable)
- Their heads (forgotten)

Existing tools either:
1. Don't connect ideas intelligently
2. Store everything in plaintext (privacy risk)
3. Don't help validate or develop ideas

## Solution

Vault provides:
1. **Encrypted note storage** - Ideas are encrypted before leaving your device
2. **AI-powered connections** - Find hidden links between your thoughts
3. **Incubator mode** - Claude analyzes and validates your ideas
4. **Project roadmaps** - Turn validated ideas into actionable plans

## Target Users

### Primary: Technical Founders
- Building side projects or startups
- Privacy-conscious
- Want AI assistance without data exposure
- Need to organize scattered thoughts

### Secondary: Developers
- Documenting project ideas
- Learning and note-taking
- Building in public (selectively)

## User Stories

### Core Flow
```
As a user, I want to...
- Quickly capture ideas without friction
- Find related notes I forgot about
- Get AI feedback on idea viability
- Generate a roadmap for promising ideas
```

### Authentication
```
As a user, I want to...
- Sign up with email or OAuth
- Have my encryption key derived from my password
- Never worry about Vault reading my notes
```

### Notes
```
As a user, I want to...
- Create notes with a title and content
- Auto-save as I type (no manual save button)
- Search notes by content or meaning
- See related notes suggested automatically
```

### Incubator Mode
```
As a user, I want to...
- Select notes to analyze together
- Get feedback on idea strengths/weaknesses
- Receive suggestions for validation
- Generate a project roadmap
```

## Success Metrics

### Engagement
- Daily Active Users (DAU)
- Notes created per user per week
- Incubator sessions per user per month

### Retention
- Day 1, Day 7, Day 30 retention
- Notes per retained user

### Quality
- Time to first note (< 60 seconds)
- Auto-save success rate (> 99.9%)
- Encryption/decryption error rate (< 0.01%)

## Competitive Landscape

| Product | Encryption | AI Features | Idea Development |
|---------|------------|-------------|------------------|
| Notion | No | Basic | No |
| Obsidian | Plugin | Plugin | No |
| Roam | No | No | Links only |
| **Vault** | **Yes (E2E)** | **Yes (Claude)** | **Yes (Incubator)** |

## Non-Goals (MVP)

- Collaboration / sharing (future)
- Mobile app (future, PWA first)
- Offline mode (future)
- Export formats (future)
- Custom AI models (future)
