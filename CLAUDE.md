# ⚠️ MANDATORY PRE-FEATURE CHECKLIST

Before implementing ANY feature, you MUST:

1. Read VERIFICATION.md and confirm understanding of:
   - Database schemas (encryption boundaries, RLS policies)
   - Testing strategy (where to add tests, which mocks to use)
   - Past decisions (check DECISIONS.md for rejected approaches)

2. State out loud which items from VERIFICATION.md apply to this feature

3. If anything is unclear, ask Noam before writing code

This is not optional. Skip this = incorrect implementation.

---

# Claude Code Guidelines

## Build Commands

```bash
pnpm dev          # Start development server (localhost:3000)
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript compiler check
pnpm test         # Run Vitest tests
pnpm test:e2e     # Run Playwright E2E tests
```

## Coding Standards

### TypeScript

- Use explicit return types on all functions
- Prefer `interface` over `type` for object shapes
- Use `unknown` instead of `any`
- Enable strict mode in tsconfig.json

```typescript
// Good
interface User {
  id: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  // ...
}

// Bad
type User = { id: string; email: string }

function getUser(id): any {
  // ...
}
```

### React Components

- Server Components by default
- Add `'use client'` only when needed (hooks, browser APIs, interactivity)
- Use explicit return types: `React.ReactElement`

```typescript
// Server Component (default)
export default async function NotesPage(): Promise<React.ReactElement> {
  const notes = await getNotes();
  return <NotesList notes={notes} />;
}

// Client Component (when needed)
'use client';

export function NoteEditor(): React.ReactElement {
  const [content, setContent] = useState('');
  // ...
}
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `NoteCard.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Server Actions | camelCase with suffix | `notes.actions.ts` |
| Types | PascalCase | `types/index.ts` |
| Hooks | camelCase with prefix | `useDebounce.ts` |

### Import Order

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { useUser } from '@clerk/nextjs';
import { motion } from 'framer-motion';

// 3. Internal absolute imports
import { Button } from '@/components/ui/button';
import { getNotes } from '@/actions/notes.actions';

// 4. Relative imports
import { NoteCard } from './NoteCard';

// 5. Types (last)
import type { Note } from '@/types';
```

### Error Handling

Use the Result pattern for expected errors:

```typescript
interface Result<T, E = ActionError> {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
}

// Usage in Server Actions
export async function createNote(formData: FormData): Promise<Result<Note>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    const note = await db.notes.create({ ... });
    return { success: true, data: note };
  } catch (err) {
    return { success: false, error: { message: 'Failed to create note', code: 'DB_ERROR' } };
  }
}

// Usage in components
const result = await createNote(formData);
if (!result.success) {
  toast.error(result.error.message);
  return;
}
// Use result.data safely
```

### Component Structure

```typescript
'use client'; // Only if needed

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { NoteCardProps } from '@/types';

interface Props {
  note: Note;
  onDelete?: (id: string) => void;
}

export function NoteCard({ note, onDelete }: Props): React.ReactElement {
  // 1. Hooks
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. Derived state
  const formattedDate = new Date(note.createdAt).toLocaleDateString();

  // 3. Handlers
  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    await onDelete?.(note.id);
    setIsDeleting(false);
  };

  // 4. Render
  return (
    <div className="rounded-lg border p-4">
      <h3>{note.title}</h3>
      <p>{formattedDate}</p>
      <Button onClick={handleDelete} disabled={isDeleting}>
        Delete
      </Button>
    </div>
  );
}
```

## CSS / Styling

- Use Tailwind CSS utility classes
- Use CSS variables for theming (defined in globals.css)
- Use `cn()` utility for conditional classes

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'rounded-lg border p-4',
  isActive && 'border-primary',
  className
)} />
```

## Testing

- Unit tests with Vitest for utilities and hooks
- Component tests with Testing Library
- E2E tests with Playwright for critical flows

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditionals', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });
});
```

## Git Commit Messages

Format: `type(scope): description`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Adding tests

Examples:
```
feat(notes): add auto-save with debounce
fix(crypto): handle empty content encryption
chore: update dependencies
docs: add API documentation
```
