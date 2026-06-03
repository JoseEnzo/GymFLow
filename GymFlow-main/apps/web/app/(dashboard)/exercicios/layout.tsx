import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Exercícios' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
