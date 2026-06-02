import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGameSync } from '../../hooks/useGameSync'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { TableFelt } from './TableFelt'
import { DealerArea } from './DealerArea'
import { PlayerPosition } from './PlayerPosition'
import { RoundResult } from './RoundResult'
import { Button } from '../Shared/Button'
import { updateGameDoc } from '../../firebase/games'
import { dealInitialHands, allBetsPlaced, needsReshuffle, settleHands, settleInsurance, startNewRound } from '../../engine'

export function TablePage() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const { game, isHost, setRoomCode } = useGameStore()
  const { user } = useAuthStore()
  const { submitAction, submitBet } = useGameSync()
  const navigate = useNavigate()
  const [notFound, setNotFound] = useState(false)
  const [showReshuffle, setShowReshuffle] = useState(false)
  const prevRoundRef = useRef(game?.roundNumber)

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
      const timer = setTimeout(() => navigate('/'), 5000)
      return () => clearTimeout(timer)
    }
  }, [game?.gameOver, navigate])

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-400">Game not found or has ended.</p>
          <Button onClick={() => navigate('/')}>Back to Lobby</Button>
        </div>
      </div>
    )
  }

  if (!game) return <div className="min-h-screen flex items-center justify-center"><p className="text-white text-lg">Loading game...</p></div>
  if (!user) return <div className="min-h-screen flex items-center justify-center"><p className="text-white text-lg">Connecting...</p></div>

  const localPlayer = game.players.find((p) => p.id === user.uid)
  const isBetting = game.phase === 'betting'
  const allBet = allBetsPlaced(game)
  const dealerUpcard = game.dealerHand.length > 0 ? game.dealerHand[0].rank : null

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
      <div className="h-full flex flex-col">
        {showReshuffle && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gold/90 text-gray-900 font-bold px-6 py-2 rounded-lg z-10 animate-pulse">
            Reshuffling...
          </div>
        )}

        <div className="flex items-center justify-between px-6 py-3">
          <div className="text-gold text-sm font-mono">Round {game.roundNumber}</div>
          <div className="text-white text-sm">Room: {game.id}</div>
          <div className="text-gray-400 text-sm">{game.players.length} players</div>
        </div>

        <DealerArea
          dealerHand={game.dealerHand}
          showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
          phase={game.phase}
        />

        <RoundResult hands={localPlayer?.hands ?? []} visible={game.phase === 'round_end'} />

        {game.gameOver && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-3xl font-black text-red-400">Game Over</p>
              <p className="text-gray-400">All players have busted out.</p>
              <Button onClick={() => navigate('/')}>Back to Lobby</Button>
            </div>
          </div>
        )}

        {!game.gameOver && (
          <div className="flex-1 flex items-end justify-center gap-3 px-4 pb-6 flex-wrap">
            {game.players.map((player) => (
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
                dealerUpcard={dealerUpcard}
              />
            ))}
          </div>
        )}

        {game.phase === 'insurance' && isHost && (
          <div className="flex justify-center pb-4">
            <p className="text-gold text-sm">Waiting for insurance decisions...</p>
          </div>
        )}

        {isBetting && !allBet && localPlayer && (
          <div className="flex justify-center gap-3 pb-4">
            {[10, 25, 50, 100, 250, 500].filter((a) => a <= localPlayer.chips && a >= game.rules.minBet && a <= game.rules.maxBet).map((amount) => (
              <button
                key={amount}
                onClick={() => submitBet(user.uid, amount)}
                className="px-3 py-2 bg-gold/80 hover:bg-gold text-gray-900 font-bold rounded-lg cursor-pointer text-sm"
              >
                {amount}
              </button>
            ))}
          </div>
        )}

        {isBetting && allBet && isHost && (
          <div className="flex justify-center pb-4">
            <Button onClick={handleStartRound}>Deal Cards</Button>
          </div>
        )}

        {game.phase === 'round_end' && !game.gameOver && isHost && (
          <div className="flex justify-center pb-4">
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
