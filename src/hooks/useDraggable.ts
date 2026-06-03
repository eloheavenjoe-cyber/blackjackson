import { useState, useCallback, useEffect, useRef } from 'react'

type Position = { x: number; y: number }

export function useDraggable(storageKey: string, defaultPos: Position) {
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as Position
    } catch {}
    return defaultPos
  })
  const [isDragging, setIsDragging] = useState(false)
  const offsetRef = useRef({ x: 0, y: 0 })
  const posRef = useRef(position)
  posRef.current = position

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(position))
    } catch {}
  }, [position, storageKey])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = e.currentTarget as HTMLElement
    el.setPointerCapture(e.pointerId)
    const rect = el.getBoundingClientRect()
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setIsDragging(true)
    e.stopPropagation()
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    const panelW = 340
    const panelH = 420
    const x = Math.max(0, Math.min(e.clientX - offsetRef.current.x, vw - panelW))
    const y = Math.max(0, Math.min(e.clientY - offsetRef.current.y, vh - panelH))
    setPosition({ x, y })
  }, [isDragging])

  const onPointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const resetPosition = useCallback(() => {
    setPosition(defaultPos)
  }, [defaultPos])

  return {
    position,
    isDragging,
    dragHandlers: { onPointerDown, onPointerMove, onPointerUp },
    resetPosition,
  }
}
