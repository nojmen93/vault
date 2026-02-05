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
| Encryption | Web Crypto API | Client-side AES-256-GCM |

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
│  - OAuth providers  │              │  │  - pgvector index   │    │
└─────────────────────┘              │  └─────────────────────┘    │
                                     └─────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        AI Services                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐      ┌─────────────────────────────┐   │
│  │       OpenAI        │      │        Anthropic            │   │
│  │  text-embedding-3   │      │     Claude Sonnet 4         │   │
│  │  (1536 dimensions)  │      │   (idea analysis/roadmaps)  │   │
│  └─────────────────────┘      └─────────────────────────────┘   │
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
3. Plaintext sent to Claude API
4. Claude returns analysis/roadmap
5. Analysis displayed (not stored unless user saves)
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
│   │   └── notes/            # Notes CRUD pages
│   ├── layout.tsx            # Root layout with providers
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles + CSS variables
├── components/
│   ├── ui/                   # Shadcn/UI components
│   ├── notes/                # Note-specific components
│   └── layout/               # Layout components
├── lib/
│   ├── db/                   # Supabase client & types
│   ├── crypto/               # Encryption utilities
│   └── ai/                   # OpenAI & Claude integrations
├── actions/                  # Server Actions
└── types/                    # Shared TypeScript types
```

## Key Design Decisions

1. **Client-side encryption**: All note content encrypted before leaving the browser
2. **Server Actions**: Using Next.js Server Actions instead of API routes for type safety
3. **pgvector**: Embeddings stored in PostgreSQL for efficient similarity search
4. **Clerk**: Managed auth to avoid security pitfalls of DIY authentication
5. **Result pattern**: All server actions return `{ success, data } | { success, error }`
