import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../stores/gameStore'
import { updateGameDoc } from '../firebase/games'
import type { MusicState } from '../engine/types'

export function useMusic(roomCode: string | null, isHost: boolean) {
  const music = useGameStore((s) => s.game?.music)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const volumeRef = useRef(0.5)
  const driftIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const localTimeRef = useRef(0)

  const updateMusic = useCallback(
    async (patch: Partial<MusicState>) => {
      if (!roomCode || !isHost) return
      await updateGameDoc(roomCode, { music: patch } as any)
    },
    [roomCode, isHost],
  )

  // Playlist audio playback
  useEffect(() => {
    if (!music || music.source !== 'playlist') {
      audioRef.current?.pause()
      audioRef.current = null
      return
    }

    if (!audioRef.current || audioRef.current.src !== music.url) {
      audioRef.current = new Audio(music.url)
      audioRef.current.loop = true
      audioRef.current.volume = volumeRef.current
    }

    const audio = audioRef.current
    if (music.playing) {
      audio.currentTime = music.currentTime
      audio.play().catch(() => {})
    } else {
      audio.pause()
    }

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [music?.url, music?.source, music?.playing, music?.currentTime])

  // Drift correction for playlist
  useEffect(() => {
    if (driftIntervalRef.current) clearInterval(driftIntervalRef.current)
    if (!music || music.source !== 'playlist' || !music.playing) return

    driftIntervalRef.current = setInterval(() => {
      const expected = music.currentTime + (Date.now() - music.lastCommandAt) / 1000
      const audio = audioRef.current
      if (audio && Math.abs(audio.currentTime - expected) > 2) {
        audio.currentTime = expected
      }
    }, 5000)

    return () => {
      if (driftIntervalRef.current) clearInterval(driftIntervalRef.current)
    }
  }, [music?.lastCommandAt, music?.currentTime, music?.source, music?.playing])

  // Host: periodically sync currentTime to Firestore for drift correction
  useEffect(() => {
    if (!isHost || !music?.playing) return
    const interval = setInterval(() => {
      updateMusic({ currentTime: localTimeRef.current, lastCommandAt: Date.now() })
    }, 10000)
    return () => clearInterval(interval)
  }, [isHost, music?.playing, updateMusic])

  const setVolume = useCallback((vol: number) => {
    volumeRef.current = vol
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }, [])

  const onTimeUpdate = useCallback(
    (time: number) => {
      localTimeRef.current = time
    },
    [],
  )

  return { music, updateMusic, setVolume, onTimeUpdate }
}
