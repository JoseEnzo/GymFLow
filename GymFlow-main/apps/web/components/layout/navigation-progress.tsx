'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevPathRef = useRef(pathname)
  const completingRef = useRef(false)

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const complete = () => {
    if (completingRef.current) return
    completingRef.current = true
    clearTimer()
    setWidth(100)
    setTimeout(() => {
      setVisible(false)
      setWidth(0)
      completingRef.current = false
    }, 350)
  }

  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname
      complete()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (
        !anchor ||
        !anchor.href ||
        anchor.origin !== window.location.origin ||
        anchor.target ||
        anchor.download ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey
      ) return

      const url = new URL(anchor.href)
      if (url.pathname === window.location.pathname) return

      clearTimer()
      completingRef.current = false
      setVisible(true)
      setWidth(12)

      let current = 12
      intervalRef.current = setInterval(() => {
        const increment = Math.random() * 12 + 3
        current = Math.min(current + increment, 82)
        setWidth(current)
        if (current >= 82) clearTimer()
      }, 300)
    }

    document.addEventListener('click', handleClick, true)
    return () => {
      document.removeEventListener('click', handleClick, true)
      clearTimer()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] h-[2px] pointer-events-none"
    >
      <div
        className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 shadow-[0_0_10px_rgba(99,102,241,0.7)]"
        style={{
          width: `${width}%`,
          transition: width === 100 ? 'width 200ms ease-out' : 'width 300ms ease-out',
        }}
      />
    </div>
  )
}
