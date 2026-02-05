# Roadmap

## Sprint 0: Foundation ✅

**Goal**: Set up project infrastructure and core dependencies

- [x] Initialize Next.js 15 with TypeScript
- [x] Configure Tailwind CSS and Shadcn/UI
- [x] Set up Clerk authentication
- [x] Configure Supabase with pgvector
- [x] Implement client-side encryption utilities
- [x] Create project folder structure
- [x] Build landing page

## Sprint 1: Core Notes ✅

**Goal**: Complete notes CRUD with encryption

- [x] Wire up dashboard with notes list
- [x] Implement NoteEditor with auto-save
- [x] Connect encryption to note creation/editing
- [x] Add user sync from Clerk to Supabase
- [x] Implement note deletion with confirmation
- [x] Add loading states and error handling
- [x] Test encryption/decryption flow end-to-end

## Sprint 2: Search & Connections ✅

**Goal**: Implement semantic search and related notes

- [x] Generate embeddings on note save
- [x] Implement search UI in dashboard
- [x] Create search Server Action with pgvector
- [x] Display search results with relevance scores
- [x] Add "More Like This" feature for similar notes
- [x] Optimize embedding generation (batch/debounce)

## Sprint 3: Incubator Mode ✅

**Goal**: Claude-powered idea analysis and roadmaps

- [x] Design Incubator Mode UI
- [x] Implement note selection for analysis
- [x] Create Claude API integration
- [x] Build analysis prompt templates
- [x] Display structured analysis results
- [x] Generate and display project roadmaps
- [x] Add "Save Analysis" functionality
- [x] Implement Personal Thinking Profile system
- [x] Add milestone notifications

## Sprint 4: Project Kit Generator ✅

**Goal**: Transform ideas into actionable project starters

- [x] Build gold standard documentation templates
- [x] Implement AI-powered kit generation (8 files)
- [x] Create tech stack selector component
- [x] Add file preview with edit capability
- [x] Generate tool-specific prompts (Claude Code, Lovable, Bolt, Cursor, v0, Windsurf)
- [x] Implement ZIP download functionality
- [x] Add copy-to-clipboard for prompts

## Sprint 5: GitHub Integration ✅

**Goal**: Seamless project deployment to GitHub

- [x] Implement GitHub OAuth flow
- [x] Store GitHub tokens securely
- [x] Create repository creation API
- [x] Push all kit files in single commit
- [x] Add private/public repo option
- [x] Implement GitHub disconnect flow

## Sprint 6: Testing & Quality ✅

**Goal**: Comprehensive test coverage

- [x] Set up Vitest for unit/integration tests
- [x] Set up Playwright for E2E tests
- [x] Create mock infrastructure (AI, Supabase, GitHub, Clerk)
- [x] Unit tests for crypto (17 tests)
- [x] Unit tests for utilities (12 tests)
- [x] Integration tests for actions (39 tests)
- [x] E2E tests for user flows
- [x] 80+ tests passing

## Sprint 7: Polish & Launch (Current)

**Goal**: Production readiness

- [ ] Add comprehensive error handling
- [ ] Implement rate limiting
- [ ] Add usage analytics (privacy-respecting)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Write user documentation
- [ ] Deploy to production

---

## Future Backlog

### Collaboration
- [ ] Share notes with specific users
- [ ] Collaborative editing
- [ ] Team workspaces

### Mobile
- [ ] Progressive Web App (PWA)
- [ ] Native mobile app

### Integrations
- [ ] Import from Notion
- [ ] Import from Obsidian
- [ ] Export to Markdown
- [ ] API for external tools

### Advanced AI
- [ ] Custom prompt templates
- [ ] Multiple AI model options
- [ ] Voice-to-note transcription
- [ ] Image analysis for notes

### Enterprise
- [ ] SSO / SAML
- [ ] Audit logs
- [ ] Admin dashboard
- [ ] Self-hosted option

---

## Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| Core Features Complete | Sprint 6 | ✅ Done |
| Test Coverage 80+ | Sprint 6 | ✅ Done |
| MVP Launch | Sprint 7 | In Progress |
| 100 Users | +2 weeks | Planned |
| 1,000 Users | +2 months | Planned |
| Seed Funding | +3 months | Planned |
