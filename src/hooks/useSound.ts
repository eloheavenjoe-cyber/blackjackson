import { useCallback, useRef } from 'react'
import { useUIStore } from '../stores/uiStore'

type SoundType = 'deal' | 'chip' | 'win' | 'lose' | 'blackjack' | 'tick'

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const { soundEnabled } = useUIStore()

  const getCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext()
    return ctxRef.current
  }, [])

  const play = useCallback(
    (type: SoundType) => {
      if (!soundEnabled) return
      const ctx = getCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.value = 0.1

      switch (type) {
        case 'deal':
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(800, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
          osc.start(); osc.stop(ctx.currentTime + 0.1)
          break
        case 'chip':
          osc.type = 'square'
          osc.frequency.setValueAtTime(1200, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
          osc.start(); osc.stop(ctx.currentTime + 0.05)
          break
        case 'win':
          osc.type = 'sine'
          osc.frequency.setValueAtTime(523, ctx.currentTime)
          osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
          osc.start(); osc.stop(ctx.currentTime + 0.4)
          break
        case 'lose':
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(300, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
          osc.start(); osc.stop(ctx.currentTime + 0.3)
          break
        case 'blackjack':
          osc.type = 'sine'
          osc.frequency.setValueAtTime(523, ctx.currentTime)
          osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
          osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
          osc.frequency.setValueAtTime(1047, ctx.currentTime + 0.3)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6)
          osc.start(); osc.stop(ctx.currentTime + 0.6)
          break
        case 'tick':
          osc.type = 'sine'
          osc.frequency.setValueAtTime(1000, ctx.currentTime)
          gain.gain.value = 0.05
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03)
          osc.start(); osc.stop(ctx.currentTime + 0.03)
          break
      }
    },
    [soundEnabled, getCtx]
  )

  return { play }
}
