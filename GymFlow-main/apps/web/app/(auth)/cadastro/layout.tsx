import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Criar conta' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
