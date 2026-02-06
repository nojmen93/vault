# Contributing

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/nojmen93/vault.git
cd vault

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
# Fill in your API keys

# Run the database schema
# (paste supabase/schema.sql in Supabase SQL Editor)

# Start development server
pnpm dev
```

---

## Git Workflow

### Branch Naming

```
feature/short-description
fix/short-description
chore/short-description
docs/short-description
```

Examples:
```
feature/note-auto-save
fix/encryption-empty-content
chore/update-dependencies
docs/api-documentation
```

### Commit Messages

Format: `type(scope): description`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `chore`: Maintenance, dependencies
- `docs`: Documentation
- `refactor`: Code restructuring
- `test`: Adding tests
- `style`: Formatting (no code change)

**Examples:**
```
feat(notes): add auto-save with 500ms debounce
fix(crypto): handle empty content encryption
chore: update @clerk/nextjs to 4.29.0
docs(api): document searchNotes action
refactor(notes): extract NoteCard component
test(crypto): add encryption round-trip tests
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run checks locally:
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   ```
4. Push and create a Pull Request
5. Fill in the PR template
6. Request review

---

## Pull Request Template

```markdown
## Description
[What does this PR do?]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-reviewed my code
- [ ] Added/updated tests
- [ ] Updated documentation if needed
- [ ] No new warnings

## Testing
[How was this tested?]

## Screenshots
[If applicable]
```

---

## Code Review Guidelines

### As an Author

- Keep PRs small and focused
- Write clear descriptions
- Respond to feedback constructively
- Update based on review comments

### As a Reviewer

- Be constructive and specific
- Explain the "why" behind suggestions
- Approve when concerns are addressed
- Use conventional comments:

```
nit: Minor style suggestion
suggestion: Consider an alternative approach
question: Clarification needed
issue: Must be fixed before merge
```

---

## Development Guidelines

### File Structure

- Components go in `src/components/`
- Server Actions go in `src/actions/`
- Utilities go in `src/lib/`
- Types go in `src/types/`

### Adding a New Feature

1. Check `DECISIONS.md` for existing patterns
2. Update `ROADMAP.md` if significant
3. Add types to `src/types/index.ts`
4. Create Server Actions if needed
5. Build UI components
6. Add tests
7. Update documentation

### Adding Dependencies

Before adding a new dependency:

1. Check if existing deps solve the problem
2. Evaluate bundle size impact
3. Check maintenance status
4. Prefer dev dependencies when possible

```bash
# Production dependency
pnpm add package-name

# Dev dependency
pnpm add -D package-name
```

---

## Testing

### Unit Tests (Vitest)

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific file
pnpm test src/lib/utils.test.ts
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e --ui
```

### Writing Tests

```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn utility', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
});
```

---

## Code Style

### Formatting

Prettier handles formatting automatically:

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

### Linting

ESLint catches code issues:

```bash
# Run linter
pnpm lint

# Fix auto-fixable issues
pnpm lint:fix
```

### TypeScript

Strict mode is enabled. Fix all type errors:

```bash
pnpm type-check
```

---

## Getting Help

- Check existing issues before creating new ones
- Use discussions for questions
- Tag maintainers for urgent issues

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Testing Strategy

### Test Pyramid

**Unit Tests (70%):**
- Pure functions in `src/lib/`
- Crypto operations
- Data transformations
- No database or auth mocks

**Integration Tests (20%):**
- Server actions with Supabase local
- Full CRUD flows
- RLS policy validation
- Encryption round-trips

**E2E Tests (10%):**
- Critical user flows only
- Quick Capture → Idea Cloud → Incubator
- GitHub OAuth flow
- Not every edge case

### Unit Test Patterns

**Location:** `src/lib/__tests__/`

**Example: Crypto Testing**
```typescript
// src/lib/crypto/__tests__/encryption.test.ts
import { describe, test, expect } from 'vitest';
import { encrypt, decrypt } from '../encryption';

describe('AES-256-GCM Encryption', () => {
  test('encrypts and decrypts data correctly', () => {
    const plaintext = { title: 'Test Note', body: 'Secret content' };
    const key = 'test-key-32-bytes-long-exactly!!';
    
    const encrypted = encrypt(plaintext, key);
    const decrypted = decrypt(encrypted, key);
    
    expect(decrypted).toEqual(plaintext);
  });

  test('produces different ciphertext for same plaintext', () => {
    const plaintext = { title: 'Test' };
    const key = 'test-key-32-bytes-long-exactly!!';
    
    const encrypted1 = encrypt(plaintext, key);
    const encrypted2 = encrypt(plaintext, key);
    
    expect(encrypted1).not.toEqual(encrypted2); // Nonce randomization
  });

  test('throws on tampered ciphertext', () => {
    const plaintext = { title: 'Test' };
    const key = 'test-key-32-bytes-long-exactly!!';
    
    const encrypted = encrypt(plaintext, key);
    const tampered = encrypted.slice(0, -1) + 'X'; // Corrupt last byte
    
    expect(() => decrypt(tampered, key)).toThrow();
  });
});
```

**Run:** `pnpm test`

### Integration Test Patterns

**Location:** `src/actions/__tests__/`

**Setup: Supabase Local**
```bash
# Start local Supabase
supabase start

# Run migrations
supabase db reset

# Tests use SUPABASE_URL and SUPABASE_ANON_KEY from local instance
```

**Example: Server Action Testing**
```typescript
// src/actions/__tests__/notes.actions.test.ts
import { describe, test, expect, beforeEach } from 'vitest';
import { createNote, getNotes } from '../notes.actions';
import { createClient } from '@/lib/db/client';

describe('Note Actions', () => {
  const testUserId = 'test-user-123';
  
  beforeEach(async () => {
    // Clean test data
    const supabase = createClient();
    await supabase.from('notes').delete().eq('user_id', testUserId);
  });

  test('creates encrypted note successfully', async () => {
    const result = await createNote({
      userId: testUserId,
      content: { title: 'Test', body: 'Content' },
      tags: ['test']
    });
    
    expect(result.success).toBe(true);
    expect(result.data?.id).toBeDefined();
    
    // Verify encryption
    const supabase = createClient();
    const { data } = await supabase
      .from('notes')
      .select('encrypted_content')
      .eq('id', result.data!.id)
      .single();
    
    expect(data?.encrypted_content).not.toContain('Test'); // Not plaintext
  });

  test('enforces RLS policies', async () => {
    // Create note as user A
    await createNote({
      userId: 'user-a',
      content: { title: 'Private' },
      tags: []
    });
    
    // Try to fetch as user B
    const result = await getNotes({ userId: 'user-b' });
    
    expect(result.data).toHaveLength(0); // Cannot see user A's notes
  });
});
```

**Run:** `pnpm test:integration`

### E2E Test Patterns

**Location:** `e2e/`

**Setup: Playwright**
```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'pnpm dev',
    port: 3000,
  },
});
```

**Example: Critical Flow**
```typescript
// e2e/quick-capture.spec.ts
import { test, expect } from '@playwright/test';

test('Quick Capture flow', async ({ page }) => {
  await page.goto('/');
  
  // Open Quick Capture
  await page.keyboard.press('Meta+K');
  await expect(page.locator('[data-testid="quick-capture-modal"]')).toBeVisible();
  
  // Create note
  await page.fill('[data-testid="note-title"]', 'E2E Test Note');
  await page.fill('[data-testid="note-body"]', 'Test content');
  await page.click('[data-testid="save-note"]');
  
  // Verify in Idea Cloud
  await expect(page.locator('[data-testid="idea-bubble"]')).toContainText('E2E Test Note');
});
```

**Run:** `pnpm test:e2e`

### Mock Strategies

**Clerk Auth Mocking:**
```typescript
// src/lib/__tests__/mocks/clerk.ts
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => ({
    userId: 'test-user-123',
    sessionId: 'test-session',
  }),
}));
```

**OpenAI API Mocking:**
```typescript
// src/lib/__tests__/mocks/openai.ts
vi.mock('openai', () => ({
  OpenAI: vi.fn(() => ({
    embeddings: {
      create: vi.fn().mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      }),
    },
  })),
}));
```

### Crypto Testing Guidelines

**Never test by decrypting in assertions:**
```typescript
// ❌ BAD: Exposes decryption key in test
expect(decrypt(encrypted, key)).toEqual(plaintext);

// ✅ GOOD: Test round-trip without exposing logic
const result = encrypt(plaintext, key);
const recovered = decrypt(result, key);
expect(recovered).toEqual(plaintext);
```

**Test encryption properties:**
- Non-deterministic (same input → different output)
- Tamper-proof (modified ciphertext → throw)
- Key-dependent (wrong key → throw)

### Running Tests

**All tests:**
```bash
pnpm test          # Unit tests (fast)
pnpm test:int      # Integration tests (requires Supabase local)
pnpm test:e2e      # E2E tests (requires dev server)
pnpm test:ci       # All tests in sequence (CI pipeline)
```

**Coverage:**
```bash
pnpm test:coverage  # Generates coverage report in coverage/
```

**Target: 80% coverage for `src/lib/`, 60% for `src/actions/`**

### Pre-Commit Checklist

- [ ] All tests pass: `pnpm test:ci`
- [ ] No type errors: `pnpm type-check`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
