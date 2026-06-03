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
import { ChipStack } from './ChipStack'
import { ActionButtons } from './ActionButtons'
import { TurnTimer } from './TurnTimer'
import { Button } from '../Shared/Button'
import { updateGameDoc } from '../../firebase/games'
import type { PlayerAction } from '../../engine'
import { dealInitialHands, allBetsPlaced, needsReshuffle, settleHands, settleInsurance, startNewRound } from '../../engine'

export function TablePage() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const { game, isHost, setRoomCode, reset: resetGame } = useGameStore()
  const { user } = useAuthStore()
  const { setView } = useUIStore()
  const { submitAction, submitBet, scheduleNewRound, addBetChip, clearBetChip } = useGameSync()
  const navigate = useNavigate()
  const [notFound, setNotFound] = useState(false)
  const [showReshuffle, setShowReshuffle] = useState(false)
  const prevRoundRef = useRef(game?.roundNumber)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 800, height: 500 })

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
  }, [game?.gameOver])

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

  const shoeOrigin = useMemo(
    () => ({ x: dims.width / 2, y: 10 }),
    [dims]
  )

  const dealIndices = useMemo(() => {
    if (!game || game.phase !== 'dealing') return new Map<string, { first: number; second: number }>()
    const map = new Map<string, { first: number; second: number }>()
    let idx = 0
    game.players.forEach((p) => {
      map.set(p.id, { first: idx++, second: 0 })
    })
    idx++
    game.players.forEach((p) => {
      const entry = map.get(p.id)!
      entry.second = idx++
    })
    return map
  }, [game?.players, game?.phase])

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
      scheduleNewRound()
      return
    }
    await updateGameDoc(game.id, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative" style={{ background: 'radial-gradient(ellipse at 50% 30%, #3b2210 0%, #1a0a00 60%, #0a0400 100%)' }}>
      {showReshuffle && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gold/90 text-gray-900 font-bold px-6 py-2 rounded-lg z-50 animate-pulse">
          Reshuffling...
        </div>
      )}

      {/* Dealer above the table */}
      <div className="relative z-20 pt-2 sm:pt-4">
        <DealerArea
          dealerHand={game.dealerHand}
          showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
          phase={game.phase}
          dealIndex={game.phase === 'dealing' ? game.players.length : null}
          originX={shoeOrigin.x - dims.width / 2}
          originY={shoeOrigin.y - 50}
        />
      </div>

      {/* Half-oval table */}
      <div className="relative -mt-2">
        <TableFelt>
          <div ref={containerRef} className="absolute inset-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-2 relative z-10">
              <div className="text-gold/70 text-xs font-mono">Round {game.roundNumber}</div>
              <div className="text-white/40 text-xs font-mono">{game.id}</div>
              <div className="text-white/25 text-xs">{game.players.length} players</div>
            </div>

            {/* Casino rules text */}
            <div className="flex justify-center py-1 relative z-10 pointer-events-none">
              <span className="text-gold/25 text-[10px] font-serif tracking-[0.15em] uppercase">
                Blackjack pays {game.rules.blackjackPayout}
                {game.rules.insurance ? ' \u00B7 Insurance pays 2:1' : ''}
                {game.rules.surrender !== 'none' ? ' \u00B7 Surrender available' : ''}
                {' \u00B7 Dealer '}{game.rules.dealerSoft17 === 'stand' ? 'stands' : 'hits'} on soft 17
              </span>
            </div>

            {/* Game over overlay */}
            {game.gameOver && (
              <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50">
                <div className="text-center space-y-4 bg-black/80 backdrop-blur rounded-2xl px-8 py-6">
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
                    x={positions[i]?.x ?? 0}
                    y={positions[i]?.y ?? 0}
                    angle={positions[i]?.angle ?? 0}
                    dealIndex={game.phase === 'dealing' ? (dealIndices.get(player.id) ?? null) : null}
                    originX={shoeOrigin.x - (positions[i]?.x ?? 0)}
                    originY={shoeOrigin.y - (positions[i]?.y ?? 0)}
                  />
                ))}

                {/* Pending bet chips on felt */}
                {game.phase === 'betting' &&
                  game.players.map((player, i) => {
                    const pending = game.pendingBets?.[player.id] ?? 0
                    if (pending <= 0) return null
                    return (
                      <div
                        key={`chips-${player.id}`}
                        className="absolute"
                        style={{
                          left: positions[i]?.x ?? 0,
                          top: (positions[i]?.y ?? 0) + 30,
                          transform: 'translate(-50%, -50%)',
                          zIndex: 5,
                        }}
                      >
                        <ChipStack amount={pending} size="sm" />
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Insurance */}
            {game.phase === 'insurance' && isHost && (
              <div className="flex justify-center pb-2 relative z-10">
                <p className="text-gold text-sm">Waiting for insurance decisions...</p>
              </div>
            )}
          </div>
        </TableFelt>
      </div>

      {/* Player info strip */}
      {!game.gameOver && (
        <div
          className="relative mx-auto -mt-1"
          style={{ width: dims.width, minHeight: 32 }}
        >
          {game.players.map((player, i) => (
            <div
              key={player.id}
              className="absolute flex flex-col items-center"
              style={{
                left: positions[i]?.x ?? '50%',
                transform: 'translateX(-50%)',
              }}
            >
              <span className="text-white/80 text-xs font-medium whitespace-nowrap">
                {player.name}
                {player.isActive === false && (
                  <span className="text-gray-500 ml-1">(Away)</span>
                )}
              </span>
              <span className="text-gold text-xs">{player.chips} chips</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons strip */}
      {!game.gameOver && (() => {
        const lp = localPlayer
        if (!lp) return null
        const lpIdx = game.players.findIndex(p => p.id === lp.id)
        const canAct = game.currentTurn === lp.seat && (game.phase === 'playing' || game.phase === 'insurance')
        if (!canAct) return null
        return (
          <div
            className="relative mx-auto mt-2"
            style={{ width: dims.width }}
          >
            <div
              className="flex"
              style={{
                paddingLeft: positions[lpIdx]?.x ?? '50%',
              }}
            >
              <div className="space-y-1.5 -translate-x-1/2">
                {game.turnTimeLimit > 0 && game.turnStartedAt && game.phase === 'playing' && (
                  <TurnTimer
                    timeLimit={game.turnTimeLimit}
                    startedAt={game.turnStartedAt}
                    onTimeout={() => submitAction({ type: 'stand' } as PlayerAction)}
                  />
                )}
                <ActionButtons
                  hand={lp.hands[lp.activeHandIndex]}
                  chips={lp.chips}
                  onAction={submitAction}
                  rules={game.rules}
                  handIndex={lp.activeHandIndex}
                  playerHands={lp.hands}
                  phase={game.phase}
                  dealerUpcard={game.dealerHand.length > 0 ? game.dealerHand[0].rank : null}
                />
              </div>
            </div>
          </div>
        )
      })()}

      {/* Round result */}
      <div className="relative z-10 -mt-4">
        <RoundResult hands={localPlayer?.hands ?? []} visible={game.phase === 'round_end'} />
      </div>

      {/* Betting area below the table */}
      {isBetting && !allBet && localPlayer && !localPlayer.hands[0]?.bet && (
        <BettingArea
          chips={localPlayer.chips}
          minBet={game.rules.minBet}
          maxBet={game.rules.maxBet}
          pendingBet={game.pendingBets?.[user.uid] ?? 0}
          onAddChip={addBetChip}
          onClear={clearBetChip}
          onPlaceBet={(amount) => submitBet(user.uid, amount)}
          alreadyBet={false}
        />
      )}

      {isBetting && localPlayer && localPlayer.hands[0]?.bet > 0 && (
        <BettingArea
          chips={localPlayer.chips}
          minBet={game.rules.minBet}
          maxBet={game.rules.maxBet}
          pendingBet={0}
          onAddChip={() => {}}
          onClear={() => {}}
          onPlaceBet={() => {}}
          alreadyBet={true}
          currentBetAmount={localPlayer.hands[0].bet}
        />
      )}

      {/* Host buttons below table */}
      <div className="flex items-center justify-center gap-4 py-3">
        {isBetting && allBet && isHost && (
          <Button onClick={handleStartRound}>Deal Cards</Button>
        )}

        {game.phase === 'round_end' && !game.gameOver && isHost && (
          <Button onClick={async () => {
            const next = startNewRound(game)
            await updateGameDoc(game.id, { ...next, shoe: next.shoe as any, players: next.players })
          }}>New Round</Button>
        )}
      </div>
    </div>
  )
}
