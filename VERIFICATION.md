# Context Verification Checklist

Before starting any feature, confirm you understand:

## Architecture
- [ ] Read ARCHITECTURE.md ## Database Schemas
- [ ] Understand encryption boundaries (what's encrypted vs plaintext)
- [ ] Know the RLS policies for relevant tables
- [ ] Understand the migration workflow

## Testing
- [ ] Read CONTRIBUTING.md ## Testing Strategy
- [ ] Know where to add tests for this feature type
- [ ] Understand crypto testing guidelines
- [ ] Know which mocks to use (Clerk, OpenAI, etc.)

## Decisions
- [ ] Checked DECISIONS.md for relevant past decisions
- [ ] Confirmed approach hasn't been previously rejected

## Workflow
- [ ] Understand Git commit format from CLAUDE_CODE_WORKFLOW.md
- [ ] Know when to run `pnpm build` before committing

If any item is unclear, ask Noam before proceeding.
