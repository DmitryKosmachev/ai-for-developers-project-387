import { CalendarDays, LayoutList } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

function tabClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-2 border-b-2 px-1 pb-2 text-sm font-medium transition-colors',
    isActive
      ? 'border-primary text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground',
  )
}

export function AdminLayout() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Панель владельца</h1>
        <p className="text-muted-foreground">
          Управляйте типами встреч и смотрите предстоящие записи.
        </p>
      </div>

      <nav className="flex gap-6 border-b border-border">
        <NavLink to="/admin" end className={tabClass}>
          <CalendarDays className="size-4" />
          Предстоящие встречи
        </NavLink>
        <NavLink to="/admin/event-types" className={tabClass}>
          <LayoutList className="size-4" />
          Типы событий
        </NavLink>
      </nav>

      <Outlet />
    </div>
  )
}
