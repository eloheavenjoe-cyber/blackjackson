import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameSync } from '../../hooks/useGameSync'
import { useGameStore } from '../../stores/gameStore'
import { useAuthStore } from '../../stores/authStore'
import { useUIStore } from '../../stores/uiStore'
import { useSound } from '../../hooks/useSound'
import { useChat } from '../../hooks/useChat'
import { ChatPanel } from '../Chat/ChatPanel'
import { EmojiFloat } from '../Chat/EmojiFloat'
import { ChatToggle } from '../Chat/ChatToggle'
import { useChatStore } from '../../stores/chatStore'
import { useMusic } from '../../hooks/useMusic'
import { MusicPanel } from '../Music/MusicPanel'
import { MusicToggle } from '../Music/MusicToggle'
import { TableFelt, computePositions } from './TableFelt'
import { DealerArea } from './DealerArea'
import { PlayerPosition } from './PlayerPosition'
import { RoundResult } from './RoundResult'
import { BettingArea } from './BettingArea'
import { ChipStack } from './ChipStack'
import { ActionButtons } from './ActionButtons'
import { TurnTimer } from './TurnTimer'
import { DealerShoe, shoeOrigin } from './Shoe'
import { DiscardPile } from './DiscardPile'
import { LimitPlaque } from './LimitPlaque'
import { Button } from '../Shared/Button'
import { updateGameDoc } from '../../firebase/games'
import type { PlayerAction } from '../../engine'
import { dealInitialHands, allBetsPlaced, needsReshuffle, settleHands, settleInsurance, startNewRound, evaluateHand } from '../../engine'

export function TablePage() {
  const { roomCode: paramCode } = useParams<{ roomCode: string }>()
  const { game, isHost, setRoomCode, reset: resetGame } = useGameStore()
  const { user } = useAuthStore()
  const { setView } = useUIStore()
  const { submitAction, submitBet, scheduleNewRound, addBetChip, clearBetChip, quickBet } = useGameSync()
  const { play } = useSound()
  const { sendMessage, sendEmoji, sendTip } = useChat(game?.id ?? null)
  const { updateMusic, setVolume, onTimeUpdate } = useMusic(game?.id ?? null, isHost)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [isMusicOpen, setIsMusicOpen] = useState(false)
  const navigate = useNavigate()
  const [notFound, setNotFound] = useState(false)
  const [showReshuffle, setShowReshuffle] = useState(false)
  const [showNoMoreBets, setShowNoMoreBets] = useState(false)
  const [showRoundIntro, setShowRoundIntro] = useState(false)
  const [emojiFloats, setEmojiFloats] = useState<{ id: string; emoji: string; x: number; y: number }[]>([])
  const prevRoundRef = useRef(game?.roundNumber)
  const prevPhaseRef = useRef(game?.phase)
  const prevTurnRef = useRef(game?.currentTurn)
  const prevMessageCountRef = useRef(0)
  const processedEmojiIdsRef = useRef<Set<string>>(new Set())
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
    if (game && prevPhaseRef.current !== game.phase) {
      if (prevPhaseRef.current === 'betting' && game.phase === 'dealing') {
        setShowNoMoreBets(true)
        const timer = setTimeout(() => setShowNoMoreBets(false), 1000)
        play('deal')
        prevPhaseRef.current = game.phase
        return () => clearTimeout(timer)
      }
      if (game.phase === 'round_end' && localPlayer) {
        for (const hand of localPlayer.hands) {
          if (hand.result === 'blackjack') play('blackjack')
          else if (hand.result === 'win') play('win')
          else if (hand.result === 'lose') play(evaluateHand(hand.cards).isBust ? 'bust' : 'lose')
        }
      }
    }
    prevPhaseRef.current = game?.phase
  }, [game?.phase])

  useEffect(() => {
    if (game && prevRoundRef.current !== undefined && game.roundNumber !== prevRoundRef.current) {
      setShowRoundIntro(true)
      const introTimer = setTimeout(() => setShowRoundIntro(false), 1800)
      if (needsReshuffle(game.shoe, game.rules.decks)) {
        setShowReshuffle(true)
        play('shuffle')
        const shuffleTimer = setTimeout(() => setShowReshuffle(false), 2000)
        return () => { clearTimeout(introTimer); clearTimeout(shuffleTimer) }
      }
      return () => clearTimeout(introTimer)
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
    if (game && user && prevTurnRef.current !== game.currentTurn && game.currentTurn >= 0) {
      const playerAtTurn = game.players[game.currentTurn]
      if (playerAtTurn?.id === user.uid) {
        play('turn')
      }
    }
    prevTurnRef.current = game?.currentTurn
  }, [game?.currentTurn])

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

  const shoeOriginPos = useMemo(
    () => shoeOrigin(dims.width, dims.height),
    [dims]
  )

  useEffect(() => {
    if (!game) return
    const unsub = useChatStore.subscribe((state) => {
      const newMessages = state.messages.slice(prevMessageCountRef.current)
      prevMessageCountRef.current = state.messages.length
      for (const msg of newMessages) {
        if (msg.type !== 'emoji') continue
        const id = `${msg.playerId}-${msg.timestamp}`
        if (processedEmojiIdsRef.current.has(id)) continue
        processedEmojiIdsRef.current.add(id)
        const playerIdx = game.players.findIndex((p) => p.id === msg.playerId)
        if (playerIdx === -1) continue
        const pos = positions[playerIdx]
        if (!pos) continue
        const rect = containerRef.current?.getBoundingClientRect()
        const offsetX = rect?.left ?? 0
        const offsetY = rect?.top ?? 0
        setEmojiFloats((prev) => [...prev, { id, emoji: msg.text, x: pos.x + offsetX, y: pos.y + offsetY }])
      }
    })
    return () => unsub()
  }, [game, positions])

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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="flex items-center gap-3 bg-gold/95 text-gray-900 font-bold px-6 py-2 rounded-lg shadow-2xl"
          >
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 0.3 }}
              className="text-lg"
            >
              {'\u{1F0A0}'}
            </motion.span>
            <span>Reshuffling</span>
            <motion.span
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 0.3, delay: 0.15 }}
              className="text-lg"
            >
              {'\u{1F0A0}'}
            </motion.span>
          </motion.div>
        </div>
      )}

      {/* Dealer above the table */}
      <div className="relative z-20 pt-2 sm:pt-4">
        <DealerArea
          dealerHand={game.dealerHand}
          showHoleCard={game.phase === 'dealer' || game.phase === 'settlement' || game.phase === 'round_end'}
          phase={game.phase}
          dealIndex={game.phase === 'dealing' ? game.players.length : null}
            originX={shoeOriginPos.x - dims.width / 2}
            originY={shoeOriginPos.y - 50}
          persona={game.dealerPersona}
        />
      </div>

      {/* Half-oval table */}
      <div className="relative -mt-2">
        <LimitPlaque minBet={game.rules.minBet} maxBet={game.rules.maxBet} />
        <TableFelt>
          <div ref={containerRef} className="absolute inset-0 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-2 relative z-10">
              <div className="text-gold/70 text-xs font-mono">Round {game.roundNumber}</div>
              <div className="text-white/40 text-xs font-mono">{game.id}</div>
              <div className="text-white/25 text-xs">{game.players.length} players</div>
            </div>

            {/* Round intro */}
            <AnimatePresence>
              {showRoundIntro && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 1.1, y: -10 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
                >
                  <div className="text-center">
                    <motion.span
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="block text-gold/40 text-xs font-serif tracking-[0.3em] uppercase mb-1"
                    >
                      Round
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, scale: 0, rotate: -5 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 150, damping: 12 }}
                      className="block text-6xl font-black text-gold/30"
                    >
                      {game.roundNumber}
                    </motion.span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dealer shoe */}
            <DealerShoe containerWidth={dims.width} containerHeight={dims.height} />

            {/* Discard pile */}
            <DiscardPile containerWidth={dims.width} containerHeight={dims.height} />

            {/* Casino rules text */}
            <div className="absolute left-0 right-0 flex justify-center pointer-events-none z-[1]" style={{ top: '14%' }}>
              <div className="flex flex-col items-center gap-2">
                <span
                  className="text-gold/55 text-[13px] font-bold font-serif tracking-[0.25em] uppercase leading-none"
                  style={{ textShadow: '0 0 6px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.6)' }}
                >
                  Blackjack pays {game.rules.blackjackPayout.replace(':', ' to ')}
                </span>
                <span
                  className="text-gold/35 text-[10px] font-serif tracking-[0.2em] uppercase leading-none"
                  style={{ textShadow: '0 0 5px rgba(0,0,0,0.7), 0 0 2px rgba(0,0,0,0.5)' }}
                >
                  Dealer must {game.rules.dealerSoft17 === 'stand' ? 'stand on 17' : 'hit soft 17'} and draw to 16
                </span>
                {game.rules.insurance && (
                  <span
                    className="text-gold/25 text-[9px] font-serif tracking-[0.15em] uppercase leading-none"
                    style={{ textShadow: '0 0 4px rgba(0,0,0,0.6), 0 0 2px rgba(0,0,0,0.4)' }}
                  >
                    Insurance pays 2 to 1
                  </span>
                )}
              </div>
            </div>

            {/* No More Bets sweep */}
            <AnimatePresence>
              {showNoMoreBets && (
                <motion.div
                  initial={{ y: '-100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                  className="absolute inset-x-0 top-[30%] z-20 flex justify-center pointer-events-none"
                >
                  <div className="bg-red-900/90 backdrop-blur px-10 py-3 rounded-lg border border-red-500/30 shadow-2xl">
                    <span className="text-gold text-xl font-black tracking-[0.3em] uppercase">No More Bets</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                    betAmount={game.phase === 'betting' ? (game.pendingBets?.[player.id] ?? player.hands[0]?.bet ?? 0) : (player.hands[0]?.bet ?? 0)}
                    dealIndex={game.phase === 'dealing' ? (dealIndices.get(player.id) ?? null) : null}
                    originX={shoeOriginPos.x - (positions[i]?.x ?? 0)}
                    originY={shoeOriginPos.y - (positions[i]?.y ?? 0)}
                  />
                ))}

                {/* Pending + committed bet chips on felt */}
                {game.phase === 'betting' &&
                  game.players.map((player, i) => {
                    const committed = player.hands[0]?.bet ?? 0
                    const pending = game.pendingBets?.[player.id] ?? 0
                    const amount = pending > 0 ? pending : committed
                    if (amount <= 0) return null
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
                        <ChipStack amount={amount} size="sm" />
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
              <motion.span
                key={player.chips}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-gold text-xs"
              >
                {player.chips} chips
              </motion.span>
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
          onQuickBet={quickBet}
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
          onQuickBet={() => {}}
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

      {!game.gameOver && (
        <ChatPanel
          roomCode={game.id}
          players={game.players}
          onSendMessage={sendMessage}
          onSendEmoji={sendEmoji}
          onSendTip={(recipientId, amount) => {
            if (!game) return 'Not connected'
            return sendTip(recipientId, amount, game.players)
          }}
        />
      )}

      {!game.gameOver && <ChatToggle onClick={() => { console.log('[ChatToggle] clicked, isOpen before:', useChatStore.getState().isOpen); useChatStore.getState().setIsOpen(true); console.log('[ChatToggle] isOpen after:', useChatStore.getState().isOpen) }} />}

      <MusicToggle
        isPlaying={!!(game?.music?.playing)}
        onClick={() => { console.log('[MusicToggle] clicked, isMusicOpen before:', isMusicOpen); setIsMusicOpen(true); console.log('[MusicToggle] isMusicOpen after:', true) }}
      />

      {!game.gameOver && (
        <MusicPanel
          roomCode={game?.id ?? ''}
          isHost={isHost}
          music={game?.music}
          volume={musicVolume}
          isOpen={isMusicOpen}
          onClose={() => setIsMusicOpen(false)}
          onCommand={updateMusic}
          onVolumeChange={(v) => { setMusicVolume(v); setVolume(v) }}
          onTimeUpdate={onTimeUpdate}
        />
      )}

      {emojiFloats.map((ef) => (
        <EmojiFloat
          key={ef.id}
          emoji={ef.emoji}
          x={ef.x}
          y={ef.y}
          onComplete={() => setEmojiFloats((prev) => prev.filter((e) => e.id !== ef.id))}
        />
      ))}
    </div>
  )
}
