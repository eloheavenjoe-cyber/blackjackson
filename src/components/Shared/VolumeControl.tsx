import { useUIStore } from '../../stores/uiStore'

export function VolumeControl() {
  const { soundEnabled, toggleSound, volume, setVolume } = useUIStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-black/50 backdrop-blur rounded-full px-3 py-1.5 border border-white/10">
      <button
        onClick={toggleSound}
        className="text-white/60 hover:text-white cursor-pointer text-sm leading-none"
        title={soundEnabled ? 'Mute' : 'Unmute'}
      >
        {soundEnabled ? '\u{1F50A}' : '\u{1F507}'}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          setVolume(v)
          if (v > 0 && !soundEnabled) toggleSound()
        }}
        className="w-20 h-1 accent-gold cursor-pointer"
        style={{ writingMode: 'horizontal-tb' }}
      />
    </div>
  )
}
