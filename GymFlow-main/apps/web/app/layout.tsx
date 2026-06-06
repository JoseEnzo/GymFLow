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
    default: 'MeuTrein — Plataforma para Academias',
    template: '%s | MeuTrein',
  },
  description:
    'Plataforma SaaS multi-tenant para academias. Gerencie treinos, alunos e evolução física com facilidade.',
  keywords: ['academia', 'treino', 'personal trainer', 'fitness', 'gestão de academia'],
  authors: [{ name: 'MeuTrein Team' }],
  creator: 'MeuTrein',
  metadataBase: new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? 'https://gymflow.app'),
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://gymflow.app',
    title: 'MeuTrein — Plataforma para Academias',
    description: 'Gerencie treinos, alunos e evolução física com facilidade.',
    siteName: 'MeuTrein',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MeuTrein',
    description: 'Plataforma SaaS para academias.',
    creator: '@gymflow',
  },
  manifest: '/manifest.json',
  // Ícones PNG vivem em /public/icons (192/512 + maskable). Apple Touch Icon
  // fica em /public/apple-touch-icon.png (180x180). Sem esses PNGs, Chrome
  // não considera a app instalável.
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'MeuTrein',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  themeColor: '#06060F',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  // maximumScale removido: bloqueava zoom de acessibilidade (Apple reclama).
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
