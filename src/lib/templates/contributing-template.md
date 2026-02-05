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
