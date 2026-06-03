import { PLAYLIST_TRACKS } from '../../constants/music'

type Props = {
  currentUrl: string
  onSelect: (url: string, title: string) => void
}

export function PlaylistPicker({ currentUrl, onSelect }: Props) {
  return (
    <div className="space-y-1 max-h-32 overflow-y-auto">
      {PLAYLIST_TRACKS.map((track) => (
        <button
          key={track.url}
          onClick={() => onSelect(track.url, track.title)}
          className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
            currentUrl === track.url
              ? 'bg-gold/20 text-gold'
              : 'text-white/60 hover:bg-white/5 hover:text-white/80'
          }`}
        >
          {track.title}
        </button>
      ))}
    </div>
  )
}
