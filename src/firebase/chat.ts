import {
  collection, addDoc, orderBy, query,
  onSnapshot, serverTimestamp, limit,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './config'
import type { ChatMessage } from '../engine/types'

const GAMES = 'games'

export function chatCollection(gameId: string) {
  return collection(db, GAMES, gameId.toUpperCase(), 'chat')
}

export async function addChatMessage(
  gameId: string,
  message: Omit<ChatMessage, 'timestamp'>,
): Promise<void> {
  await addDoc(chatCollection(gameId), {
    ...message,
    timestamp: serverTimestamp(),
  })
}

export function subscribeToChat(
  gameId: string,
  callback: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(
    chatCollection(gameId),
    orderBy('timestamp', 'asc'),
    limit(200),
  )
  return onSnapshot(q, (snapshot) => {
    const messages: ChatMessage[] = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      messages.push({
        playerId: data.playerId,
        playerName: data.playerName,
        text: data.text,
        type: data.type,
        timestamp: data.timestamp?.toMillis?.() ?? Date.now(),
      })
    })
    callback(messages)
  })
}
