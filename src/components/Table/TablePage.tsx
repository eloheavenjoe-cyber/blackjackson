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
  const { submitAction, submitBet, scheduleNewRound } = useGameSync()
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
    <TableFelt>
      <div ref={containerRef} className="h-full flex flex-col relative">
        {showReshuffle && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gold/90 text-gray-900 font-bold px-6 py-2 rounded-lg z-10 animate-pulse">
            Reshuffling...
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-3 relative z-10">
          <div className="text-gold text-sm font-mono">Round {game.roundNumber}</div>
          <div className="text-white/70 text-sm font-mono">Room: {game.id}</div>
          <div className="text-gray-400 text-sm">{game.players.length} players</div>
        </div>

        <DealerArea
          dealerHand={game.dealerHand}
          showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
          phase={game.phase}
        />

        <div className="relative z-10" style={{ marginTop: '-20px' }}>
          <RoundResult hands={localPlayer?.hands ?? []} visible={game.phase === 'round_end'} />
        </div>

        {game.gameOver && (
          <div className="flex-1 flex items-center justify-center relative z-10">
            <div className="text-center space-y-4 bg-black/60 backdrop-blur rounded-2xl px-8 py-6">
              <p className="text-3xl font-black text-red-400">Game Over</p>
              <p className="text-gray-400">All players have busted out.</p>
              <Button onClick={goToLobby}>Back to Lobby</Button>
            </div>
          </div>
        )}

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

        {game.phase === 'insurance' && isHost && (
          <div className="flex justify-center pb-2 relative z-10">
            <p className="text-gold text-sm">Waiting for insurance decisions...</p>
          </div>
        )}

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

        {isBetting && allBet && isHost && (
          <div className="absolute bottom-4 right-4 z-20">
            <Button onClick={handleStartRound}>Deal Cards</Button>
          </div>
        )}

        {game.phase === 'round_end' && !game.gameOver && isHost && (
          <div className="absolute bottom-4 right-4 z-20">
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
