import { Outlet } from 'react-router-dom'
import { SiteHeader } from './SiteHeader'

export function RootLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
