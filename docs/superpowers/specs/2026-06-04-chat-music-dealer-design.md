# Chat, Music Player & Dealer Image — Design Spec

**Date:** 2026-06-04  
**Status:** Approved (pending review)

## Overview

Three new social/atmosphere features for Blackjackson: a draggable chat panel with emoji reactions and `/tip` command, a host-controlled music player, and dealer persona images replacing the "D" icon.

---

## 1. Chat System

### Data Layer

**Subcollection:** `games/{code}/chat/{messageId}`

Each document:
```ts
type ChatMessage = {
  playerId: string          // sender uid, or 'SYSTEM' for system messages
  playerName: string        // display name
  text: string              // message body, or emoji unicode, or tip amount text
  type: 'message' | 'tip' | 'emoji' | 'system'
  timestamp: number         // Date.now()
}
```

Messages are ephemeral — they live in the subcollection and are cleaned up when the game doc is deleted. No TTL needed; Firebase cascade delete handles it.

**Subcollection:** `games/{code}/tips/{docId}` (for `/tip` intents, same pattern as bet intents)

```ts
type TipIntent = {
  fromId: string
  toPlayerId: string
  amount: number
  timestamp: number
}
```

### `/tip` Command Flow

1. Client parses input starting with `/tip `. Splits by space: `/tip <namePrefix> <amount>`
2. Client resolves recipient by matching `player.name.toLowerCase().startsWith(namePrefix.toLowerCase())` from the local game state. If no match or ambiguous, shows inline error.
3. Client writes `tipIntent` to `games/{code}/tips/{docId}`
4. Client writes a `type: 'tip'` chat message for the feed
5. Host's `useGameSync` tip intent listener (same pattern as bet intents):
   - Reads current game doc
   - Validates sender has enough chips
   - Deducts from sender, adds to recipient in `players` array
   - Writes a `type: 'system'` chat message: `"SYSTEM: {senderName} tipped {amount} chips to {recipientName}"`
   - Updates game doc with modified `players`
   - Deletes the tip intent doc

### Player Name Matching

- `startsWith`, case-insensitive
- If match is ambiguous (e.g., `max` matches both `maxxine` and `maximus`), show error: `"Multiple players match 'max': maxxine, maximus"`
- If no match, show error: `"No player found matching 'max'"`
- Exact match (full name) always wins over prefix

### Draggable Collapsible Panel

**Implementation:** React portal to `document.body`. Component: `ChatPanel`.

**States:**
- **Collapsed:** A sleek pill-shaped toggle button. Shows unread count badge (red pill with number).
- **Expanded:** ~340x420px panel with three sections: header, message feed, input+emoji bar.

**Drag:** `onPointerDown` on header bar → track `pointermove`/`pointerup` on `document`. Apply `translate(x, y)` transform. Position saved to `localStorage` key `chatPanelPos_${roomCode}`. Not synced across players.

**Collapse/Expand:** Toggle button or header `[—]` button. Uses framer-motion spring animation for smooth open/close transition.

### Panel Layout (Expanded)

```
┌─────────────────────────┐
│  Chat          [—] [×]  │  ← header (drag handle)
├─────────────────────────┤
│                         │
│  maxxine: hello!        │  ← white text
│  joe: sup               │
│  SYSTEM: maxxine tipped │  ← red text (#ef4444)
│  500 chips to joe       │
│                         │
├─────────────────────────┤
│ [text input...    Send] │  ← detects / prefix
├─────────────────────────┤
│ 😂 ❤️ 🔥 👏 🎉 💀      │  ← emoji bar
│ 🃏 💰 👀 👍 ☕ 🎲      │
└─────────────────────────┘
```

### Message Styles

- **Player messages:** White text, player name in gold, left-aligned with small colored avatar dot
- **System messages:** Red text (#ef4444), centered, smaller font, `SYSTEM:` prefix bold
- **Tip messages:** Same as player message, but show chip icon + amount inline
- **Timestamps:** Relative ("2m ago", "just now") on hover or shown subtly

### Emoji Float Animation

When a `type: 'emoji'` chat message is written:

1. All clients subscribing to the chat subcollection detect the new emoji message
2. Client looks up the sender's seat position from the current `game.players` arc (`computePositions`)
3. Renders a `<motion.span>` as a portal or absolutely positioned child of the table felt container
4. Animation over 1.8s:
   - `y`: moves up by ~120px
   - `opacity`: 1 → 0
   - `scale`: 1 → 1.5
   - `transition`: ease-out
5. Multiple simultaneous emojis stagger by 150ms per emoji using `AnimatePresence`

**Cleanup:** Emoji float elements remove themselves after animation completes (on `AnimationComplete` callback). No Firestore cleanup needed — the float animation is ephemeral.

**Feed filtering:** Emoji messages (`type: 'emoji'`) are NOT rendered in the chat message feed. Their sole visual is the float animation. They are excluded from unread counts.

### Unread Badge

- Client stores `lastReadTimestamp` in `localStorage` per room code
- When panel is collapsed, count messages with `timestamp > lastReadTimestamp` and `type !== 'emoji'`
- Show red badge pill on the collapsed toggle button
- On expand, update `lastReadTimestamp`

### Input Behavior

- Enter key sends message
- Auto-focus input on panel expand
- Max 280 characters
- Sending: write to `games/{code}/chat/` via `addDoc`
- Image/attachment not supported

---

## 2. Music Player

### Data Layer

**Single field on GameState:** `music: MusicState | null`

```ts
type MusicState = {
  source: 'youtube' | 'playlist'
  url: string
  title: string
  playing: boolean
  currentTime: number       // seconds
  lastCommandAt: number     // Date.now() ms
}
```

Host writes updates via `updateGameDoc`. All clients read via existing `onSnapshot` subscription on the game doc.

### Draggable Collapsible Panel

Same pattern as chat panel. Component: `MusicPanel`. Stored position in `localStorage` key `musicPanelPos_${roomCode}`. Only host sees the full controls; non-hosts see a read-only "Now Playing" display.

**Collapsed:** Music note toggle button. Pulse animation when music is playing.

**Expanded:** ~340x180px panel.

### Panel Layout (Host)

```
┌──────────────────────────┐
│  ♪ Music Player  [—] [×] │  ← header (drag handle)
├──────────────────────────┤
│  Source: [YouTube] [Playlist]
├──────────────────────────┤
│  Now Playing: Song Title │
│                          │
│  [◂◂]  [▶ / ⏸]  [▸▸]   │  ← transport controls
│  ████████░░░░ 2:14/3:45  │  ← seek bar (YouTube only)
│                          │
│  Volume: ████████░░ 80%  │  ← per-player, not synced
├──────────────────────────┤
│  [YouTube URL input]     │  ← only on YouTube tab
└──────────────────────────┘
```

### Panel Layout (Non-Host)

```
┌──────────────────────────┐
│  ♪ Now Playing   [—] [×] │
├──────────────────────────┤
│  Song Title              │
│  via YouTube / Playlist  │
│                          │
│  Volume: ████████░░ 80%  │  ← individual
└──────────────────────────┘
```

### Source Types

**YouTube Tab:**
- Host pastes a YouTube URL into the input
- Uses YouTube IFrame API (loads `https://www.youtube.com/iframe_api`)
- Each client creates a hidden `<iframe>` with the YouTube embed
- Host controls (play/pause/seek) write to Firestore `music` field
- Clients call `player.playVideo()` / `player.pauseVideo()` / `player.seekTo()` via the IFrame API
- Seek bar only functional for YouTube (HTML5 audio has its own native controls but we don't expose seek for playlist tracks)

**Playlist Tab:**
- Hardcoded array of 6-8 royalty-free tracks in a constants file
- Source: Pixabay Music / Freesound (casino ambient, jazz lounge, lo-fi)
- Host selects a track → writes URL + title to Firestore
- Clients use HTML `<audio>` element: `new Audio(url)`
- No seek control for playlist tracks (play/pause only)
- Tracks loop individually (`audio.loop = true`)

**Upload Tab (Future):**
- Grayed-out with "Coming Soon" badge
- Depends on Firebase Storage setup
- Will use same Firestore pattern

### Sync Strategy (Loose)

- Host writes `{ playing, currentTime, lastCommandAt }` on any control action
- Clients detect `music` field change via existing game doc `onSnapshot`
- On `playing: true`: start playback at `currentTime` on their local player
- Drift correction: every 5 seconds, compare local time vs expected time (`currentTime + (Date.now() - lastCommandAt) / 1000`). If diff > 2 seconds, snap to expected time.
- Implemented as a `useEffect` with interval in the client-side music hook

### Visual Style

- Dark glassmorphism: `bg-black/80 backdrop-blur-md border border-white/10 rounded-xl`
- Gold accent on active transport buttons
- White text with subdued secondary text
- Smooth spring expand/collapse animation
- Sleek, modern — consistent with the casino theme's polish level

---

## 3. Dealer Image

### Persona System

```ts
type DealerPersona = 'default' | 'lady_gold' | 'mr_velvet' | 'the_house'

const DEALER_IMAGES: Record<DealerPersona, string> = {
  default: '/dealers/default.png',
  lady_gold: '/dealers/lady_gold.png',
  mr_velvet: '/dealers/mr_velvet.png',
  the_house: '/dealers/the_house.png',
}
```

### Storage

- Static PNG files in `public/dealers/`
- 4 placeholder images (simple silhouette or card-suit-themed graphics)
- User replaces files with real images later
- No Firebase Storage dependency — served by Vite/GitHub Pages

### GameState Change

New top-level field on `GameState`: `dealerPersona: DealerPersona` (defaults to `'default'`). Added in `createGame()` engine function and `CreateGameForm`.

Host selects persona in `CreateGameForm` or `RulesConfig` via a dropdown. Stored in the game doc.

### DealerArea Changes

**Remove:**
- Dealer name text
- "D" icon circle/avatar element

**Add:**
- `<img>` rendering the persona image, ~90-110px tall, centered above table
- `onError` fallback: show a neutral card-back-themed div if image fails to load
- Image sits in the dark backdrop above the table edge

**Layout shift:**
- Dealer cards move down by ~30-40px so they overlap the table's top edge slightly (like cards dealt from the dealer's position onto the felt)
- The portrait sits in the freed space above

### Fallback
```
┌─────────────────┐
│                 │
│   🂠  ♠  ♢  ♣  │  ← card suit pattern fallback
│                 │
└─────────────────┘
```

---

## 4. New Files

```
src/
  components/
    Chat/
      ChatPanel.tsx          # Draggable collapsible chat panel
      ChatMessage.tsx        # Single message row
      EmojiBar.tsx           # Clickable emoji row
      EmojiFloat.tsx         # Floating emoji animation element
      ChatToggle.tsx         # Collapsed state toggle button
    Music/
      MusicPanel.tsx         # Draggable collapsible music panel
      MusicControls.tsx      # Transport controls
      YoutubePlayer.tsx      # Hidden YouTube iframe wrapper
      PlaylistPicker.tsx     # Track list for playlist tab
    Dealer/
      DealerPortrait.tsx     # Persona image + fallback

  hooks/
    useChat.ts               # Chat subcollection subscription + send
    useMusic.ts              # Music sync hook (drift correction, YouTube API)
    useDraggable.ts          # Reusable pointer-event drag hook (shared by chat + music)

  firebase/
    chat.ts                  # addChatMessage, subscribeToChat
    tips.ts                  # submitTipIntent, tipIntentsCollection

  stores/
    chatStore.ts             # Zustand: messages[], unreadCount, lastReadTimestamp

  engine/
    types.ts                 # Add ChatMessage, TipIntent, MusicState, DealerPersona types

  constants/
    music.ts                 # Baked-in playlist tracks
    emojis.ts                # Default emoji set for emoji bar
```

## 5. Existing Files to Modify

| File | Changes |
|------|---------|
| `src/engine/types.ts` | Add `ChatMessage`, `TipIntent`, `MusicState`, `DealerPersona` types. Add `music`, `dealerPersona` to `GameState`. |
| `src/hooks/useGameSync.ts` | Add tip intent listener (mirrors bet intent pattern). |
| `src/components/Table/TablePage.tsx` | Mount `ChatPanel`, `MusicPanel`, emoji float container. Pass `dealerPersona` to `DealerArea`. |
| `src/components/Table/DealerArea.tsx` | Replace name/icon with `DealerPortrait`, shift card positions. |
| `src/firebase/games.ts` | Add `music` to Firestore writes as needed (already covered by spread). |
| `src/components/Lobby/CreateGameForm.tsx` | Add `dealerPersona` dropdown. |
| `src/stores/gameStore.ts` | No changes needed — `GameState` extension transparent. |
| `src/components/Table/TableFelt.tsx` | Expose `players` positions for emoji float lookup. |

## 6. Key States

| State | Visibility |
|-------|-----------|
| **Chat panel** | Visible on TablePage only. Collapsed by default. |
| **Music panel** | Visible on TablePage only. Collapsed by default. |
| **Host controls** | Only host sees music transport controls and source tabs. |
| **Dealer portrait** | Always visible on TablePage (no toggle). |
| **Emoji floats** | On-felt overlay, visible to all during animation. |
| **Unread badge** | Red pill on collapsed chat toggle when messages > lastRead. |

## 7. Edge Cases

- **Chat:** Player leaves mid-typing — message is not saved. Firestore subcollection auto-deletes with game.
- **`/tip`:** Sender has insufficient chips — tip intent listener rejects silently, writes system message: `"SYSTEM: Tip failed — insufficient chips."`
- **`/tip`:** Recipient matches removed/inactive player — allowed (chips go to their balance, they claim when they return).
- **`/tip`:** Ambiguous name match — inline error in chat input, no Firestore write.
- **Music:** YouTube video is unavailable/deleted — client shows "Video unavailable" in the panel. No crash.
- **Music:** Host disconnects — music keeps playing on clients at last known state. No new commands until a new host takes over (or music stops on game end).
- **Music:** Two players open YouTube tab — each gets their own iframe, no conflict.
- **Dealer image:** Image 404 — fallback div rendered.
- **Drag:** Panel dragged off-screen — clamp position to viewport bounds on `pointerup`.

## 8. Non-Goals

- Persistent chat history (messages live only for the game session)
- Private/direct messages (all chat is public to the table)
- Music volume sync across players (individual per player)
- Upload tab in music player (deferred, needs Firebase Storage)
- Mobile-optimized drag behavior (mobile layout already listed as known issue)
- Dealer voice lines or expressions (deferred)
