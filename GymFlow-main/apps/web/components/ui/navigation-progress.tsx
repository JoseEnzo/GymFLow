'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function NavigationProgressInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const prevUrl = useRef<string | null>(null)
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null)
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function start() {
    if (ticker.current) clearInterval(ticker.current)
    setVisible(true)
    setWidth(8)

    let w = 8
    ticker.current = setInterval(() => {
      // Ease toward 85% — slows down as it approaches
      const remaining = 85 - w
      w += remaining * 0.12
      setWidth(w)
      if (w >= 84.9) clearInterval(ticker.current!)
    }, 150)
  }

  function complete() {
    if (ticker.current) clearInterval(ticker.current)
    setWidth(100)
    completeTimer.current = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 350)
  }

  // Complete bar when pathname changes (navigation done)
  useEffect(() => {
    const current = `${pathname}?${searchParams.toString()}`
    if (prevUrl.current === null) {
      prevUrl.current = current
      return
    }
    if (current !== prevUrl.current) {
      prevUrl.current = current
      complete()
    }
  }, [pathname, searchParams])

  // Start bar on internal link clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      // Skip: external, hash-only, mailto, tel, new tab
      if (!href || href.startsWith('http') || href.startsWith('#') ||
          href.startsWith('mailto:') || href.startsWith('tel:') ||
          anchor.target === '_blank') return
      // Mesma rota (ex: clicar no logo já estando em "/"): a navegação não muda
      // o pathname, então complete() nunca rodaria e a barra travaria em ~85%.
      if (anchor.pathname === window.location.pathname) return
      start()
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
      if (ticker.current) clearInterval(ticker.current)
      if (completeTimer.current) clearTimeout(completeTimer.current)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[9999] h-[3px]"
      style={{
        width: `${width}%`,
        transition: width === 100 ? 'width 200ms ease-out' : 'width 150ms linear',
        background: 'linear-gradient(90deg, #6366f1, #06b6d4)',
        boxShadow: '0 0 8px rgba(99,102,241,0.7)',
      }}
    />
  )
}

export function NavigationProgress() {
  return (
    <Suspense>
      <NavigationProgressInner />
    </Suspense>
  )
}
