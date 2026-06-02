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
}

export function PlayerPosition({ player, isCurrentTurn, isLocalPlayer, phase, turnTimeLimit, turnStartedAt, onAction, rules, dealerUpcard }: Props) {
  const canAct = isCurrentTurn && isLocalPlayer && (phase === 'playing' || phase === 'insurance')

  return (
    <motion.div
      animate={{
        scale: isCurrentTurn ? 1.02 : 1,
        boxShadow: isCurrentTurn ? '0 0 20px rgba(212,168,67,0.3)' : '0 0 0px rgba(0,0,0,0)',
      }}
      className="relative bg-black/20 rounded-xl p-3 border border-white/5 min-w-[180px]"
    >
      <div className="flex items-center gap-2 mb-2">
        <PlayerAvatar name={player.name} seat={player.seat} isActive={isCurrentTurn} />
        <div>
          <span className="text-white text-sm font-medium block">
            {player.name}
            {player.isActive === false && (
              <span className="text-gray-500 text-xs ml-1">(Away)</span>
            )}
          </span>
          <span className="text-gold text-xs">{player.chips} chips</span>
        </div>
      </div>
      {player.hands.map((hand, hi) => (
        <CardHand key={hi} hand={hand} handIndex={hi} activeHandIndex={player.activeHandIndex} />
      ))}
      {canAct && (
        <div className="mt-3 space-y-2">
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
      )}
    </motion.div>
  )
}
