import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Meu Perfil' }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
