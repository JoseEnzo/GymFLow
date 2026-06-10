import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { OfflineSyncProvider } from '@/components/layout/offline-sync-provider'
export const metadata: Metadata = {
  title: 'Dashboard',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <OfflineSyncProvider />
      <Sidebar />

      {/* Main content area — shifts with sidebar */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[240px] transition-all duration-[250ms]">
        <Header />

        <main className="flex-1 overflow-y-auto">
          {/* pb-24 reserva espaço para o BottomNav no mobile */}
          <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
