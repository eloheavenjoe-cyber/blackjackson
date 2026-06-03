type Props = {
  playing: boolean
  currentTime: number
  duration: number
  source: 'youtube' | 'playlist'
  volume: number
  onPlayPause: () => void
  onSeek: (time: number) => void
  onVolumeChange: (vol: number) => void
}

export function MusicControls({ playing, currentTime, duration, source, volume, onPlayPause, onSeek, onVolumeChange }: Props) {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onPlayPause}
          className="text-gold hover:text-gold/80 text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
        >
          {playing ? '\u23F8' : '\u25B6'}
        </button>
      </div>
      {source === 'youtube' && duration > 0 && (
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1 accent-gold bg-white/10 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/30">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      )}
      {source === 'playlist' && playing && (
        <div className="flex justify-center">
          <span className="text-[10px] text-white/20">Now Playing</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-white/30 text-xs">{'\u{1F50A}'}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
          className="flex-1 h-1 accent-gold bg-white/10 rounded-full appearance-none cursor-pointer"
        />
        <span className="text-white/30 text-xs w-8 text-right">{Math.round(volume * 100)}%</span>
      </div>
    </div>
  )
}
