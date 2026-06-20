import { ArrowRight, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEventTypes, useOwner } from '@/api/hooks'
import { formatDuration } from '@/lib/format'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/states'

function OwnerHeader() {
  const { data, isLoading, isError, refetch } = useOwner()

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-5 w-48" />
      </div>
    )
  }
  if (isError || !data) {
    return <ErrorState onRetry={() => refetch()} />
  }

  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">
        Записаться на созвон к {data.name}
      </h1>
      <p className="text-muted-foreground">
        Выберите тип встречи и удобное время. Часовой пояс: {data.timezone}.
      </p>
    </div>
  )
}

function EventTypeList() {
  const { data, isLoading, isError, refetch } = useEventTypes()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }
  if (isError) {
    return <ErrorState onRetry={() => refetch()} />
  }
  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="Пока нет доступных типов встреч"
        description="Владелец ещё не создал ни одного типа события."
      />
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.map((eventType) => (
        <Card key={eventType.id} className="flex flex-col">
          <CardHeader className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">{eventType.title}</CardTitle>
              <Badge>
                <Clock className="size-3" />
                {formatDuration(eventType.durationMinutes)}
              </Badge>
            </div>
            <CardDescription className="line-clamp-3">
              {eventType.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to={`/book/${eventType.id}`}>
                Записаться
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function HomePage() {
  return (
    <div className="space-y-8">
      <OwnerHeader />
      <EventTypeList />
    </div>
  )
}
