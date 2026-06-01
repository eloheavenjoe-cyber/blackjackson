import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useGameSync } from '../../hooks/useGameSync'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { TableFelt } from './TableFelt'
import { DealerArea } from './DealerArea'
import { PlayerPosition } from './PlayerPosition'
import { RoundResult } from './RoundResult'
import { Button } from '../Shared/Button'
import { updateGameDoc } from '../../firebase/games'
import { dealInitialHands, allBetsPlaced, startNewRound } from '../../engine'

export function TablePage() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const { game, isHost, setRoomCode } = useGameStore()
  const { user } = useAuthStore()
  const { submitAction, submitBet } = useGameSync()

  useEffect(() => {
    if (paramCode) setRoomCode(paramCode.toUpperCase())
  }, [paramCode, setRoomCode])

  if (!game) return <div className="text-white p-8 text-center">Loading game...</div>
  if (!user) return <div className="text-white p-8 text-center">Connecting...</div>

  const localPlayer = game.players.find((p) => p.id === user.uid)
  const isBetting = game.phase === 'betting'
  const allBet = allBetsPlaced(game)

  async function handleStartRound() {
    if (!game || !isHost) return
    const dealt = dealInitialHands(game)
    await updateGameDoc(game.id, { ...dealt, shoe: dealt.shoe as any, players: dealt.players })
  }

  return (
    <TableFelt>
      <div className="h-full flex flex-col">
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
            />
          ))}
        </div>

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

        {game.phase === 'round_end' && isHost && (
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
