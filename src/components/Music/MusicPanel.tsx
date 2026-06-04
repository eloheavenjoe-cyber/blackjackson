import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
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
  onToggle: () => void
  onCommand: (cmd: Partial<MusicState>) => void
  onVolumeChange: (vol: number) => void
  onTimeUpdate: (time: number) => void
}

function loadPanelSize(roomCode: string, defaultW: number, defaultH: number) {
  try {
    const saved = localStorage.getItem(`musicPanelSize_${roomCode}`)
    if (saved) return JSON.parse(saved) as { width: number; height: number }
  } catch {}
  return { width: defaultW, height: defaultH }
}

export function MusicPanel({ roomCode, isHost, music, volume, isOpen, onToggle, onCommand, onVolumeChange, onTimeUpdate }: Props) {
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [activeTab, setActiveTab] = useState<'youtube' | 'playlist'>('youtube')
  const [duration, setDuration] = useState(0)
  const [localTime, setLocalTime] = useState(0)

  const { position, isDragging, dragHandlers } = useDraggable(
    `musicPanelPos_${roomCode}`,
    { x: window.innerWidth - 360, y: 560 },
  )

  const [panelSize, setPanelSize] = useState(() => loadPanelSize(roomCode, 340, 280))
  const resizeRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0 })
  const isResizingRef = useRef(false)

  useEffect(() => {
    try { localStorage.setItem(`musicPanelSize_${roomCode}`, JSON.stringify(panelSize)) } catch {}
  }, [panelSize, roomCode])

  const onResizeDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    isResizingRef.current = true
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: panelSize.width, startH: panelSize.height }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [panelSize])

  const onResizeMove = useCallback((e: React.PointerEvent) => {
    if (!isResizingRef.current) return
    const dx = e.clientX - resizeRef.current.startX
    const dy = e.clientY - resizeRef.current.startY
    setPanelSize({
      width: Math.max(240, resizeRef.current.startW + dx),
      height: Math.max(160, resizeRef.current.startH + dy),
    })
  }, [])

  const onResizeUp = useCallback(() => {
    isResizingRef.current = false
  }, [])

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
      className={`fixed z-[60] ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ left: position.x, top: position.y, width: panelSize.width }}
    >
      {/* Always-visible draggable header bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 bg-black/90 backdrop-blur-md border border-white/10 rounded-xl cursor-grab active:cursor-grabbing select-none shadow-2xl"
        style={{ borderRadius: isOpen ? '12px 12px 0 0' : '12px', width: panelSize.width }}
        {...dragHandlers}
      >
        <div className="flex items-center gap-2">
          <span className="text-gold/80 text-xs font-semibold">{'\u266A'} Music Player</span>
          {!isOpen && music && (
            <span className="text-white/20 text-[10px] truncate max-w-[180px]">{music.title}</span>
          )}
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onToggle}
          className="text-white/40 hover:text-white/80 text-lg leading-none px-1"
        >
          {isOpen ? '\u2014' : '+'}
        </button>
      </div>

      {/* Expandable content */}
      {isOpen && (
        <div
          className="bg-black/85 backdrop-blur-md border-l border-r border-b border-white/10 rounded-b-xl shadow-2xl relative"
          style={{ width: panelSize.width }}
        >
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
              currentTime={isHost ? localTime : (music?.currentTime ?? 0)}
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
              onReady={(d) => {
                setDuration(d)
                setLocalTime(0)
              }}
              onMetadata={({ title }) => {
                if (isHost && title) onCommand({ title, lastCommandAt: Date.now() })
              }}
              onTimeUpdate={(t) => { onTimeUpdate(t); setLocalTime(t) }}
              onEnded={() => { onCommand({ playing: false, lastCommandAt: Date.now() }) }}
            />
          )}

          {/* Resize handle */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
            style={{
              background: 'linear-gradient(135deg, transparent 50%, rgba(212,168,67,0.3) 50%)',
              borderBottomRightRadius: 12,
            }}
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
          />
        </div>
      )}
    </div>,
    document.body,
  )
}
