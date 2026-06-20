import { useState, type FormEvent } from 'react'
import { Clock, Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ApiError, useCreateEventType, useEventTypes } from '@/api/hooks'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState, ErrorState } from '@/components/states'

const DURATION_OPTIONS = [30, 60, 90, 120]

function CreateEventTypeForm() {
  const createEventType = useCreateEventType()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Укажите название')
      return
    }
    setError(null)
    createEventType.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        durationMinutes,
      },
      {
        onSuccess: () => {
          toast.success('Тип события создан')
          setTitle('')
          setDescription('')
          setDurationMinutes(30)
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 422) {
            toast.error(err.message || 'Проверьте корректность данных.')
            return
          }
          toast.error('Не удалось создать тип события.')
        },
      },
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Новый тип события</CardTitle>
        <CardDescription>
          Длительность кратна 30 минутам — слоты считаются по 30-минутной сетке.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="title">
              Название <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например, Знакомство"
              aria-invalid={Boolean(error)}
              disabled={createEventType.isPending}
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Описание</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко о встрече — что обсуждаем"
              disabled={createEventType.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="duration">Длительность</Label>
            <select
              id="duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              disabled={createEventType.isPending}
              className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                'disabled:cursor-not-allowed disabled:opacity-50',
              )}
            >
              {DURATION_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {formatDuration(minutes)}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createEventType.isPending}
          >
            {createEventType.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Создать
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function ExistingEventTypes() {
  const { data, isLoading, isError, refetch } = useEventTypes()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
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
        title="Типов событий пока нет"
        description="Создайте первый тип встречи в форме слева."
      />
    )
  }

  return (
    <div className="space-y-3">
      {data.map((et) => (
        <Card key={et.id}>
          <CardContent className="space-y-1 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{et.title}</span>
              <Badge>
                <Clock className="size-3" />
                {formatDuration(et.durationMinutes)}
              </Badge>
            </div>
            {et.description ? (
              <p className="text-sm text-muted-foreground">{et.description}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function AdminEventTypesPage() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CreateEventTypeForm />
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">
          Существующие типы
        </h2>
        <ExistingEventTypes />
      </div>
    </div>
  )
}
