# Agents & Team

This document describes the AI agents and team members contributing to THE LAB project.

---

## Critical Files

| File | Purpose |
|------|---------|
| `task.md` | **Task tracker** — Check before starting work, update after completing tasks |
| `IMPLEMENTATION_PLAN.md` | Architecture, data models, technical decisions |
| `DESIGN.md` | Design system tokens, colors, typography, component specs |

---

## AI Agents

### Antigravity (Google DeepMind)
**Role**: Lead Developer & Architect

**Capabilities**:
- Full-stack development (React, Next.js, Node.js)
- Design system creation and UI implementation
- API development and integration
- Code review and refactoring
- Stitch skills for design generation

**Best For**:
- Complex implementation tasks
- Architecture decisions
- Multi-file refactoring
- Design-to-code conversion

---

### Jules (Google)
**Role**: Collaborative Coder

**Capabilities**:
- Code implementation from specifications
- Bug fixes and feature additions
- Test writing
- Documentation

**Best For**:
- Well-scoped implementation tasks
- Parallel development of isolated features
- Code generation from clear specs

**Integration**:
- Installed via `npm install -g @google/jules`
- Authenticated via `jules login`
- Works asynchronously on GitHub issues/PRs

---

## Workflow

### Before Starting Work
1. **Check `task.md`** — Identify the next uncompleted task
2. **Mark task `[/]`** — Indicate work in progress
3. **Review dependencies** — Ensure prerequisite tasks are complete

### During Development
1. **Follow `DESIGN.md`** — Use exact colors, fonts, spacing
2. **Reference `IMPLEMENTATION_PLAN.md`** — Match architecture decisions
3. **Commit small, focused changes** — One logical change per commit

### Before Committing

> ⚠️ **MANDATORY VALIDATION** — All code must pass these checks:

```bash
# 1. Lint check
npm run lint

# 2. Type check (if configured)
npm run typecheck

# 3. Run tests
npm run test

# 4. Build check
npm run build
```

**If any check fails:**
- Fix the issue before committing
- Do NOT commit with `--no-verify`

### After Completing Work
1. **Mark task `[x]`** in `task.md`
2. **Update related documentation** if needed
3. **Create PR with clear description** linking to completed task

---

## Code Quality Standards

### Required Before Merge
- [ ] All lint errors resolved
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] New features have tests
- [ ] Follows design system (colors, spacing, components)

### Code Review Checklist
- [ ] Logic is correct
- [ ] No security vulnerabilities
- [ ] Error handling is appropriate
- [ ] Performance is acceptable
- [ ] Accessibility standards met

---

## Task Assignment

### For Antigravity
- Pick tasks from `task.md` marked `[ ]`
- Prioritize in order (top to bottom within sections)
- Update task status in `task.md`

### For Jules
- Create GitHub issues with clear specifications
- Reference specific tasks from `task.md`
- Include acceptance criteria
- Tag with `jules` label

---

## Repository Access

| Agent | Access Level |
|-------|--------------|
| Antigravity | Full (local + GitHub) |
| Jules | GitHub (async via issues/PRs) |

---

## Quick Reference

### Design Tokens (from DESIGN.md)
```
Primary:     #2563EB (Foundry Blue)
Success:     #0F9D58 (Green)
Warning:     #F59E0B (Amber)
Error:       #EF4444 (Red)
Background:  #F8F9FA (Canvas)
Surface:     #FFFFFF (Cards)
Border:      #E5E7EB
Text:        #111827 / #6B7280 / #9CA3AF
Font:        Inter (Sans), JetBrains Mono (Code)
Radius:      6-8px
```

### Project Structure
```
src/
├── app/              # Next.js App Router pages
├── components/
│   ├── ui/           # Design system components
│   ├── lab/          # Demo builder components
│   └── demo/         # Chat experience components
└── lib/              # Utilities (scraper, openrouter, prompts)
```
