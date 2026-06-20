import { useState } from 'react'
import { ArrowLeft, CalendarCheck, CheckCircle2, Clock } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { Booking, Slot } from '@/api/client'
import { ApiError, useCreateBooking, useEventType, useSlots } from '@/api/hooks'
import { formatDateTime, formatDuration, formatTime } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/states'
import { SlotPicker } from './booking/SlotPicker'
import { BookingForm, type BookingFormValues } from './booking/BookingForm'

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
      <Link to="/">
        <ArrowLeft className="size-4" />К списку встреч
      </Link>
    </Button>
  )
}

function Confirmation({ booking }: { booking: Booking }) {
  return (
    <Card className="border-success/30 bg-success/5">
      <CardHeader className="items-center text-center">
        <CheckCircle2 className="size-10 text-success" />
        <CardTitle className="text-xl">Вы записаны!</CardTitle>
        <CardDescription>
          Встреча подтверждена на {formatDateTime(booking.start)}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border bg-card p-4 text-sm">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
            <dt className="text-muted-foreground">Время</dt>
            <dd className="tabular-nums">
              {formatDateTime(booking.start)} — {formatTime(booking.end)}
            </dd>
            <dt className="text-muted-foreground">Имя</dt>
            <dd>{booking.guestName}</dd>
            <dt className="text-muted-foreground">Email</dt>
            <dd>{booking.guestEmail}</dd>
            {booking.comment ? (
              <>
                <dt className="text-muted-foreground">Комментарий</dt>
                <dd>{booking.comment}</dd>
              </>
            ) : null}
          </dl>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link to="/">Готово</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function BookingPage() {
  const { eventTypeId = '' } = useParams()
  const navigate = useNavigate()

  const eventType = useEventType(eventTypeId)
  const slots = useSlots(eventTypeId)
  const createBooking = useCreateBooking(eventTypeId)

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [confirmed, setConfirmed] = useState<Booking | null>(null)

  function handleSubmit(values: BookingFormValues) {
    if (!selectedSlot) return
    createBooking.mutate(
      {
        eventTypeId,
        start: selectedSlot.start,
        guestName: values.guestName,
        guestEmail: values.guestEmail,
        comment: values.comment || undefined,
      },
      {
        onSuccess: (booking) => {
          setConfirmed(booking)
          toast.success('Запись создана')
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            toast.error('Этот слот уже занят. Выберите другое время.')
            setSelectedSlot(null)
            slots.refetch()
            return
          }
          if (error instanceof ApiError && error.status === 422) {
            toast.error(error.message || 'Проверьте корректность данных.')
            return
          }
          toast.error('Не удалось создать запись. Попробуйте ещё раз.')
        },
      },
    )
  }

  if (eventType.isLoading) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (eventType.isError || !eventType.data) {
    const notFound =
      eventType.error instanceof ApiError && eventType.error.status === 404
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          title={notFound ? 'Тип встречи не найден' : undefined}
          description={
            notFound
              ? 'Возможно, ссылка устарела или встреча была удалена.'
              : undefined
          }
          onRetry={notFound ? undefined : () => eventType.refetch()}
        />
      </div>
    )
  }

  const et = eventType.data

  if (confirmed) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Confirmation booking={confirmed} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <BackLink />

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{et.title}</h1>
          <Badge>
            <Clock className="size-3" />
            {formatDuration(et.durationMinutes)}
          </Badge>
        </div>
        <p className="text-muted-foreground">{et.description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Выберите время</CardTitle>
          <CardDescription>
            Свободные слоты на ближайшие 14 дней, пн–пт.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {slots.isLoading ? (
            <Skeleton className="h-40 w-full rounded-lg" />
          ) : slots.isError ? (
            <ErrorState onRetry={() => slots.refetch()} />
          ) : (
            <SlotPicker
              slots={slots.data ?? []}
              selected={selectedSlot}
              onSelect={setSelectedSlot}
            />
          )}
        </CardContent>
      </Card>

      {selectedSlot ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarCheck className="size-4 text-primary" />
              <span className="tabular-nums">
                {formatDateTime(selectedSlot.start)} —{' '}
                {formatTime(selectedSlot.end)}
              </span>
            </CardTitle>
            <CardDescription>
              Заполните данные, чтобы подтвердить запись.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookingForm
              isPending={createBooking.isPending}
              onSubmit={handleSubmit}
            />
          </CardContent>
        </Card>
      ) : null}

      <p className="text-center text-sm text-muted-foreground">
        Передумали?{' '}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="cursor-pointer text-primary hover:underline"
        >
          Вернуться к списку
        </button>
      </p>
    </div>
  )
}
