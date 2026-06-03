import { useState, useCallback, useEffect, useRef } from 'react'

type Position = { x: number; y: number }

export function useDraggable(
  storageKey: string,
  defaultPos: Position,
  panelW = 340,
  panelH = 420,
) {
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as Position
    } catch {}
    return defaultPos
  })
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const offsetRef = useRef({ x: 0, y: 0 })
  const capturedElRef = useRef<HTMLElement | null>(null)
  const capturedIdRef = useRef(-1)

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(position))
    } catch {}
  }, [position, storageKey])

  useEffect(() => {
    return () => {
      const el = capturedElRef.current
      const id = capturedIdRef.current
      if (el && id >= 0) {
        try { el.releasePointerCapture(id) } catch {}
      }
    }
  }, [])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    capturedElRef.current = el
    capturedIdRef.current = e.pointerId
    const rect = el.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    isDraggingRef.current = true
    setIsDragging(true)
    e.stopPropagation()
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingRef.current) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const x = Math.max(0, Math.min(e.clientX - offsetRef.current.x, vw - panelW))
    const y = Math.max(0, Math.min(e.clientY - offsetRef.current.y, vh - panelH))
    setPosition({ x, y })
  }, [panelW, panelH])

  const stopDragging = useCallback(() => {
    isDraggingRef.current = false
    setIsDragging(false)
    capturedElRef.current = null
    capturedIdRef.current = -1
  }, [])

  const onPointerUp = stopDragging

  const onPointerCancel = stopDragging

  const resetPosition = useCallback(() => {
    setPosition(defaultPos)
  }, [defaultPos])

  return {
    position,
    isDragging,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel },
    resetPosition,
  }
}
