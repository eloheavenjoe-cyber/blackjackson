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

51 tests across 8 files in `src/engine/__tests__/`:
- `types.test.ts` — Type definitions
- `hand.test.ts` — Hand evaluation (blackjack, soft, hard, bust, multiple aces)
- `shoe.test.ts` — Shoe creation, draw, reshuffle threshold
- `game.test.ts` — Game creation, add/remove player, start game
- `dealing.test.ts` — Initial deal, insurance phase
- `actions.test.ts` — Stand, split actions
- `dealer.test.ts` — Dealer S17/H17, draw to 17+
- `settlement.test.ts` — Win, loss, push, blackjack, doubled win, split mixed results

Tests pass: `npx vitest run`

## Bugs Fixed (2026-06-02)

1. ~~**Concurrency**~~ — Fixed: Two-phase bet submission via `games/{code}/bets/{playerId}` subcollection. Only host writes authoritative game doc.
2. ~~**Double down rules**~~ — Fixed: Engine checks `rules.doubleDown` (`none`/`9-10-11`/`any`) and UI gates button visibility.
3. ~~**Insurance flow**~~ — Fixed: Full engine handling (`insurance_yes`/`insurance_no` + `resolveInsurance`) + UI insurance prompt.
4. ~~**Surrender button**~~ — Fixed: ActionButtons shows surrender when `rules.surrender === 'late'` + first-action guard.
5. ~~**Split 10-value pairs**~~ — Fixed: Uses `calculateHandValue` for value comparison instead of rank string equality.
6. ~~**Turn timer auto-stand**~~ — Fixed: `onTimeout` callback auto-submits stand action. Host enforces timer. Inactive after 2 timeouts.
7. **Player disconnect** — Partially fixed: `lastActionAt` tracking, `isActive=false` after 2 timeouts, "Away" badge, skipped in turn logic. Full presence system still needs backend.
8. ~~**0-chip players**~~ — Fixed: `startNewRound` removes 0-chip players with `removedPlayers` tracking + `gameOver` when all bust.
9. ~~**Mobile layout**~~ — Skipped (excluded from scope).

## Additional Fixes
- **Round result labels** — Now shows per-hand results; "BUST" only for actual busts, "LOSE" otherwise, "SURRENDER" label.
- **Dealer Ace-up BJ** — Now detected even when insurance is off; goes straight to settlement.
- **Split hand navigation** — `advanceHand()` correctly advances `activeHandIndex` through split hands before advancing turn.
- **Reshuffle** — `startNewRound` checks shoe penetration and reshuffles discard; UI shows "Reshuffling..." indicator.
- **Room code collision** — CreateGameForm checks Firestore for existing code before writing (up to 3 attempts).
- **Dead code** — Removed unused `'table'` view from uiStore; sound effects gated behind `soundEnabled`.
- **Bet re-guard** — `setPlayerBet` rejects bets outside betting phase and re-bets.

## Known Issues Remaining
1. **Player disconnect** — No real-time presence detection (Firestore-only, no backend). `isActive=false` is a workaround.
2. **Mobile layout** — Not addressed in this pass.
3. **Firestore rules** — Still in test mode (open access).
4. **Chunk size** — Main bundle ~725KB; could use code splitting.

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
