# Claude Code Guidelines

## Build Commands

```bash
{package_manager} dev          # Start development server
{package_manager} build        # Build for production
{package_manager} start        # Start production server
{package_manager} lint         # Run linter
{package_manager} type-check   # Run TypeScript compiler check
{package_manager} test         # Run tests
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
export default async function Page(): Promise<React.ReactElement> {
  const data = await getData();
  return <Component data={data} />;
}

// Client Component (when needed)
'use client';

export function Interactive(): React.ReactElement {
  const [state, setState] = useState('');
  // ...
}
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserCard.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| Server Actions | camelCase with suffix | `user.actions.ts` |
| Types | PascalCase | `types/index.ts` |
| Hooks | camelCase with prefix | `useDebounce.ts` |

### Import Order

```typescript
// 1. React
import { useState, useEffect } from 'react';

// 2. Third-party libraries
import { ExternalLib } from 'external-lib';

// 3. Internal absolute imports
import { Button } from '@/components/ui/button';
import { getData } from '@/actions/data.actions';

// 4. Relative imports
import { LocalComponent } from './LocalComponent';

// 5. Types (last)
import type { DataType } from '@/types';
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
export async function createItem(data: FormData): Promise<Result<Item>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    const item = await db.items.create({ ... });
    return { success: true, data: item };
  } catch (err) {
    return { success: false, error: { message: 'Failed to create', code: 'DB_ERROR' } };
  }
}
```

## CSS / Styling

- Use Tailwind CSS utility classes
- Use CSS variables for theming
- Use `cn()` utility for conditional classes

```typescript
import { cn } from '@/lib/utils';

<div className={cn(
  'rounded-lg border p-4',
  isActive && 'border-primary',
  className
)} />
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
feat(auth): add OAuth login
fix(api): handle empty response
chore: update dependencies
```
