# Claude Code Workflow

Quick reference for AI-assisted development with Claude Code. Keep this in your project root.

---

## Git Commands (Copy-Paste Ready)

### After Each Feature (Simple)

```bash
git add .
git commit -m "feat: description of what you added"
git push origin main
```

### After Each Feature (Safer - Feature Branch)

```bash
# Create branch
git checkout -b feat/feature-name

# Do your work...

# Commit and push
git add .
git commit -m "feat: description"
git push origin feat/feature-name

# Then merge via GitHub PR or:
git checkout main
git merge feat/feature-name
git push origin main
```

### Quick Fixes

```bash
git add .
git commit -m "fix: what you fixed"
git push origin main
```

---

## Commit Message Format

```
type: short description (max 50 chars)
```

### Types

| Type | When to Use | Example |
|------|-------------|---------|
| `feat` | New feature | `feat: add quick capture modal` |
| `fix` | Bug fix | `fix: resolve auth redirect loop` |
| `refactor` | Code restructure (no new feature) | `refactor: extract encryption utils` |
| `docs` | Documentation only | `docs: update API examples` |
| `style` | Formatting, no code change | `style: fix indentation` |
| `test` | Adding/updating tests | `test: add encryption unit tests` |
| `chore` | Dependencies, config | `chore: update shadcn components` |

### Good Examples

```bash
git commit -m "feat: add semantic similar notes button"
git commit -m "fix: prevent double-submit on note save"
git commit -m "refactor: move crypto utils to lib/crypto"
git commit -m "chore: upgrade next to 15.1"
```

### Bad Examples

```bash
git commit -m "fixed stuff"          # Too vague
git commit -m "WIP"                  # Not descriptive
git commit -m "asdfasdf"             # Meaningless
git commit -m "feat: added the new feature for the quick capture modal that lets users press cmd+k"  # Too long
```

---

## Claude Code Instructions

Paste this at the start of a Claude Code session:

```
After completing each feature:
1. Verify it works (no build errors, feature functions)
2. Run: git add .
3. Run: git commit -m "type: description"
4. Run: git push origin main

Use these commit types:
- feat: new feature
- fix: bug fix
- refactor: code restructure
- docs: documentation
- chore: dependencies/config
```

---

## When Things Go Wrong

### Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)

```bash
git reset --hard HEAD~1
```

### Discard All Uncommitted Changes

```bash
git checkout .
```

### See What Changed

```bash
git status          # What files changed
git diff            # What lines changed
git log --oneline   # Recent commits
```

---

## Checkpoint Strategy

Create checkpoints at stable states:

```bash
# After foundation is working
git commit -m "chore: foundation complete - auth, db, basic ui"

# After each feature
git commit -m "feat: quick capture (cmd+k) complete"
git commit -m "feat: chat interface complete"
git commit -m "feat: semantic similar notes complete"

# Before risky changes
git commit -m "chore: checkpoint before refactoring encryption"
```

---

## Branch Naming (If Using Feature Branches)

```
feat/quick-capture
feat/chat-interface
feat/semantic-search
fix/auth-redirect
refactor/crypto-module
```

---

## Daily Workflow

1. **Start of session**: `git pull origin main` (get latest)
2. **During work**: Let Claude Code make changes
3. **Feature done**: Commit + push
4. **End of session**: Make sure everything is pushed

---

## Files to Never Commit

Already in `.gitignore`, but double-check:

```
.env.local           # Secrets
.env                 # Secrets
node_modules/        # Dependencies
.next/               # Build output
*.log                # Logs
.DS_Store            # Mac junk
```

If you accidentally commit secrets:

```bash
# Remove from history (dangerous, use carefully)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env.local" \
  --prune-empty --tag-name-filter cat -- --all
```

Then rotate your API keys immediately.

---

## Reference

- Full contribution guidelines: `CONTRIBUTING.md`
- Coding standards: `CLAUDE.md`
- Architecture decisions: `DECISIONS.md`
