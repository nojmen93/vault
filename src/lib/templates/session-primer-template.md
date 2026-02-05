# Claude Code Session Primer

Copy and paste this at the start of every Claude Code session.

---

## The Prompt

```
You are working on {project_name} — {project_description}

Tech Stack: {tech_stack}

BEFORE STARTING:
1. Read CLAUDE.md for build commands and coding standards
2. Read ARCHITECTURE.md for system design and data flow
3. Check ROADMAP.md to understand current sprint priorities

CODING RULES:
- TypeScript strict mode, explicit return types
- Server Components by default, 'use client' only when needed
- Tailwind for styling, component library for base components
- Error handling: Result pattern for expected errors
- Never hardcode secrets, always use environment variables

AFTER EACH FEATURE:
1. Verify build passes: {build_command}
2. Stage changes: git add .
3. Commit with format: type: description
   - feat: new feature
   - fix: bug fix
   - refactor: code restructure
   - docs: documentation
   - chore: config/dependencies
4. Push to remote: git push

FILE STRUCTURE:
- src/app/ — routes and pages
- src/components/ — React components
- src/lib/ — utilities
- src/actions/ — server actions
- src/types/ — TypeScript types

KEY FILES:
{key_files}

Ask clarifying questions if requirements are ambiguous. Prioritize working code over perfect code.
```

---

## When to Use

- Start of a new chat session
- When Claude Code seems to forget context
- When starting a new feature
- After a long break from the project

---

## Customization

Add project-specific context as needed:

```
CURRENT TASK:
Implement [feature name]

FOCUS AREAS:
- [specific file or component]
- [specific functionality]

AVOID:
- [any anti-patterns or past mistakes]
```
