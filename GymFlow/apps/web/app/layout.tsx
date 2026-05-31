import type { Metadata, Viewport } from 'next'
import { Inter, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'

import './globals.css'
import { Providers } from '@/components/providers'
import { NavigationProgress } from '@/components/ui/navigation-progress'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'GymFlow — Plataforma para Academias',
    template: '%s | GymFlow',
  },
  description:
    'Plataforma SaaS multi-tenant para academias. Gerencie treinos, alunos e evolução física com facilidade.',
  keywords: ['academia', 'treino', 'personal trainer', 'fitness', 'gestão de academia'],
  authors: [{ name: 'GymFlow Team' }],
  creator: 'GymFlow',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://gymflow.app'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://gymflow.app',
    title: 'GymFlow — Plataforma para Academias',
    description: 'Gerencie treinos, alunos e evolução física com facilidade.',
    siteName: 'GymFlow',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GymFlow',
    description: 'Plataforma SaaS para academias.',
    creator: '@gymflow',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#06060F',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-background antialiased">
        <NavigationProgress />
        <Providers>
          {children}
        </Providers>
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />
      </body>
    </html>
  )
}
