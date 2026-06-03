import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Histórico' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
