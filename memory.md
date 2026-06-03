# Blackjackson — Session Memory

## Project Overview

Multiplayer Blackjack game for the browser, deployed on GitHub Pages with Firebase backend. Play chips only, no real money. Casino-themed UI with custom SVG cards and inline SVG casino chips.

**Live URL:** https://eloheavenjoe-cyber.github.io/blackjackson/
**Repo:** https://github.com/eloheavenjoe-cyber/blackjackson

## Tech Stack

- React 19 + TypeScript + Vite 7
- Tailwind CSS v4 + Framer Motion
- Zustand (state management)
- Firebase Firestore (game state) + Anonymous Auth
- React Router v6 (BrowserRouter with basename `/blackjackson`)
- Vitest (testing)
- GitHub Actions for deploy on push to `main`

## Architecture

- **No backend server.** Host's browser runs the Blackjack engine, writes authoritative game state to Firestore. All clients sync via `onSnapshot`.
- **3 pages:** Lobby (`/`) → Waiting Room → Table (`/table/:roomCode`)
- **Game state** in single Firestore document `games/{roomCode}`
- **Bet intents** via subcollection `games/{code}/bets/{playerId}` — only host writes authoritative game doc
- **Pending bets** (`pendingBets: Record<string, number>`) synced in game doc — all clients see chips accumulating via `FieldValue.increment`
- **Room codes** are 6-char alphanumeric (no I/O/0/1)
- **Auto-advance** via `scheduleNewRound()` (5s timer), called from `writeAndSchedule()` for all write paths
- **State resolution** centralized in `finalizeState()`: if phase is `'dealer'` or `'settlement'`, chains `playDealer` + `settleHands` + `settleInsurance` before writing

## Key Files

| Path | Purpose |
|------|---------|
| `src/engine/` | Pure TypeScript engine: types, hand eval, shoe, game, dealing, actions, dealer, settlement |
| `src/engine/actions.ts` | `processAction`, `allInsuranceDecided`, `resolveInsurance`, `advanceHand` |
| `src/engine/dealing.ts` | `dealInitialHands` — detects dealer BJ on Ace and 10-value upcards |
| `src/engine/settlement.ts` | `settleHands`, `settleInsurance` |
| `src/engine/game.ts` | `createGame`, `addPlayer`, `startGame`, `setPlayerBet` (with guards), `startNewRound` (reshuffle + 0-chip removal + gameOver) |
| `src/firebase/config.ts` | Firebase config (real credentials) |
| `src/firebase/auth.ts` | Anonymous auth |
| `src/firebase/games.ts` | Firestore CRUD + `submitBetIntent` + `betIntentsCollection` + `incrementPendingBet`/`clearPendingBet` (atomic FieldValue ops) |
| `src/stores/authStore.ts` | Zustand: auth user + display name |
| `src/stores/gameStore.ts` | Zustand: game state, roomCode, isHost, reset |
| `src/stores/uiStore.ts` | Zustand: sound toggle, currentView (lobby/waiting) |
| `src/hooks/useGameSync.ts` | Firestore sub + bet intent listener + `finalizeState` + `writeAndSchedule` + timer auto-stand + `scheduleNewRound` |
| `src/hooks/useSound.ts` | Web Audio API sound effects (6 types, gated by soundEnabled) |
| `src/components/Lobby/` | CreateGameForm, JoinGameForm, RulesConfig, WaitingRoom, LobbyPage |
| `src/components/Table/` | TableFelt, DealerArea, PlayerPosition, CardComponent, CardHand, Chip, ChipStack, ActionButtons, TurnTimer, RoundResult, BettingArea, TablePage, Shoe, DiscardPile, LimitPlaque |
| `src/components/Shared/` | Button, Modal, PlayerAvatar |
| `docs/superpowers/specs/` | Design specs |
| `docs/superpowers/plans/` | Implementation plans |

## Current UI Layout

- **Table size** — `min(92vw, 990px)` × `min(55vh, 528px)`, half-oval with `border-radius: 0 0 48% 48%`, wood rim (#5c3a1e), fabric grain via SVG feTurbulence filter, two-layer warm lamp glow with subtle flicker animation, two-layer dark vignette, `overflow: hidden`
- **Table objects** — Dealer shoe (inline SVG wedge at top-right), discard pile (4 staggered face-down cards at top-left), burn card (rotated CardBack near dealer area), brass limit plaque (min/max bet at top-center edge)
- **Dealer** — sits on flat top edge of table with dark backdrop. Cards fly in from shoe origin (82% x, 8% y). Hole card uses 3D flip (rotateY + backface-visibility) synced to hand value reveal via `flipping`/`flipComplete` states.
- **Cards** — CSS/HTML with 3D transform. Face cards (K/Q/J) have inline SVG figure icons on md/lg sizes. Card back is navy/gold/burgundy casino SVG pattern. 3D edge shadow (tight bottom + ambient + inset rim light).
- **Players** — positioned on elliptical arc via `computePositions()` (160°–20° concave-down). Cards deal sequentially from shoe origin. Betting circles have dashed gold borders with breathing glow on active turn; ring glow intensity scales with bet amount.
- **Player info strip** — below table, `minHeight: 32` to reserve space, arc-aligned X positions, shows name + animated chip count + (Away) badge.
- **Action buttons strip** — in document flow below info strip (`mt-2`), arc-aligned via `paddingLeft` + `-translate-x-1/2`. Never clipped.
- **BettingArea** — `pt-20` below table. Chip tray (6 denominations) + pending bet amount + Clear + Place Bet. No accumulator container — chips render on the table felt via `ChipStack` with spring entry/exit animations.
- **Casino rules text** — 3-tier gold text centered on felt at `top: 8%`: "Blackjack pays 3 to 2" (bold 13px), "Dealer must stand on 17 and draw to 16" (10px), "Insurance pays 2 to 1" (9px, conditional).
- **No More Bets sweep** — red banner slides in from top when phase hits `dealing`, auto-dismisses after 1s.
- **Host buttons** — Deal Cards / New Round below the table, centered.
- **RoundResult** — per-result animations: BJ burst (scale 0→1.3→1), WIN spring bounce, LOSE shake + red flash, PUSH/SURRENDER fade. Staggered for split hands. Payout slides up with delay.
- **Game Over** — full overlay with backdrop blur, redirects to lobby.
- **Back to Lobby** — resets both gameStore and uiStore before navigating.

## Key Engine Functions

### actions.ts
- `processAction(state, action)` — hit, stand, double (with rule enforcement), split (value-based), surrender (first-action guard), insurance_yes/no
- `allInsuranceDecided(state)` — checks all players have `insuranceDecided === true`
- `resolveInsurance(state)` — pays 2:1 on dealer BJ, transitions to settlement/playing
- `advanceHand(state)` — advances `activeHandIndex` through split hands before `advanceTurn`
- `getNextActivePlayer` — skips `!isActive` players (disconnect handling)

### game.ts
- `setPlayerBet` — guards: betting phase only, no re-betting
- `startNewRound` — checks `needsReshuffle`, removes 0-chip players to `removedPlayers[]`, sets `gameOver: true` when all bust
- `allBetsPlaced` — all players have hands[0].bet > 0

### dealing.ts
- `dealInitialHands` — checks dealer BJ on Ace-up (with/without insurance) and 10-value-up

### settlement.ts
- `settleHands` — evaluates all hands vs dealer, handles BJ/push/win/lose/bust
- `settleInsurance` — pays insurance 2:1 when dealer has BJ

### useGameSync.ts
- `finalizeState(state)` — runs dealer play + settlement if phase is `'dealer'` or `'settlement'`
- `writeAndSchedule(state)` — writes to Firestore, calls `scheduleNewRound()` if `phase === 'round_end'`
- Bet intent listener — calls `getGameDoc` for authoritative state (avoids stale store reads)
- Timer auto-stand — tracks consecutive timeouts, marks inactive after 2
- `scheduleNewRound` — uses `gameRef` for fresh state

## Test Coverage

57 tests across 9 files in `src/engine/__tests__/` and `src/components/__tests__/`:
- `types.test.ts` — Type definitions
- `hand.test.ts` — Hand evaluation (blackjack, soft, hard, bust, multiple aces)
- `shoe.test.ts` — Shoe creation, draw, reshuffle threshold
- `game.test.ts` — Game creation, add/remove player, start game, setPlayerBet guards, startNewRound (0-chip, gameOver)
- `dealing.test.ts` — Initial deal, insurance phase, dealer BJ detection
- `actions.test.ts` — Stand, split, double (rule enforcement), surrender (guard), insurance actions
- `dealer.test.ts` — Dealer S17/H17, draw to 17+
- `settlement.test.ts` — Win, loss, push, blackjack, doubled win, split mixed results, insurance payout
- `TableFelt.test.ts` — `computePositions` arc geometry: bounds, spread, concave-down curve, monotonic x

Tests pass: `npx vitest run`

## Fixed Issues Summary

### Known Issues (from earlier session)
1. ~~Bet concurrency~~ — Two-phase bet submission via `games/{code}/bets/{playerId}` subcollection
2. ~~Double down rules~~ — Engine + UI enforce `none`/`9-10-11`/`any`
3. ~~Insurance flow~~ — Full engine handlers + UI prompt
4. ~~Surrender button~~ — ActionButtons shows surrender when `rules.surrender === 'late'`
5. ~~Split 10-value pairs~~ — `calculateHandValue` for value comparison
6. ~~Turn timer auto-stand~~ — `onTimeout` callback + host enforcement
7. **Player disconnect** — Partial: `isActive=false` after 2 timeouts, "Away" badge, skipped in turn logic
8. ~~0-chip players~~ — `startNewRound` removal + `gameOver`
9. **Mobile layout** — Not addressed

### Additional Fixes
- Dealer Ace-up BJ detection (insurance on/off)
- Split hand navigation (`advanceHand`)
- Reshuffle in `startNewRound` + UI indicator
- Room code collision check (Firestore, 3 attempts)
- Bet re-guard (phase + already-bet check)
- Per-hand RoundResult labels (BUST vs LOSE vs SURRENDER)
- Back to Lobby reset (prevents WaitingRoom redirect loop)
- Centralized state resolution (`finalizeState` + `writeAndSchedule`)
- Bet intent listener reads `getGameDoc` to avoid stale store race
- `scheduleNewRound` uses `gameRef` for fresh state
- ~~Player arc positioning~~ — Fixed `computePositions` to use bottom-half ellipse (160°–20°, concave-down). Players now render on visible felt along table curve.
- ~~Player names/chips clipped~~ — Moved outside `TableFelt`'s `overflow: hidden` into arc-aligned info strip below table.
- ~~Action buttons clipped~~ — Moved outside `TableFelt`'s `overflow: hidden` into arc-aligned strip below table. Always visible.
- ~~PlayerAvatar circles~~ — Removed from player name display. Only text names now.
- ~~Chip consolidation~~ — BettingArea auto-consolidates chips into higher denominations (greedy via `breakdownDenoms`), with safety guard against value loss.
- ~~Card dealing animation~~ — Cards fly from shoe position (center-top of felt), sequential dealing order across players and dealer
- ~~Hole card reveal~~ — 3D flip animation on dealer's second card using CSS rotateY + backface-visibility
- ~~Chip stacking animation~~ — Framer-motion AnimatePresence entry/exit animations in ChipStack when pending bets change
- ~~Win/Lose result animation~~ — Per-result motion: BJ burst scale, WIN spring bounce, LOSE shake, staggered split-hand reveals
- ~~Betting circle glow~~ — Ring glow intensity scales proportionally to bet amount (pending or committed)
- ~~No More Bets sweep~~ — Red banner slides in from top when dealing phase begins, auto-dismisses after 1s
- ~~Chip count animation~~ — Player chip totals crossfade on change using key-based motion
- ~~Player turn breathing glow~~ — Active player's ring pulses with expanding boxShadow + inner radial glow
- ~~Casino rules text~~ — 3-row tiered text centered on felt showing Blackjack pays, Dealer rules, Insurance
- ~~Table size~~ — Increased 10% to 990px × 528px
- ~~Hole card reveal timing~~ — Hand value stays hidden until flip animation completes; hole card stays face-down during dealing
- ~~Table atmosphere~~ — Warm two-layer lamp glow with flicker, two-layer dark vignette, fabric noise felt grain, dealer shoe, discard pile, burn card, brass limit plaque
- ~~Card polish~~ — Casino SVG card back (navy/gold/burgundy with filigree), K/Q/J face card figure icons, 3D edge shadow

## Known Issues Remaining
1. **Player disconnect** — No real-time presence detection (Firestore-only, no backend)
2. **Mobile layout** — Not addressed
3. **Firestore rules** — Still in test mode (open access)
4. **Chunk size** — Main bundle ~738KB; could use code splitting

## Polish Todo

**Sound:**
- Chip click sound, card deal whoosh, dealer bust groan, blackjack chime, ambient casino hum, player turn alert

**Betting UX:**
- Quick bet shortcuts (Min/Half/Max), committed bet chips visible for all, dealer voice line callouts

**Round Flow:**
- Round intro animation, reshuffle animation, game over dramatic sequence

**Misc:**
- Room code watermark, player join/leave toasts, emoji reactions, table color themes

## Firebase Setup

- Project: `blackjackson-48cdc`
- Firestore: test mode (open rules)
- Auth: Anonymous sign-in enabled
- Config in `src/firebase/config.ts`

## Git Conventions

- Branches: `main` only
- Commits: conventional commit style (`feat:`, `fix:`, `chore:`, `ci:`, `docs:`)
- Deploy: automatic on push to `main` via GitHub Actions

## Commands

```bash
npm run dev        # Local dev server
npm run build      # TypeScript + Vite production build
npx vitest run     # Run all tests
```
