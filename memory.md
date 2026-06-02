# Blackjackson — Session Memory

## Project Overview

Multiplayer Blackjack game for the browser, deployed on GitHub Pages with Firebase backend. Play chips only, no real money. Casino-themed UI with custom SVG cards.

**Live URL:** https://eloheavenjoe-cyber.github.io/blackjackson/
**Repo:** https://github.com/eloheavenjoe-cyber/blackjackson

## Tech Stack

- React 18 + TypeScript + Vite
- Tailwind CSS v4 + Framer Motion
- Zustand (state management)
- Firebase Firestore (game state) + Anonymous Auth
- React Router v6 (BrowserRouter with basename `/blackjackson`)
- Vitest (testing)
- GitHub Actions for deploy on push to `main`

## Architecture

- **No backend server.** Host's browser runs the Blackjack engine, writes authoritative game state to Firestore. All clients sync via `onSnapshot`.
- **3 pages:** Lobby (`/`) → Waiting Room → Table (`/table/:roomCode`)
- **Game state** lives in a single Firestore document `games/{roomCode}`
- **Room codes** are 6-char alphanumeric (no I/O/0/1 to avoid confusion)

## Key Files

| Path | Purpose |
|------|---------|
| `src/engine/` | Pure TypeScript engine: types, hand eval, shoe, game, dealing, actions, dealer, settlement |
| `src/firebase/config.ts` | Firebase config (real credentials) |
| `src/firebase/auth.ts` | Anonymous auth |
| `src/firebase/games.ts` | Firestore CRUD + real-time listener |
| `src/stores/authStore.ts` | Zustand: auth user + display name |
| `src/stores/gameStore.ts` | Zustand: game state, room code, isHost |
| `src/stores/uiStore.ts` | Zustand: sound toggle, current view |
| `src/hooks/useGameSync.ts` | Firestore sub + action submission + auto-advance timer |
| `src/hooks/useSound.ts` | Web Audio API sound effects (6 types) |
| `src/components/Lobby/` | CreateGameForm, JoinGameForm, RulesConfig, WaitingRoom, LobbyPage |
| `src/components/Table/` | TableFelt, DealerArea, PlayerPosition, CardComponent, CardHand, ChipStack, ActionButtons, TurnTimer, RoundResult, TablePage |
| `src/components/Shared/` | Button, Modal, PlayerAvatar |
| `vite.config.ts` | `base: '/blackjackon/'`, Tailwind plugin |
| `.github/workflows/deploy.yml` | Auto-deploy on push to main |

## Bugs Fixed During Session

1. **BrowserRouter basename** — Missing `basename="/blackjackson"` prop, causing 404 on all routes
2. **Host not added as player** — CreateGameForm didn't add host to players array
3. **Start navigates to lobby** — Used `setView('table')` instead of `navigate('/table/...')` 
4. **White cards** — Black suits had `text-white` on `bg-white` background, changed to `text-gray-900`
5. **Game freezes after round** — No next round flow, added `startNewRound` + auto-advance timer (5s)
6. **Chips not decreasing on loss** — Settlement returned bet even on loss, fixed to return 0
7. **Text selection** — Global `user-select: none` added
8. **Animations too fast** — Slowed card dealing (0.6s, 0.2s stagger, softer spring)
9. **Copy link UX** — Removed "copy link" button, room code itself is clickable to copy
10. **Invalid table URLs give 404** — Added timeout redirect with "Back to Lobby" button
11. **Console AbortError spam** — Browser extension interfering with fetch, suppressed via global handler

## Test Coverage

36 tests across 8 files in `src/engine/__tests__/`:
- `types.test.ts` — Type definitions
- `hand.test.ts` — Hand evaluation (blackjack, soft, hard, bust, multiple aces)
- `shoe.test.ts` — Shoe creation, draw, reshuffle threshold
- `game.test.ts` — Game creation, add/remove player, start game
- `dealing.test.ts` — Initial deal, insurance phase
- `actions.test.ts` — Stand, split actions
- `dealer.test.ts` — Dealer S17/H17, draw to 17+
- `settlement.test.ts` — Win, loss, push, blackjack, doubled win, split mixed results

Tests pass: `npx vitest run`

## Known Issues / TODOs

1. **Concurrency** — Multiple players betting simultaneously can overwrite each other (updates whole players array). Should use transactions or subcollections for player actions.
2. **Double down rules** — Engine doesn't enforce `doubleDown` config (`9-10-11` / `none`), only checks card count
3. **Insurance flow** — Insurance phase transitions but no UI for accepting/rejecting insurance
4. **Surrender button** — Not shown in UI even when surrender rules allow it
5. **Split 10-value pairs** — ActionButtons checks raw rank equality (8==8), not value equality (K==Q), so pairs like K+Q can't split from UI. Engine handles correctly.
6. **Turn timer auto-stand** — Timer counts down visually but doesn't auto-stand when expired (only host processes actions)
7. **Player disconnect** — No handling for players leaving mid-game
8. **0-chip players** — Can stay in game but can't bet; no removal logic
9. **Mobile layout** — Works but could use more responsive polish for small screens

## Firebase Setup

- Project: `blackjackson-48cdc`
- Firestore: test mode (open rules)
- Auth: Anonymous sign-in enabled
- Config in `src/firebase/config.ts`

## Git Conventions

- Branches: `main` only (no feature branches)
- Commits: conventional commit style (`feat:`, `fix:`, `chore:`, `ci:`)
- Deploy: automatic on push to `main` via GitHub Actions

## Commands

```bash
npm run dev        # Local dev server
npm run build      # TypeScript + Vite production build
npx vitest run     # Run all tests
```
