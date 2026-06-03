import { useCallback, useEffect, useRef } from 'react'
import { useUIStore } from '../stores/uiStore'

type SoundType = 'deal' | 'chip' | 'win' | 'lose' | 'blackjack' | 'bust' | 'turn' | 'shuffle' | 'tick'

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const { soundEnabled, volume } = useUIStore()

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
      masterRef.current = ctxRef.current.createGain()
      masterRef.current.connect(ctxRef.current.destination)
    }
    return ctxRef.current
  }, [])

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.gain.value = soundEnabled ? volume : 0
    }
  }, [soundEnabled, volume])

  const play = useCallback(
    (type: SoundType) => {
      const ctx = getCtx()
      const master = masterRef.current!
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(master)
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
        case 'bust': {
          const osc2 = ctx.createOscillator()
          const gain2 = ctx.createGain()
          osc2.connect(gain2)
          gain2.connect(master)
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(200, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.4)
          gain.gain.setValueAtTime(0.12, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45)
          osc2.type = 'triangle'
          osc2.frequency.setValueAtTime(80, ctx.currentTime)
          osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.35)
          gain2.gain.setValueAtTime(0.08, ctx.currentTime)
          gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
          osc.start(); osc.stop(ctx.currentTime + 0.45)
          osc2.start(); osc2.stop(ctx.currentTime + 0.4)
          break
        }
        case 'turn': {
          osc.type = 'sine'
          osc.frequency.setValueAtTime(880, ctx.currentTime)
          osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.06)
          gain.gain.setValueAtTime(0.06, ctx.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
          osc.start(); osc.stop(ctx.currentTime + 0.15)
          break
        }
        case 'shuffle': {
          for (let i = 0; i < 6; i++) {
            const oscN = ctx.createOscillator()
            const gainN = ctx.createGain()
            oscN.connect(gainN)
            gainN.connect(master)
            oscN.type = 'triangle'
            const t = ctx.currentTime + i * 0.08 + Math.random() * 0.04
            oscN.frequency.setValueAtTime(600 + Math.random() * 800, t)
            gainN.gain.setValueAtTime(0.06, t)
            gainN.gain.exponentialRampToValueAtTime(0.01, t + 0.06)
            oscN.start(t); oscN.stop(t + 0.06)
          }
          break
        }
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
    [getCtx]
  )

  return { play }
}
