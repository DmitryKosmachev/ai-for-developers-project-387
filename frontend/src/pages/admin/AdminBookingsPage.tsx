import { useMemo } from 'react'
import { CalendarClock, Mail, MessageSquare } from 'lucide-react'
import { useBookings, useEventTypes } from '@/api/hooks'
import { formatDateTime, formatTime } from '@/lib/format'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/states'

export function AdminBookingsPage() {
  const bookings = useBookings()
  const eventTypes = useEventTypes()

  const titleById = useMemo(() => {
    const map = new Map<string, string>()
    for (const et of eventTypes.data ?? []) map.set(et.id, et.title)
    return map
  }, [eventTypes.data])

  if (bookings.isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (bookings.isError) {
    return <ErrorState onRetry={() => bookings.refetch()} />
  }

  const items = [...(bookings.data ?? [])].sort((a, b) =>
    a.start.localeCompare(b.start),
  )

  if (items.length === 0) {
    return (
      <EmptyState
        title="Пока нет предстоящих встреч"
        description="Как только гость запишется, встреча появится здесь."
      />
    )
  }

  return (
    <div className="space-y-3">
      {items.map((booking) => (
        <Card key={booking.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-medium tabular-nums">
                <CalendarClock className="size-4 text-primary" />
                {formatDateTime(booking.start)} — {formatTime(booking.end)}
              </div>
              <div className="text-sm text-muted-foreground">
                {booking.guestName}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {booking.guestEmail}
                </span>
                {booking.comment ? (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="size-3.5" />
                    {booking.comment}
                  </span>
                ) : null}
              </div>
            </div>
            <Badge variant="secondary" className="w-fit">
              {titleById.get(booking.eventTypeId) ?? 'Встреча'}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
