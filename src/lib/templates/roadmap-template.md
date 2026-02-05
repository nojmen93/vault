# Roadmap

## Sprint 0: Foundation (Current)

**Goal**: Set up project infrastructure and core dependencies

- [x] Initialize Next.js 15 with TypeScript
- [x] Configure Tailwind CSS and Shadcn/UI
- [x] Set up Clerk authentication
- [x] Configure Supabase with pgvector
- [x] Implement client-side encryption utilities
- [x] Create project folder structure
- [x] Build landing page

## Sprint 1: Core Notes

**Goal**: Complete notes CRUD with encryption

- [ ] Wire up dashboard with notes list
- [ ] Implement NoteEditor with auto-save
- [ ] Connect encryption to note creation/editing
- [ ] Add user sync from Clerk to Supabase
- [ ] Implement note deletion with confirmation
- [ ] Add loading states and error handling
- [ ] Test encryption/decryption flow end-to-end

## Sprint 2: Search & Connections

**Goal**: Implement semantic search and related notes

- [ ] Generate embeddings on note save
- [ ] Implement search UI in dashboard
- [ ] Create search Server Action with pgvector
- [ ] Display search results with relevance scores
- [ ] Add "Related Notes" sidebar component
- [ ] Optimize embedding generation (batch/debounce)

## Sprint 3: Incubator Mode

**Goal**: Claude-powered idea analysis and roadmaps

- [ ] Design Incubator Mode UI
- [ ] Implement note selection for analysis
- [ ] Create Claude API integration
- [ ] Build analysis prompt templates
- [ ] Display structured analysis results
- [ ] Generate and display project roadmaps
- [ ] Add "Save Analysis" functionality

## Sprint 4: Polish & Launch

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
| MVP Launch | Sprint 4 | In Progress |
| 100 Users | +2 weeks | Planned |
| 1,000 Users | +2 months | Planned |
| Seed Funding | +3 months | Planned |
