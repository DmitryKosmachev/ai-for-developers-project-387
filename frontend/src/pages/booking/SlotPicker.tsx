import { useMemo, useState } from 'react'
import type { Slot } from '@/api/client'
import { formatTime, groupSlotsByDay } from '@/lib/format'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/states'

interface SlotPickerProps {
  slots: Slot[]
  selected: Slot | null
  onSelect: (slot: Slot) => void
}

/** Выбор свободного слота: список дней слева + сетка времени справа. */
export function SlotPicker({ slots, selected, onSelect }: SlotPickerProps) {
  const days = useMemo(() => groupSlotsByDay(slots), [slots])
  const [activeDayKey, setActiveDayKey] = useState<string | null>(
    () => days[0]?.key ?? null,
  )

  if (days.length === 0) {
    return (
      <EmptyState
        title="Нет свободных слотов"
        description="На ближайшие 14 дней свободного времени не осталось. Загляните позже."
      />
    )
  }

  const activeDay =
    days.find((d) => d.key === activeDayKey) ?? days[0]

  return (
    <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-col sm:overflow-visible sm:pb-0">
        {days.map((day) => {
          const active = day.key === activeDay.key
          return (
            <button
              key={day.key}
              type="button"
              onClick={() => setActiveDayKey(day.key)}
              className={cn(
                'flex shrink-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-muted',
              )}
            >
              <span className="font-medium capitalize">{day.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {day.slots.length}
              </span>
            </button>
          )
        })}
      </div>

      <div
        role="radiogroup"
        aria-label={`Свободное время — ${activeDay.label}`}
        className="grid grid-cols-3 gap-2 sm:grid-cols-4"
      >
        {activeDay.slots.map((slot) => {
          const isSelected = selected?.start === slot.start
          return (
            <button
              key={slot.start}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(slot)}
              className={cn(
                'rounded-md border py-2 text-sm font-medium tabular-nums transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input hover:border-primary hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {formatTime(slot.start)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
