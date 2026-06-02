# Blackjackson — Project Rules

> **Inherits:** `C:\Users\Faber\Projects\CLAUDE.md` for all general rules (personality, planning, implementation standards, scope control, context management, edit safety, self-correction). This file adds project-specific overrides only.

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Framework**: React 18 + Vite
- **Hosting**: GitHub Pages (autodeploy on push to main)
- **Backend**: Firebase Firestore + Anonymous Auth

## Session Start

**ALWAYS read `memory.md` first.** It contains architecture, file map, known issues, and every bug fixed. Do not start work without reading it.

## Project Conventions

- Pure TypeScript engine in `src/engine/` — zero UI dependencies, fully tested (36 tests)
- Firestore document per game (`games/{roomCode}`) — host browser is authoritative
- Zustand stores for client state
- Tailwind theme tokens in `src/index.css` (felt, gold, chip colors)
- Commit style: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`
- Run `npx vitest run && npm run build` after changes

## Post-Session

Update `memory.md` with new learnings, bugs fixed, and architectural decisions.
