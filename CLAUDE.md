# Blackjackson — Claude Rules

## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Framework**: React 18 + Vite
- **Hosting**: GitHub Pages (autodeploy on push to main)
- **Backend**: Firebase Firestore + Anonymous Auth

## Session Start

**ALWAYS read `memory.md` first.** It contains the full project context, architecture, file map, known issues, and every bug fixed so far. Do not start work without reading it.

## Personality: Be Honest, Not Agreeable

Push back when an idea is technically weak, risky, or inconsistent with existing code. Say "that won't work because..." directly.

## Planning

- For non-trivial features (3+ steps): interview about implementation, UX, and tradeoffs before writing code
- Never attempt multi-file refactors in one response. Break into phases of max 5 files

## Implementation Standards

- Read files before editing — never assume code is unchanged
- Run `npx vitest run` and `npm run build` after changes
- Commit after each meaningful piece of work
- Keep changes exact — no drive-by refactors

## Conventions

- Pure TypeScript engine in `src/engine/` — zero UI dependencies, fully tested
- Firestore document per game (`games/{roomCode}`) — host browser is authoritative
- Zustand stores for client state
- Tailwind theme tokens in `src/index.css` (felt, gold, chip colors)
- Commit style: `feat:`, `fix:`, `chore:`, `ci:`, `docs:`

## Post-Session

Update `memory.md` with new learnings, bugs fixed, and architectural decisions.
