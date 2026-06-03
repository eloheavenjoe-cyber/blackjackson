import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

const GAMES = 'games'

export function tipIntentsCollection(gameId: string) {
  return collection(db, GAMES, gameId.toUpperCase(), 'tips')
}

export async function submitTipIntent(
  gameId: string,
  fromId: string,
  toPlayerId: string,
  amount: number,
): Promise<void> {
  await addDoc(tipIntentsCollection(gameId), {
    fromId,
    toPlayerId,
    amount,
    timestamp: serverTimestamp(),
  })
}
