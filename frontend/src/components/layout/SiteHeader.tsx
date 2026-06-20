import { CalendarClock } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ModeToggle } from '@/components/mode-toggle'

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-secondary text-secondary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-4">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <CalendarClock className="size-4" />
          </span>
          <span>Запись на созвон</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navClass}>
            Главная
          </NavLink>
          <NavLink to="/admin" className={navClass}>
            Админка
          </NavLink>
          <div className="ml-2">
            <ModeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
