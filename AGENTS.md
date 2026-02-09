# Agents & Team

This document describes the AI agents and team members contributing to the Funnel Finished project.

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

### Design Phase (Current)
1. **Antigravity** generates design options using Stitch skills
2. **Team** reviews and selects preferred designs
3. **Antigravity** creates `DESIGN.md` with approved tokens

### Implementation Phase
1. **Antigravity** implements core architecture and complex features
2. **Jules** handles well-scoped feature tasks via GitHub issues
3. Both agents commit to the shared repository

### Code Review
- All PRs reviewed before merge
- Agents can review each other's code
- Human approval required for critical changes

---

## Communication

### Task Assignment
- Create GitHub issues with clear specifications
- Tag appropriate agent in issue description
- Include acceptance criteria

### Handoffs
- Use PR descriptions for context
- Link related issues
- Document decisions in code comments or docs

---

## Repository Access

| Agent | Access Level |
|-------|--------------|
| Antigravity | Full (local + GitHub) |
| Jules | GitHub (async via issues/PRs) |

---

## Getting Started

### For Antigravity
Already configured in this workspace.

### For Jules
```bash
# Install (already done)
npm install -g @google/jules

# Login (already done)
jules login

# Assign work via GitHub issues
# Jules will pick up issues and create PRs
```
