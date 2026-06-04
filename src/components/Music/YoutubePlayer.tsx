import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: any
  }
}

type Props = {
  videoId: string
  playing: boolean
  currentTime: number
  volume: number
  onReady: (duration: number) => void
  onMetadata: (data: { title: string; author: string }) => void
  onTimeUpdate: (time: number) => void
  onEnded: () => void
}

export function YoutubePlayer({ videoId, playing, currentTime, volume, onReady, onMetadata, onTimeUpdate, onEnded }: Props) {
  const playerRef = useRef<any>(null)
  const apiLoadedRef = useRef(false)
  const timeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, [])

  const initPlayer = useCallback(() => {
    if (!window.YT?.Player || !videoId) return
    try {
      playerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
        videoId,
        playerVars: { autoplay: 0, controls: 0, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e: any) => {
            if (!mountedRef.current) return
            onReady(e.target.getDuration())
            e.target.setVolume(Math.round(volume * 100))
            try {
              const data = e.target.getVideoData()
              if (data?.title) onMetadata({ title: data.title, author: data.author || '' })
            } catch {}
          },
          onStateChange: (e: any) => {
            if (e.data === 0) onEnded()
          },
        },
      })
    } catch {}
  }, [videoId, volume, onReady, onEnded])

  useEffect(() => {
    if (!apiLoadedRef.current) {
      if (window.YT?.Player) {
        apiLoadedRef.current = true
        initPlayer()
      } else {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
        window.onYouTubeIframeAPIReady = () => {
          apiLoadedRef.current = true
          initPlayer()
        }
      }
    }
    return () => {
      if (timeIntervalRef.current) clearInterval(timeIntervalRef.current)
      playerRef.current?.destroy()
    }
  }, [videoId])

  useEffect(() => {
    if (!playerRef.current?.playVideo) return
    if (playing) {
      playerRef.current.playVideo()
      timeIntervalRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime) {
          onTimeUpdate(playerRef.current.getCurrentTime())
        }
      }, 1000)
    } else {
      playerRef.current.pauseVideo()
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
        timeIntervalRef.current = null
      }
    }
    return () => {
      if (timeIntervalRef.current) {
        clearInterval(timeIntervalRef.current)
        timeIntervalRef.current = null
      }
    }
  }, [playing])

  useEffect(() => {
    if (playerRef.current?.seekTo && currentTime > 0) {
      playerRef.current.seekTo(currentTime)
    }
  }, [currentTime])

  useEffect(() => {
    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(Math.round(volume * 100))
    }
  }, [volume])

  return (
    <div
      id={`yt-player-${videoId}`}
      style={{ width: 1, height: 1, opacity: 0, pointerEvents: 'none', position: 'absolute' }}
    />
  )
}
