import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Código de acesso' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
