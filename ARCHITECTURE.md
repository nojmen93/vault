# Architecture

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Auth | Clerk | User authentication & management |
| Database | Supabase (PostgreSQL) | Data persistence |
| Vector Search | pgvector | Semantic similarity search |
| AI - Embeddings | OpenAI text-embedding-3-small | Convert text to vectors |
| AI - Analysis | Anthropic Claude | Idea validation & roadmaps |
| UI | Tailwind CSS + Shadcn/UI | Styling & components |
| Animation | Framer Motion | Smooth UI transitions |
| Encryption | Web Crypto API | Client-side AES-256-GCM |
| Testing | Vitest + Playwright | Unit, integration & E2E tests |

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Next.js   │  │  Web Crypto │  │     Local Storage       │  │
│  │     App     │  │     API     │  │  (encryption key salt)  │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────────┘  │
│         │                │                                       │
│         │    ┌───────────┴───────────┐                          │
│         │    │  Encrypt/Decrypt      │                          │
│         │    │  (AES-256-GCM)        │                          │
│         │    └───────────────────────┘                          │
└─────────┼───────────────────────────────────────────────────────┘
          │
          │ HTTPS (encrypted content only)
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Server (Vercel)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Next.js   │  │   Clerk     │  │     Server Actions      │  │
│  │   API/RSC   │  │  Middleware │  │    (notes.actions.ts)   │  │
│  └──────┬──────┘  └─────────────┘  └───────────┬─────────────┘  │
└─────────┼─────────────────────────────────────┼─────────────────┘
          │                                      │
          ▼                                      ▼
┌─────────────────────┐              ┌─────────────────────────────┐
│       Clerk         │              │         Supabase            │
│  (Authentication)   │              │  ┌─────────────────────┐    │
│                     │              │  │    PostgreSQL       │    │
│  - User management  │              │  │  - users table      │    │
│  - Session tokens   │              │  │  - notes table      │    │
│  - OAuth providers  │              │  │  - project_kits     │    │
└─────────────────────┘              │  │  - pgvector index   │    │
                                     │  └─────────────────────┘    │
          │                          └─────────────────────────────┘
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │     OpenAI      │  │   Anthropic     │  │     GitHub      │  │
│  │  text-embed-3   │  │  Claude Sonnet  │  │    REST API     │  │
│  │ (1536 dims)     │  │  (analysis)     │  │  (repo create)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Creating a Note

```
1. User types note content
2. Content encrypted client-side (AES-256-GCM)
3. Plaintext sent to OpenAI for embedding (then discarded)
4. Encrypted content + embedding stored in Supabase
5. Server never sees unencrypted content
```

### Searching Notes

```
1. User enters search query
2. Query sent to OpenAI for embedding
3. pgvector finds similar note embeddings
4. Encrypted notes returned to client
5. Notes decrypted client-side for display
```

### Incubator Mode

```
1. User selects notes for analysis
2. Notes decrypted client-side
3. Plaintext + thinking profile sent to Claude API
4. Claude returns personalized analysis/roadmap
5. Analysis displayed (not stored unless user saves)
```

### Project Kit Generation

```
1. User completes idea analysis in Incubator
2. Selects tech stack (framework, database, auth, etc.)
3. Claude generates 8 documentation files in parallel
4. Claude generates tool-specific prompts (6 tools)
5. User can preview, edit, download ZIP, or push to GitHub
```

### GitHub Integration

```
1. User initiates GitHub OAuth flow
2. Callback stores encrypted access token in users table
3. On "Push to GitHub", create repo via GitHub API
4. Create blobs for each file, build tree, commit
5. Create branch reference pointing to commit
6. Return repo URL to user
```

### Idea Discovery

```
1. User clicks "Find an Idea" or triggers via empty state
2. Wizard asks 5 optional profiling questions
3. System classifies user into persona (tech_builder, creative_maker, etc.)
4. Claude generates 7 personalized idea suggestions
5. User can filter, save, incubate, or request more ideas
6. Saved ideas can be incubated for full analysis
```

## Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth route group
│   │   ├── sign-in/          # Clerk sign-in page
│   │   └── sign-up/          # Clerk sign-up page
│   ├── (dashboard)/          # Protected route group
│   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   ├── dashboard/        # Main dashboard
│   │   ├── notes/            # Notes CRUD pages
│   │   └── profile/          # User profile & thinking profile
│   ├── api/
│   │   └── github/           # GitHub OAuth routes
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles + CSS variables
├── components/
│   ├── ui/                   # Shadcn/UI components
│   ├── notes/                # Note-specific components
│   ├── incubator/            # Incubator & kit generator
│   │   ├── IncubatorPanel.tsx
│   │   ├── ProjectKitGenerator.tsx
│   │   ├── FilePreview.tsx
│   │   ├── PromptCopyButtons.tsx
│   │   └── TechStackSelector.tsx
│   ├── discovery/            # Idea discovery wizard
│   │   ├── IdeaDiscoveryWizard.tsx
│   │   ├── DiscoveryQuestion.tsx
│   │   ├── DiscoveryResults.tsx
│   │   ├── IdeaSuggestionCard.tsx
│   │   └── DiscoveryEmptyState.tsx
│   ├── github/               # GitHub integration
│   │   └── GitHubConnect.tsx
│   └── layout/               # Layout components
├── lib/
│   ├── db/                   # Supabase client & types
│   ├── crypto/               # Encryption utilities
│   ├── ai/                   # AI integrations
│   │   ├── embeddings.ts     # OpenAI embeddings
│   │   ├── incubator.ts      # Claude analysis
│   │   ├── thinking-profile.ts # Personal profile gen
│   │   ├── kit-generator.ts  # Project kit generation
│   │   └── idea-discovery.ts # Idea suggestion generation
│   ├── github/               # GitHub utilities
│   │   └── create-repo.ts    # Repo creation via API
│   └── templates/            # Gold standard templates
│       ├── readme-template.md
│       ├── architecture-template.md
│       ├── roadmap-template.md
│       └── ... (11 total)
├── actions/                  # Server Actions
│   ├── notes.actions.ts      # Notes CRUD
│   ├── incubator.actions.ts  # Incubator analysis
│   ├── profile.actions.ts    # Thinking profile
│   ├── kit.actions.ts        # Project kit CRUD
│   ├── github.actions.ts     # GitHub operations
│   └── discovery.actions.ts  # Idea discovery
├── types/                    # Shared TypeScript types
└── __tests__/                # Test files
    ├── mocks/                # Mock implementations
    ├── unit/                 # Unit tests
    └── integration/          # Integration tests
```

## Database Schema

### Core Tables

```sql
-- Users (synced from Clerk)
users (
  id TEXT PRIMARY KEY,          -- Clerk user ID
  email TEXT NOT NULL,
  github_access_token TEXT,     -- Encrypted GitHub token
  github_username TEXT,
  thinking_profile JSONB,       -- Personal thinking profile
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Encrypted Notes
notes (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users,
  title TEXT,
  encrypted_content TEXT NOT NULL,
  iv TEXT NOT NULL,             -- Initialization vector
  embedding vector(1536),       -- pgvector for search
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Project Kits
project_kits (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users,
  idea_note_ids UUID[],
  project_name TEXT NOT NULL,
  project_slug TEXT NOT NULL,
  files JSONB NOT NULL,         -- Generated documentation
  analysis JSONB,               -- Incubator analysis
  tech_stack JSONB,             -- Selected tech stack
  github_repo_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Discovery Sessions
discovery_sessions (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users,
  answers JSONB NOT NULL,       -- User's profiling answers
  persona TEXT,                 -- Classified persona type
  suggestions JSONB NOT NULL,   -- Generated ideas
  created_at TIMESTAMPTZ
)

-- Saved Suggestions
saved_suggestions (
  id UUID PRIMARY KEY,
  user_id TEXT REFERENCES users,
  discovery_session_id UUID REFERENCES discovery_sessions,
  suggestion JSONB NOT NULL,    -- The idea suggestion
  status TEXT DEFAULT 'saved',  -- saved, incubated, dismissed
  note_id UUID REFERENCES notes,-- If converted to note
  created_at TIMESTAMPTZ
)
```

## Key Design Decisions

1. **Client-side encryption**: All note content encrypted before leaving the browser
2. **Server Actions**: Using Next.js Server Actions instead of API routes for type safety
3. **pgvector**: Embeddings stored in PostgreSQL for efficient similarity search
4. **Clerk**: Managed auth to avoid security pitfalls of DIY authentication
5. **Result pattern**: All server actions return `{ success, data } | { success, error }`
6. **Gold standard templates**: Real documentation used as examples for AI generation
7. **Parallel generation**: Kit files generated in parallel for performance
8. **GitHub Git Data API**: Single commit with multiple files via tree/blob API
9. **Persona classification**: Users classified into personas for better AI suggestions
10. **Plain language AI**: Discovery prompts avoid jargon for non-technical users
