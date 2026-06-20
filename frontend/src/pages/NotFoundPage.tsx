import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-5xl font-bold tracking-tight">404</p>
      <p className="text-muted-foreground">Такой страницы нет.</p>
      <Button asChild>
        <Link to="/">На главную</Link>
      </Button>
    </div>
  )
}
