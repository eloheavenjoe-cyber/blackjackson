import { useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { subscribeToChat, addChatMessage } from '../firebase/chat'
import { submitTipIntent } from '../firebase/tips'
import type { PlayerState } from '../engine/types'

export function useChat(roomCode: string | null) {
  const { user, displayName } = useAuthStore()
  const { setMessages, reset } = useChatStore()

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeToChat(roomCode, (messages) => {
      setMessages(messages)
    })
    return () => {
      unsub()
      reset()
    }
  }, [roomCode, setMessages, reset])

  const sendMessage = useCallback(
    (text: string) => {
      if (!roomCode || !user) return
      addChatMessage(roomCode, {
        playerId: user.uid,
        playerName: displayName || 'Player',
        text,
        type: 'message',
      })
    },
    [roomCode, user, displayName],
  )

  const sendEmoji = useCallback(
    (emoji: string) => {
      if (!roomCode || !user) return
      addChatMessage(roomCode, {
        playerId: user.uid,
        playerName: displayName || 'Player',
        text: emoji,
        type: 'emoji',
      })
    },
    [roomCode, user, displayName],
  )

  const sendTip = useCallback(
    (recipientId: string, amount: number, players: PlayerState[]): string | null => {
      if (!roomCode || !user) return 'Not connected'
      const sender = players.find((p) => p.id === user.uid)
      if (!sender) return 'Sender not found'
      if (amount > sender.chips) return 'Insufficient chips'
      if (amount <= 0) return 'Invalid amount'
      if (recipientId === user.uid) return 'Cannot tip yourself'

      submitTipIntent(roomCode, user.uid, recipientId, amount)
      addChatMessage(roomCode, {
        playerId: user.uid,
        playerName: displayName || 'Player',
        text: String(amount),
        type: 'tip',
      })
      return null
    },
    [roomCode, user, displayName],
  )

  return { sendMessage, sendEmoji, sendTip }
}
