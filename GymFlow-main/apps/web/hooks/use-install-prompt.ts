'use client'

import { useEffect, useState } from 'react'

// Tipo do evento beforeinstallprompt (não está nos types nativos do TS).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type Platform = 'android' | 'ios' | 'desktop' | 'unknown'

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  const displayStandalone = window.matchMedia('(display-mode: standalone)').matches
  return iosStandalone || displayStandalone
}

export interface InstallPromptState {
  platform: Platform
  isStandalone: boolean
  isIos: boolean
  /** Disponível só quando o browser despachou `beforeinstallprompt` (Chrome/Edge/Android com PWA criteria OK). */
  canPrompt: boolean
  /** Dispara o prompt nativo (Android/Chrome). Em iOS, retorna 'ios-manual' e o caller deve mostrar instruções. */
  triggerPrompt: () => Promise<'accepted' | 'dismissed' | 'ios-manual' | 'unavailable'>
}

// Hook reutilizável pra estado de install do PWA.
// `<InstallButton />` e o prompt pós-1º treino consomem esse hook.
export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    setPlatform(detectPlatform())
    setIsStandalone(detectStandalone())

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    const installedHandler = () => {
      setIsStandalone(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const isIos = platform === 'ios'
  const canPrompt = deferredPrompt !== null

  async function triggerPrompt(): Promise<'accepted' | 'dismissed' | 'ios-manual' | 'unavailable'> {
    if (isIos) return 'ios-manual'
    if (!deferredPrompt) return 'unavailable'
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return choice.outcome
  }

  return { platform, isStandalone, isIos, canPrompt, triggerPrompt }
}
