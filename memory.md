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
- **Tip intents** via subcollection `games/{code}/tips/{docId}` — same two-phase pattern, host processes with `FieldValue.increment` for concurrency safety
- **Chat messages** via subcollection `games/{code}/chat/{messageId}` — 4 types: message/tip/emoji/system. Cascade-deleted with game doc.
- **Music state** via top-level `music` field on GameState — host writes, all clients read via existing `onSnapshot`. Loose drift correction (2s tolerance).
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
| `src/stores/uiStore.ts` | Zustand: soundEnabled toggle, volume slider (0-1), currentView (lobby/waiting) |
| `src/hooks/useGameSync.ts` | Firestore sub + bet intent listener + tip intent listener + `finalizeState` + `writeAndSchedule` + timer auto-stand + auto-stand on hit-to-21 + `quickBet` + `scheduleNewRound` |
| `src/hooks/useSound.ts` | Web Audio API synthesized sound effects (9 types: deal, chip, win, lose, blackjack, bust, turn, shuffle, tick), master GainNode for volume control |
| `src/hooks/useDraggable.ts` | Reusable pointer-event drag hook with localStorage persistence + viewport clamping — shared by ChatPanel + MusicPanel |
| `src/hooks/useChat.ts` | Chat subcollection subscription + sendMessage/sendEmoji/sendTip |
| `src/hooks/useMusic.ts` | Music sync: YouTube IFrame API + playlist HTML Audio, drift correction, host time-sync every 10s |
| `src/firebase/chat.ts` | `addChatMessage`, `subscribeToChat` (200-msg limit, ordered by timestamp) |
| `src/firebase/tips.ts` | `submitTipIntent`, `tipIntentsCollection` |
| `src/stores/chatStore.ts` | Zustand: messages[], isOpen, lastReadTimestamp, unread state |
| `src/components/Chat/` | ChatPanel, ChatMessage, EmojiBar, EmojiFloat, ChatToggle |
| `src/components/Music/` | MusicPanel, MusicControls, YoutubePlayer, PlaylistPicker, MusicToggle |
| `src/components/Dealer/` | DealerPortrait (persona image + onError fallback) |
| `src/constants/emojis.ts` | 12 emoji chars for chat emoji bar |
| `src/constants/music.ts` | 6-track playlist + DEALER_IMAGES mapping |
| `src/components/Lobby/` | CreateGameForm, JoinGameForm, RulesConfig, WaitingRoom, LobbyPage |
| `src/components/Table/` | TableFelt, DealerArea, PlayerPosition, CardComponent, CardHand, Chip, ChipStack, ActionButtons, TurnTimer, RoundResult, BettingArea, TablePage, Shoe, DiscardPile, LimitPlaque |
| `src/components/Shared/` | Button, Modal, PlayerAvatar, VolumeControl |
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
- **BettingArea** — `pt-20` below table. Chip tray (6 denominations) + pending bet amount + Clear + Place Bet + quick bet shortcuts (Min/Half/Max). Committed bet chips visible on felt for all players via `ChipStack` with spring entry/exit animations.
- **Casino rules text** — 3-tier gold text centered on felt at `top: 14%` with dark text-shadow for readability: "Blackjack pays 3 to 2" (bold 13px, text-gold/55), "Dealer must stand on 17 and draw to 16" (10px, text-gold/35), "Insurance pays 2 to 1" (9px, text-gold/25, conditional).
- **No More Bets sweep** — red banner slides in from top when phase hits `dealing`, auto-dismisses after 1s.
- **Round intro** — "Round X" overlay animates in on table felt when round number changes: spring-scale + staggered text (label then number), ~1.8s duration.
- **Reshuffle banner** — spring-in card-wobble animation with playing card icons wiggling around "Reshuffling" text.
- **Host buttons** — Deal Cards / New Round below the table, centered.
- **RoundResult** — per-result animations: BJ burst (scale 0→1.3→1), WIN spring bounce, LOSE shake + red flash, PUSH/SURRENDER fade. Staggered for split hands. Payout slides up with delay.
- **Game Over** — full overlay with backdrop blur, redirects to lobby.
- **Back to Lobby** — resets both gameStore and uiStore before navigating.
- **Sound** — 9 synthesized sound types via Web Audio API: deal (triangle whoosh), chip (square click), win (ascending C-E-G), lose (descending sawtooth), blackjack (ascending C-E-G-C'), bust (dual-oscillator groan), turn (two-tone chime), shuffle (cascading triangle notes), tick (short sine). Volume slider in `uiStore` via master GainNode, fixed bottom-right corner on all pages. Gated by `soundEnabled` toggle.
- **Floating panels** — ChatPanel + MusicPanel as draggable/resizable portals (CSS left/top, z-[60]). Collapsible to slim header bars. ChatToggle/MusicToggle FABs at bottom-right (right: 24 and right: 88, bottom: 24). VolumeControl moved to top-4 left-4 to avoid overlap.
- **Auto-stand on 21** — When a player hits to exactly 21 (not bust), host schedules a delayed auto-stand after 800ms with safety guards (phase/turn/hand validation).

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
- Tip intent listener — validates sender/recipient/chips, uses `FieldValue.increment` for atomic transfer, posts system messages
- Timer auto-stand — tracks consecutive timeouts, marks inactive after 2
- Auto-stand on 21 — after hit-to-21, schedules delayed stand (800ms, host-only)
- `quickBet(target)` — clears pending then uses greedy chip denomination breakdown to reach exact bet amount
- `scheduleNewRound` — uses `gameRef` for fresh state

## Test Coverage

57 tests across 9 files (engine + TableFelt). All pass with `npx vitest run`.

**Gap:** New chat/music hooks and UI components have no tests. Engine types compile-checked but untested for Firestore integration paths.

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
- ~~Rules text readability~~ — Moved from `top: 8%` to `14%`, boosted opacity (gold/55, /35, /25), added dark text-shadow halos
- ~~Ring glow visibility~~ — Bumped glowAlpha base 0.15→0.25 and ringAlpha base 0.10→0.18
- ~~Sound effects~~ — 9 Web Audio API synthesized sounds wired to all game events (deal, chip, win, lose, BJ, bust, turn, shuffle, tick)
- ~~Volume control~~ — Master GainNode + fixed bottom-right slider, `soundEnabled` toggle, volume stored in uiStore
- ~~Committed bet chips~~ — Chips visible on felt for all players during betting, not just pending bets
- ~~Round intro animation~~ — "Round X" spring-scale overlay when round number changes
- ~~Reshuffle animation~~ — Card-wobble banner replacing old pulsing text
- ~~Quick bet shortcuts~~ — Min/Half/Max pill buttons in BettingArea, greedy chip denomination breakdown via `quickBet()`
- ~~Auto-stand on 21~~ — 800ms delayed stand after hit-to-21, host-only, with state validation guards
- ~~VolumeControl overlaps FABs~~ — Moved to top-4 left-4 z-40; FABs at z-[60]
- ~~Panels off-screen on window resize~~ — useDraggable clamps saved localStorage position to current viewport
- ~~Collapse buttons broken~~ — Pointer capture stole clicks; added onPointerDown stopPropagation
- ~~Youtube play crashes app~~ — updateMusic() now merges with current state instead of replacing music field
- ~~Panel positioning invisible~~ — Switched from framer-motion x/y transforms to CSS left/top
- ~~Collapsed panels invisible~~ — Now show draggable header bar with [+]/[—] toggle
- ~~YouTube time updates slow~~ — Host uses local 1s polling; non-host uses Firestore every 10s
- ~~No video title~~ — YoutubePlayer onMetadata callback fetches title via getVideoData()

## Known Issues Remaining
1. **Player disconnect** — No real-time presence detection (Firestore-only, no backend)
2. **Mobile layout** — Not addressed; draggable/resizable panels may not work on touch
3. **Firestore rules** — Still in test mode (open access); chat/tips subcollections unprotected
4. **Chunk size** — Main bundle ~783KB; could use code splitting
5. **Pixabay playlist URLs** — 6 placeholder URLs in `constants/music.ts` need real audio file URLs
6. **No tests for new code** — Chat, music, draggable hook, dealer portrait have zero test coverage
7. **Dealer SVGs 404 on production** — Image paths use `/dealers/*.svg` but app has basename `/blackjackson`; should be `import.meta.env.BASE_URL + 'dealers/...'`
8. **YouTube title only fetched for host** — Non-hosts receive title via Firestore sync; if host loads video before other players join, they won't see the title

## Chat, Music & Dealer Features (2026-06-04)

**Chat System:**
- Draggable resizable ChatPanel (CSS `left`/`top` positioning, localStorage position + size)
- Collapsed state shows slim draggable header bar with `[+]` to reopen — stays visible and draggable
- ChatToggle FAB toggles open/close (below table, bottom-right)
- Firestore subcollection `games/{code}/chat/` for messages (4 types: message/tip/emoji/system)
- `/tip <name> <amount>` command — prefix match, tip intents via `games/{code}/tips/`, host-processed with `FieldValue.increment` for concurrency safety
- Emoji bar (12 emojis), click sends emoji; floats up from sender's seat on table felt
- Unread badge on collapsed ChatToggle pill button
- Zustand `chatStore`, `useChat` hook, `ChatMessage`, `EmojiBar`, `EmojiFloat` components

**Music Player:**
- Draggable resizable MusicPanel (same pattern as chat, localStorage `musicPanelSize_*`)
- Collapsed state shows draggable bar with `[+]`/`[—]` toggle and current track title
- YouTube IFrame API: paste URL, host loads → automatic title fetch via `getVideoData()`, displayed in panel + synced to all players via Firestore
- Smooth seek bar: host uses local 1s polling time; non-hosts use Firestore `currentTime`
- Host time sync to Firestore every 10s; non-host clients read via game doc `onSnapshot`
- `updateMusic()` merges patch with current `music` state (`{...current, ...patch}`) — prevents field wipe
- Baked-in playlist of 6 tracks (HTML Audio, drift correction every 5s) — placeholder URLs, needs real audio files
- Host-only transport controls + source tabs; non-host sees "Now Playing" + per-player volume
- MusicToggle FAB with pulse animation when playing (top-right of ChatToggle)
- `useMusic` hook, `MusicControls`, `YoutubePlayer` (with `onMetadata` callback), `PlaylistPicker` components

**Dealer Portraits:**
- 4 personas (default, lady_gold, mr_velvet, the_house), selectable in CreateGameForm
- DealerArea rewritten: portrait image replaces name/D-icon, cards shifted down
- SVG placeholders in `public/dealers/`, `DealerPortrait` with onError card-suit fallback and `useEffect` error reset on persona change
- Stored as `dealerPersona` on GameState, passed through createGame engine
- **Known bug:** SVGs 404 on production (basename `/blackjackson` not in path). Images resolve to root `/dealers/` instead of `/blackjackson/dealers/`

**New files:** `src/components/Chat/` (5), `src/components/Music/` (5), `src/components/Dealer/` (1), `src/hooks/useDraggable.ts`, `src/hooks/useChat.ts`, `src/hooks/useMusic.ts`, `src/firebase/chat.ts`, `src/firebase/tips.ts`, `src/stores/chatStore.ts`, `src/constants/emojis.ts`, `src/constants/music.ts`, `public/dealers/` (4 SVGs)

**Key decisions & lessons learned:**
- Chat messages in subcollection (not game doc array) to keep game doc lean
- Tip intents follow same two-phase pattern as bet intents
- Music uses top-level `music` field on GameState (small, atomic reads with game state)
- Draggable hook shared by both panels via `useDraggable(storageKey, defaultPos)`
- `useDraggable` clamps saved localStorage positions to current viewport on load (prevents off-screen after window resize)
- Collapse bar button uses `onPointerDown={e => e.stopPropagation()}` to prevent drag capture from stealing the click
- VolumeControl moved to `top-4 left-4 z-40` to avoid overlapping FAB buttons at bottom-right
- Panel positioning uses CSS `left`/`top` instead of Framer Motion `x`/`y` transforms (more reliable for portals)
- Resize via corner drag handle, saved per-panel to localStorage (`panelSize_*`, `musicPanelSize_*`)

## Polish Todo

**Sound:**
- ~~Chip click sound~~, ~~card deal whoosh~~, ~~dealer bust groan~~, ~~blackjack chime~~, ambient casino hum, ~~player turn alert~~

**Betting UX:**
- ~~Quick bet shortcuts (Min/Half/Max)~~, ~~committed bet chips visible for all~~, dealer voice line callouts

**Round Flow:**
- ~~Round intro animation~~, ~~reshuffle animation~~, game over dramatic sequence

**Misc:**
- ~~Emoji reactions~~, room code watermark, player join/leave toasts, table color themes

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
