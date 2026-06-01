import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from './config'

export async function signIn(): Promise<User> {
  const cred = await signInAnonymously(auth)
  return cred.user
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}
