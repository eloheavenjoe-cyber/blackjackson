# Table Polish & Visual Chips — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace text-based bet buttons with visual casino chip SVGs, restructure the table with a Governor of Poker 3-style semicircle layout, wood rim, and felt texture.

**Architecture:** Two new components (`Chip.tsx`, `BettingArea.tsx`), five reworked components (`TableFelt`, `PlayerPosition`, `ChipStack`, `DealerArea`, `TablePage`). All visuals are inline SVG + CSS. No engine, Firebase, or store changes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4, Framer Motion, inline SVG

---

### Task 1: Chip.tsx — Inline SVG casino chip component

**Files:**
- Create: `src/components/Table/Chip.tsx`

- [ ] **Step 1: Create Chip.tsx**

```typescript
type ChipProps = {
  value: 10 | 25 | 50 | 100 | 250 | 500
  size?: 'betting' | 'table' | 'small'
  onClick?: () => void
  dimmed?: boolean
}

const chipSpecs: Record<number, { body: string; edge: string; label: string }> = {
  10:  { body: '#1a6ec4', edge: '#ffffff', label: '10' },
  25:  { body: '#2d8c3a', edge: '#e8c547', label: '25' },
  50:  { body: '#c44141', edge: '#1a6ec4', label: '50' },
  100: { body: '#1a1a1a', edge: '#d4a843', label: '100' },
  250: { body: '#7b2d8b', edge: '#ffffff', label: '250' },
  500: { body: '#8b1a2b', edge: '#d4a843', label: '500' },
}

const sizeMap: Record<string, { dim: number; font: number; rim: number }> = {
  betting: { dim: 56, font: 22, rim: 3 },
  table:   { dim: 40, font: 16, rim: 2 },
  small:   { dim: 28, font: 11, rim: 1.5 },
}

export function Chip({ value, size = 'table', onClick, dimmed }: ChipProps) {
  const spec = chipSpecs[value]
  const s = sizeMap[size]
  const cx = s.dim / 2
  const cy = s.dim / 2
  const r = cx - 2

  const edgeSpots = [0, 120, 240].flatMap((angle) =>
    [angle - 10, angle + 10].map((a) => a)
  )

  return (
    <svg
      width={s.dim}
      height={s.dim}
      viewBox={`0 0 ${s.dim} ${s.dim}`}
      className={`inline-block select-none ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95' : ''} transition-transform ${dimmed ? 'opacity-30' : ''}`}
      onClick={onClick}
    >
      <defs>
        <radialGradient id={`grad-${value}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={spec.body} stopOpacity="1" />
          <stop offset="100%" stopColor={spec.body} stopOpacity="0.7" />
        </radialGradient>
      </defs>
      {/* Outer rim shadow */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a0a00" strokeWidth={s.rim + 2} opacity={0.5} />
      {/* Rim face */}
      <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="#4a3520" strokeWidth={s.rim} />
      {/* Chip body */}
      <circle cx={cx} cy={cy} r={r - s.rim} fill={`url(#grad-${value})`} />
      {/* Edge spots */}
      {edgeSpots.map((angle) => (
        <rect
          key={angle}
          x={cx - 3}
          y={cy - r}
          width={6}
          height={s.rim + 1}
          fill={spec.edge}
          transform={`rotate(${angle}, ${cx}, ${cy})`}
          rx={1}
        />
      ))}
      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={r * 0.65} fill="none" stroke="#d4a843" strokeWidth={0.8} opacity={0.6} />
      {/* Center inlay */}
      <circle cx={cx} cy={cy} r={r * 0.55} fill="white" />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="none" stroke="#d4a843" strokeWidth={0.5} opacity={0.4} />
      {/* Denomination text */}
      <text x={cx} y={cy + s.font * 0.35} textAnchor="middle" fontSize={s.font} fontWeight="bold" fontFamily="system-ui, sans-serif" fill="#1a1a1a">
        {spec.label}
      </text>
    </svg>
  )
}
```

- [ ] **Step 2: Verify build compiles with new file**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: No errors from Chip.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/Table/Chip.tsx
git commit -m "feat: add inline SVG casino chip component with 6 denominations"
```

---

### Task 2: TableFelt rework — felt texture, wood rim, semicircle arc

**Files:**
- Modify: `src/components/Table/TableFelt.tsx`

- [ ] **Step 1: Replace TableFelt with semicircle layout**

Replace entire contents of `C:\Users\Faber\Projects\Blackjackson\src\components\Table\TableFelt.tsx`:

```typescript
import type { ReactNode } from 'react'

type SeatPosition = {
  x: number
  y: number
  angle: number
}

type Props = {
  children: ReactNode
  playerCount: number
  positions: SeatPosition[]
}

function computePositions(count: number, width: number, height: number): SeatPosition[] {
  if (count === 0) return []
  if (count === 1) return [{ x: width / 2, y: height * 0.7, angle: 0 }]

  const cx = width / 2
  const cy = height * 0.62
  const radius = Math.min(width * 0.35, height * 0.42)
  const startAngle = 210 * (Math.PI / 180)
  const endAngle = 330 * (Math.PI / 180)
  const arcSpan = endAngle - startAngle

  return Array.from({ length: count }, (_, i) => {
    const angle = count === 1 ? 270 * (Math.PI / 180) : startAngle + (i / (count - 1)) * arcSpan
    return {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      angle: angle - Math.PI / 2,
    }
  })
}

export function TableFelt({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1a0a00' }}>
      <div
        className="flex-1 m-2 sm:m-3 rounded-[3rem] overflow-hidden relative"
        style={{
          border: '16px solid #5c3a1e',
          boxShadow: 'inset 0 0 0 3px #d4a84333, inset 0 0 120px rgba(0,0,0,0.6), 0 0 40px rgba(0,0,0,0.8)',
          background: `#0a3d1f url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='0.4' fill='%2300000022'/%3E%3C/svg%3E")`,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(13,94,46,0.5) 0%, transparent 70%)',
          }}
        />
        {children}
      </div>
    </div>
  )
}

export { computePositions }
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/TableFelt.tsx
git commit -m "feat: add semicircle arc positioning, wood rim, felt texture to TableFelt"
```

---

### Task 3: ChipStack update — use Chip component

**Files:**
- Modify: `src/components/Table/ChipStack.tsx`

- [ ] **Step 1: Replace ChipStack to use Chip component**

Replace entire contents of `C:\Users\Faber\Projects\Blackjackson\src\components\Table\ChipStack.tsx`:

```typescript
import { Chip } from './Chip'

type ChipValue = 10 | 25 | 50 | 100 | 250 | 500

type Props = {
  amount: number
  size?: 'sm' | 'md'
}

function getChipValues(amount: number): ChipValue[] {
  const denoms: ChipValue[] = [500, 250, 100, 50, 25, 10]
  const result: ChipValue[] = []
  let remaining = amount
  for (const d of denoms) {
    while (remaining >= d && result.length < 5) {
      result.push(d)
      remaining -= d
    }
  }
  return result
}

export function ChipStack({ amount, size = 'sm' }: Props) {
  if (amount <= 0) return null
  const values = getChipValues(amount)
  const chipSize = size === 'sm' ? 'small' : 'table'

  return (
    <div className="relative inline-flex flex-col items-center">
      <div className="relative" style={{ height: 28 + (values.length - 1) * 4, width: 30 }}>
        {values.map((v, i) => (
          <div
            key={i}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: i * 4, zIndex: values.length - i }}
          >
            <Chip value={v} size={chipSize as 'small' | 'table'} />
          </div>
        ))}
      </div>
      <span className="text-xs font-bold text-gold mt-1">{amount}</span>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/ChipStack.tsx
git commit -m "feat: update ChipStack to use SVG Chip component with denomination breakdown"
```

---

### Task 4: BettingArea — chip tray + bet accumulator

**Files:**
- Create: `src/components/Table/BettingArea.tsx`

- [ ] **Step 1: Create BettingArea.tsx**

```typescript
import { useState } from 'react'
import { Chip } from './Chip'
import { Button } from '../Shared/Button'

type ChipValue = 10 | 25 | 50 | 100 | 250 | 500

type Props = {
  chips: number
  minBet: number
  maxBet: number
  onPlaceBet: (amount: number) => void
  alreadyBet: boolean
  currentBetAmount?: number
}

const allDenoms: ChipValue[] = [10, 25, 50, 100, 250, 500]

export function BettingArea({ chips, minBet, maxBet, onPlaceBet, alreadyBet, currentBetAmount }: Props) {
  const [bet, setBet] = useState(0)

  if (alreadyBet) {
    return (
      <div className="flex justify-center items-center gap-3 pb-4">
        <div className="flex items-center gap-2 bg-black/30 rounded-xl px-4 py-2 border border-gold/20">
          <span className="text-gold text-sm font-bold">Bet placed:</span>
          <ChipStackSimple amount={currentBetAmount ?? 0} />
          <span className="text-white text-sm">{currentBetAmount}</span>
        </div>
      </div>
    )
  }

  if (chips < minBet) {
    return (
      <div className="flex justify-center pb-4">
        <p className="text-gray-500 text-sm">Not enough chips to bet</p>
      </div>
    )
  }

  const canAfford = (v: number) => v <= chips && v + bet <= maxBet && v + bet <= chips

  function clear() {
    setBet(0)
  }

  function placeBet() {
    if (bet >= minBet) {
      onPlaceBet(bet)
      setBet(0)
    }
  }

  return (
    <div className="flex items-center justify-center gap-6 pb-4">
      <div className="flex items-center gap-2">
        <button onClick={clear} className="text-gray-400 hover:text-white text-xs cursor-pointer">
          Clear
        </button>
        <ChipStackSimple amount={bet} />
        <span className="text-gold font-bold text-sm min-w-[3ch]">{bet || '0'}</span>
      </div>

      <div className="flex gap-1.5">
        {allDenoms.map((v) => (
          <Chip
            key={v}
            value={v}
            size="betting"
            onClick={canAfford(v) ? () => setBet((b) => b + v) : undefined}
            dimmed={!canAfford(v)}
          />
        ))}
      </div>

      <Button onClick={placeBet} disabled={bet < minBet} size="sm">
        Place Bet
      </Button>
    </div>
  )
}

function ChipStackSimple({ amount }: { amount: number }) {
  if (amount <= 0) return null
  return <Chip value={amount >= 100 ? 100 : amount >= 50 ? 50 : amount >= 25 ? 25 : 10} size="small" />
}
```

- [ ] **Step 2: Verify build**

Run: `npx tsc --noEmit --project tsconfig.app.json`
Expected: No errors from BettingArea.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/Table/BettingArea.tsx
git commit -m "feat: add BettingArea with clickable chip tray and bet accumulator"
```

---

### Task 5: PlayerPosition rework — x/y/angle positioning

**Files:**
- Modify: `src/components/Table/PlayerPosition.tsx`

- [ ] **Step 1: Rewrite PlayerPosition for arc positioning**

Replace entire contents of `C:\Users\Faber\Projects\Blackjackson\src\components\Table\PlayerPosition.tsx`:

```typescript
import type { PlayerState, GamePhase, GameRules } from '../../engine/types'
import { PlayerAvatar } from '../Shared/PlayerAvatar'
import { CardHand } from './CardHand'
import { ActionButtons } from './ActionButtons'
import { TurnTimer } from './TurnTimer'
import { motion } from 'framer-motion'

type Props = {
  player: PlayerState
  isCurrentTurn: boolean
  isLocalPlayer: boolean
  phase: GamePhase
  turnTimeLimit: number
  turnStartedAt: number | null
  onAction: (action: any) => void
  rules: GameRules
  dealerUpcard: string | null
  x: number
  y: number
  angle: number
}

export function PlayerPosition({
  player, isCurrentTurn, isLocalPlayer, phase,
  turnTimeLimit, turnStartedAt, onAction, rules, dealerUpcard,
  x, y, angle,
}: Props) {
  const canAct = isCurrentTurn && isLocalPlayer && (phase === 'playing' || phase === 'insurance')

  return (
    <div
      className="absolute"
      style={{
        left: x,
        top: y,
        transform: `translate(-50%, -50%)`,
      }}
    >
      {/* Betting circle */}
      <motion.div
        animate={{
          boxShadow: isCurrentTurn
            ? '0 0 24px rgba(212,168,67,0.4), 0 0 0 2px rgba(212,168,67,0.3)'
            : '0 0 0 1px rgba(212,168,67,0.1)',
        }}
        className="w-24 h-24 rounded-full border-2 border-dashed border-gold/20 mx-auto mb-1"
      />

      {/* Cards */}
      <div className="flex justify-center" style={{ marginTop: '-64px' }}>
        {player.hands.length === 0 ? (
          <div className="w-12 h-18" />
        ) : (
          player.hands.map((hand, hi) => (
            <div key={hi} className={hi > 0 ? 'ml-2' : ''}>
              <CardHand hand={hand} handIndex={hi} activeHandIndex={player.activeHandIndex} />
            </div>
          ))
        )}
      </div>

      {/* Action buttons + timer */}
      {canAct && (
        <div className="flex justify-center mt-2">
          <div className="space-y-1.5">
            {turnTimeLimit > 0 && turnStartedAt && phase === 'playing' && (
              <TurnTimer
                timeLimit={turnTimeLimit}
                startedAt={turnStartedAt}
                onTimeout={() => onAction({ type: 'stand' })}
              />
            )}
            <ActionButtons
              hand={player.hands[player.activeHandIndex]}
              chips={player.chips}
              onAction={onAction}
              rules={rules}
              handIndex={player.activeHandIndex}
              playerHands={player.hands}
              phase={phase}
              dealerUpcard={dealerUpcard}
            />
          </div>
        </div>
      )}

      {/* Name + chips */}
      <div className="flex flex-col items-center mt-1">
        <div className="flex items-center gap-1">
          <PlayerAvatar name={player.name} seat={player.seat} size="sm" isActive={isCurrentTurn} />
          <span className="text-white text-xs font-medium">
            {player.name}
            {player.isActive === false && (
              <span className="text-gray-500 ml-1">(Away)</span>
            )}
          </span>
        </div>
        <span className="text-gold text-xs">{player.chips} chips</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/PlayerPosition.tsx
git commit -m "feat: reposition PlayerPosition for semicircle arc with felt-integrated layout"
```

---

### Task 6: DealerArea simplification — cards on felt, no container

**Files:**
- Modify: `src/components/Table/DealerArea.tsx`

- [ ] **Step 1: Simplify DealerArea**

Replace entire contents of `C:\Users\Faber\Projects\Blackjackson\src\components\Table\DealerArea.tsx`:

```typescript
import type { Card } from '../../engine/types'
import { evaluateHand } from '../../engine'
import { CardComponent } from './CardComponent'
import { PlayerAvatar } from '../Shared/PlayerAvatar'

type Props = {
  dealerHand: Card[]
  showHoleCard: boolean
  phase: string
}

export function DealerArea({ dealerHand, showHoleCard, phase }: Props) {
  const ev = dealerHand.length > 0 ? evaluateHand(showHoleCard ? dealerHand : [dealerHand[0]]) : null
  const dealerBJ = dealerHand.length === 2 && evaluateHand(dealerHand).isBlackjack

  return (
    <div className="flex flex-col items-center py-4">
      <div className="flex items-center gap-2 mb-1">
        <PlayerAvatar name="Dealer" seat={6} size="sm" />
        <span className="text-gold/60 text-xs font-semibold uppercase tracking-wider">Dealer</span>
      </div>

      {phase === 'insurance' && (
        <div className="bg-gold/20 text-gold text-xs font-bold px-2 py-0.5 rounded mb-1">
          INSURANCE
        </div>
      )}
      {(phase === 'settlement' || phase === 'round_end') && dealerBJ && (
        <div className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded mb-1">
          BLACKJACK
        </div>
      )}

      <div className="flex -space-x-3 mb-1">
        {dealerHand.map((card, i) => (
          <CardComponent
            key={i}
            card={card}
            faceDown={!showHoleCard && i === 1}
            size="lg"
            delay={i * 0.2}
          />
        ))}
        {dealerHand.length === 0 && (
          <div className="w-16 h-24 rounded-lg border border-dashed border-white/10 flex items-center justify-center">
            <span className="text-white/20 text-2xl">?</span>
          </div>
        )}
      </div>

      {ev && phase !== 'waiting' && phase !== 'betting' && phase !== 'dealing' && (
        <div className="text-base font-mono text-white bg-black/30 px-2 py-0.5 rounded">
          {showHoleCard ? ev.value : ev.soft ? `${ev.value - 10}/${ev.value}` : ev.value}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Table/DealerArea.tsx
git commit -m "feat: simplify DealerArea — cards on felt, smaller avatar, empty dealer placeholder"
```

---

### Task 7: TablePage — wire BettingArea, pass positions, simplify

**Files:**
- Modify: `src/components/Table/TablePage.tsx`

- [ ] **Step 1: Rewrite TablePage with BettingArea and arc positions**

Replace entire contents of `C:\Users\Faber\Projects\Blackjackson\src\components\Table\TablePage.tsx`:

```typescript
import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameSync } from '../../hooks/useGameSync'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { TableFelt, computePositions } from './TableFelt'
import { DealerArea } from './DealerArea'
import { PlayerPosition } from './PlayerPosition'
import { RoundResult } from './RoundResult'
import { BettingArea } from './BettingArea'
import { Button } from '../Shared/Button'
import { updateGameDoc } from '../../firebase/games'
import { dealInitialHands, allBetsPlaced, needsReshuffle, settleHands, settleInsurance, startNewRound } from '../../engine'

export function TablePage() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const { game, isHost, setRoomCode, reset: resetGame } = useGameStore()
  const { user } = useAuthStore()
  const { setView } = useUIStore()
  const { submitAction, submitBet } = useGameSync()
  const navigate = useNavigate()
  const [notFound, setNotFound] = useState(false)
  const [showReshuffle, setShowReshuffle] = useState(false)
  const prevRoundRef = useRef(game?.roundNumber)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 800, height: 600 })

  function goToLobby() {
    resetGame()
    setView('lobby')
    navigate('/')
  }

  useEffect(() => {
    if (paramCode) setRoomCode(paramCode.toUpperCase())
  }, [paramCode, setRoomCode])

  useEffect(() => {
    if (game === null && paramCode) {
      const timer = setTimeout(() => setNotFound(true), 3000)
      return () => clearTimeout(timer)
    } else {
      setNotFound(false)
    }
  }, [game, paramCode])

  useEffect(() => {
    if (game && prevRoundRef.current !== undefined && game.roundNumber !== prevRoundRef.current) {
      if (needsReshuffle(game.shoe, game.rules.decks)) {
        setShowReshuffle(true)
        const timer = setTimeout(() => setShowReshuffle(false), 2000)
        return () => clearTimeout(timer)
      }
    }
    prevRoundRef.current = game?.roundNumber
  }, [game])

  useEffect(() => {
    if (game?.gameOver) {
      const timer = setTimeout(() => goToLobby(), 5000)
      return () => clearTimeout(timer)
    }
  }, [game?.gameOver, navigate])

  useEffect(() => {
    function update() {
      if (containerRef.current) {
        setDims({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const positions = useMemo(
    () => computePositions(game?.players.length ?? 0, dims.width, dims.height),
    [game?.players.length, dims]
  )

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a0a00' }}>
        <div className="text-center space-y-4">
          <p className="text-gray-400">Game not found or has ended.</p>
          <Button onClick={goToLobby}>Back to Lobby</Button>
        </div>
      </div>
    )
  }

  if (!game) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a0a00' }}><p className="text-white text-lg">Loading game...</p></div>
  if (!user) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#1a0a00' }}><p className="text-white text-lg">Connecting...</p></div>

  const localPlayer = game.players.find((p) => p.id === user.uid)
  const isBetting = game.phase === 'betting'
  const allBet = allBetsPlaced(game)

  async function handleStartRound() {
    if (!game || !isHost) return
    let dealt = dealInitialHands(game)
    if (dealt.phase === 'settlement') {
      const settled = settleInsurance(settleHands(dealt))
      await updateGameDoc(game.id, { ...settled, shoe: settled.shoe as any, players: settled.players })
      return
    }
    await updateGameDoc(game.id, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
  }

  return (
    <TableFelt>
      <div ref={containerRef} className="h-full flex flex-col relative">
        {showReshuffle && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gold/90 text-gray-900 font-bold px-6 py-2 rounded-lg z-10 animate-pulse">
            Reshuffling...
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 relative z-10">
          <div className="text-gold text-sm font-mono">Round {game.roundNumber}</div>
          <div className="text-white/70 text-sm font-mono">Room: {game.id}</div>
          <div className="text-gray-400 text-sm">{game.players.length} players</div>
        </div>

        {/* Dealer */}
        <DealerArea
          dealerHand={game.dealerHand}
          showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
          phase={game.phase}
        />

        {/* Round Result */}
        <div className="relative z-10" style={{ marginTop: '-20px' }}>
          <RoundResult hands={localPlayer?.hands ?? []} visible={game.phase === 'round_end'} />
        </div>

        {/* Game Over */}
        {game.gameOver && (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="text-center space-y-4 bg-black/60 backdrop-blur rounded-2xl px-8 py-6">
              <p className="text-3xl font-black text-red-400">Game Over</p>
              <p className="text-gray-400">All players have busted out.</p>
              <Button onClick={goToLobby}>Back to Lobby</Button>
            </div>
          </div>
        )}

        {/* Players on arc */}
        {!game.gameOver && (
          <div className="flex-1 relative">
            {game.players.map((player, i) => (
              <PlayerPosition
                key={player.id}
                player={player}
                isCurrentTurn={game.currentTurn === player.seat}
                isLocalPlayer={player.id === user.uid}
                phase={game.phase}
                turnTimeLimit={game.turnTimeLimit}
                turnStartedAt={game.turnStartedAt}
                onAction={submitAction}
                rules={game.rules}
                dealerUpcard={game.dealerHand.length > 0 ? game.dealerHand[0].rank : null}
                x={positions[i]?.x ?? 0}
                y={positions[i]?.y ?? 0}
                angle={positions[i]?.angle ?? 0}
              />
            ))}
          </div>
        )}

        {/* Insurance waiting */}
        {game.phase === 'insurance' && isHost && (
          <div className="flex justify-center pb-2 relative z-10">
            <p className="text-gold text-sm">Waiting for insurance decisions...</p>
          </div>
        )}

        {/* Betting */}
        {isBetting && !allBet && localPlayer && (
          <BettingArea
            chips={localPlayer.chips}
            minBet={game.rules.minBet}
            maxBet={game.rules.maxBet}
            onPlaceBet={(amount) => submitBet(user.uid, amount)}
            alreadyBet={false}
          />
        )}

        {isBetting && localPlayer && localPlayer.hands[0]?.bet > 0 && (
          <BettingArea
            chips={localPlayer.chips}
            minBet={game.rules.minBet}
            maxBet={game.rules.maxBet}
            onPlaceBet={() => {}}
            alreadyBet={true}
            currentBetAmount={localPlayer.hands[0].bet}
          />
        )}

        {/* Deal / New Round buttons */}
        {isBetting && allBet && isHost && (
          <div className="flex justify-center pb-4 relative z-10">
            <Button onClick={handleStartRound}>Deal Cards</Button>
          </div>
        )}

        {game.phase === 'round_end' && !game.gameOver && isHost && (
          <div className="flex justify-center pb-4 relative z-10">
            <Button onClick={async () => {
              const next = startNewRound(game)
              await updateGameDoc(game.id, { ...next, shoe: next.shoe as any, players: next.players })
            }}>New Round</Button>
          </div>
        )}
      </div>
    </TableFelt>
  )
}
```

- [ ] **Step 2: Verify build and tests**

Run: `npx vitest run && npm run build 2>&1`
Expected: 51 tests pass, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/Table/TablePage.tsx
git commit -m "feat: wire BettingArea, arc positions; simplify TablePage layout"
```

---

### Task 8: Final verification and memory.md update

**Files:**
- Modify: `memory.md`

- [ ] **Step 1: Run full verification**

```bash
npx vitest run
npm run build
```
Expected: 51 tests pass, build succeeds.

- [ ] **Step 2: Update memory.md**

In `memory.md`, add after the "Additional Fixes" section:

```markdown
## Table Polish (2026-06-02)
- **Visual chips** — Inline SVG `Chip` component with 6 denominations (10/25/50/100/250/500), edge spots, molded rim look
- **Chip tray betting** — `BettingArea` with clickable chips accumulating bet, replaces text buttons
- **Semicircle layout** — Players positioned on arc with CSS-computed positions, dynamic based on player count
- **Felt rework** — Dark green with grain texture (inline SVG pattern), wide wood rim with gold inner ring
- **DealerArea** — Simplified, cards on felt directly, smaller avatar, empty state placeholder
- **PlayerPosition** — Cards and actions on the felt, betting circle marking, no container cards
- **ChipStack** — Now uses Chip component with proper denomination breakdown
```

- [ ] **Step 3: Commit**

```bash
git add memory.md && git commit -m "docs: update memory.md with table polish changes"
```

---

## Verification Checklist

```bash
npx vitest run        # 51 engine tests pass
npm run build         # Production build succeeds
```

Manual smoke test:
1. `npm run dev` → create game → see wood-rimmed felt with texture
2. Betting: click chip denominations → see accumulator grow → place bet
3. Deal cards → see cards on felt at player positions on arc
4. Play hand → action buttons beside cards
5. Round end → result overlay, new round
