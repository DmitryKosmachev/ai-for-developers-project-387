import { AlertCircle, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  )
}

export function ErrorState({
  title = 'Не удалось загрузить данные',
  description,
  onRetry,
}: {
  title?: string
  description?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-12 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Повторить
        </Button>
      ) : null}
    </div>
  )
}
