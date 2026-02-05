# Vault

A zero-knowledge idea incubator for entrepreneurs and developers. Vault uses AI to connect fragmented thoughts, validate ideas, and generate project roadmaps — all with client-side encryption.

## Features

- **Zero-Knowledge Encryption** - AES-256-GCM encryption in your browser
- **AI-Powered Connections** - Semantic search with vector embeddings
- **Incubator Mode** - Claude AI analyzes and validates your ideas
- **Privacy First** - Your encryption key never leaves your device

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Auth**: Clerk
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: OpenAI (embeddings) + Anthropic Claude (analysis)
- **UI**: Tailwind CSS + Shadcn/UI
- **Encryption**: Web Crypto API (AES-256-GCM, PBKDF2)

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

You'll need:
- [Clerk](https://clerk.com) - Authentication
- [Supabase](https://supabase.com) - Database
- [OpenAI](https://platform.openai.com) - Embeddings
- [Anthropic](https://console.anthropic.com) - Claude AI

### 3. Set up the database

Run the SQL schema in your Supabase SQL Editor:

```bash
cat supabase/schema.sql
```

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── (auth)/          # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/     # Protected dashboard pages
│   └── page.tsx         # Landing page
├── components/
│   ├── ui/              # Shadcn/UI components
│   ├── notes/           # Note-related components
│   └── layout/          # Layout components
├── lib/
│   ├── db/              # Supabase client
│   ├── crypto/          # Encryption utilities
│   └── ai/              # AI integrations
├── actions/             # Server Actions
└── types/               # TypeScript types
```

## Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm start      # Start production server
pnpm lint       # Run ESLint
```

## Security

- All note content is encrypted client-side before being sent to the server
- Encryption keys are derived from user passwords using PBKDF2
- The server only stores encrypted blobs and cannot decrypt your data
- Vector embeddings are generated from plaintext for search, then the plaintext is discarded

## License

MIT
