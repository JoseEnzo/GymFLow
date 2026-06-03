import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Aceitar convite' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
