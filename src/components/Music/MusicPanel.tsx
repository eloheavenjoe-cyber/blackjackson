import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDraggable } from '../../hooks/useDraggable'
import { MusicControls } from './MusicControls'
import { YoutubePlayer } from './YoutubePlayer'
import { PlaylistPicker } from './PlaylistPicker'
import type { MusicState } from '../../engine/types'

type Props = {
  roomCode: string
  isHost: boolean
  music: MusicState | null | undefined
  volume: number
  isOpen: boolean
  onClose: () => void
  onCommand: (cmd: Partial<MusicState>) => void
  onVolumeChange: (vol: number) => void
  onTimeUpdate: (time: number) => void
}

export function MusicPanel({ roomCode, isHost, music, volume, isOpen, onClose, onCommand, onVolumeChange, onTimeUpdate }: Props) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'youtube' | 'playlist'>('youtube')
  const [duration, setDuration] = useState(0)

  const { position, isDragging, dragHandlers } = useDraggable(
    `musicPanelPos_${roomCode}`,
    { x: window.innerWidth - 360, y: 560 },
  )

  function handlePlayPause() {
    if (!music) return
    onCommand({ playing: !music.playing, currentTime: music.currentTime, lastCommandAt: Date.now() })
  }

  function handleSeek(time: number) {
    if (!music) return
    onCommand({ currentTime: time, lastCommandAt: Date.now() })
  }

  function handleSourceSelect(url: string, title: string) {
    onCommand({
      source: 'youtube',
      url,
      title,
      playing: false,
      currentTime: 0,
      lastCommandAt: Date.now(),
    })
  }

  function handlePlaylistSelect(url: string, title: string) {
    onCommand({
      source: 'playlist',
      url,
      title,
      playing: true,
      currentTime: 0,
      lastCommandAt: Date.now(),
    })
  }

  function handleYoutubeSubmit() {
    const trimmed = youtubeUrl.trim()
    if (!trimmed) return
    let videoId = ''
    try {
      const u = new URL(trimmed)
      if (u.hostname.includes('youtube.com')) {
        videoId = u.searchParams.get('v') || ''
      } else if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.slice(1)
      }
    } catch {
      videoId = trimmed
    }
    if (!videoId) return
    handleSourceSelect(videoId, 'YouTube')
    setYoutubeUrl('')
  }

  const videoId = (music?.source === 'youtube' && music.url) ? music.url : ''

  return createPortal(
    <div
      className={`fixed z-[60] bg-black/85 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{ left: position.x, top: position.y, width: 340, minHeight: isOpen ? 220 : 0, overflow: 'hidden' }}
    >
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 cursor-grab active:cursor-grabbing select-none"
              {...dragHandlers}
            >
              <span className="text-gold text-sm font-semibold">{'\u266A'} Music Player</span>
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                className="text-white/40 hover:text-white/80 text-lg leading-none px-1"
              >
                {'\u2014'}
              </button>
            </div>

            {isHost && (
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('youtube')}
                  className={`flex-1 text-xs py-2 transition-colors ${activeTab === 'youtube' ? 'text-gold border-b-2 border-gold' : 'text-white/40 hover:text-white/60'}`}
                >
                  YouTube
                </button>
                <button
                  onClick={() => setActiveTab('playlist')}
                  className={`flex-1 text-xs py-2 transition-colors ${activeTab === 'playlist' ? 'text-gold border-b-2 border-gold' : 'text-white/40 hover:text-white/60'}`}
                >
                  Playlist
                </button>
              </div>
            )}

            <div className="p-4 space-y-3">
              {music ? (
                <div className="text-center">
                  <p className="text-white/80 text-xs truncate">{music.title}</p>
                  <p className="text-white/25 text-[10px] capitalize mt-0.5">{music.source}</p>
                </div>
              ) : (
                <p className="text-white/30 text-xs text-center">No music playing</p>
              )}

              <MusicControls
                playing={music?.playing ?? false}
                currentTime={music?.currentTime ?? 0}
                duration={duration}
                source={music?.source ?? 'youtube'}
                volume={volume}
                isHost={isHost}
                onPlayPause={handlePlayPause}
                onSeek={handleSeek}
                onVolumeChange={onVolumeChange}
              />

              {isHost && activeTab === 'youtube' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleYoutubeSubmit()}
                    placeholder="YouTube URL or video ID..."
                    className="flex-1 bg-white/5 text-white text-xs rounded-lg px-3 py-1.5 border border-white/10 focus:border-gold/50 focus:outline-none placeholder:text-white/20"
                  />
                  <button
                    onClick={handleYoutubeSubmit}
                    className="text-gold text-xs font-semibold hover:text-gold/80 shrink-0 px-2"
                  >
                    Load
                  </button>
                </div>
              )}

              {isHost && activeTab === 'playlist' && (
                <PlaylistPicker
                  currentUrl={music?.url ?? ''}
                  onSelect={handlePlaylistSelect}
                />
              )}
            </div>

            {videoId && (
              <YoutubePlayer
                key={videoId}
                videoId={videoId}
                playing={music?.playing ?? false}
                currentTime={music?.currentTime ?? 0}
                volume={volume}
                onReady={(d) => setDuration(d)}
                onTimeUpdate={onTimeUpdate}
                onEnded={() => {}}
              />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body,
  )
}
