import type { Slot } from '@/api/client'

const TIME_FMT = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const DAY_FMT = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
})

const DATETIME_FMT = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

/** «14:30» */
export function formatTime(iso: string): string {
  return TIME_FMT.format(new Date(iso))
}

/** «пн, 17 июня» */
export function formatDayLabel(iso: string): string {
  return DAY_FMT.format(new Date(iso))
}

/** «17 июня, 14:30» */
export function formatDateTime(iso: string): string {
  return DATETIME_FMT.format(new Date(iso))
}

/** «30 мин» / «1 ч» / «1 ч 30 мин» */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours} ч`)
  if (mins > 0) parts.push(`${mins} мин`)
  return parts.join(' ') || '0 мин'
}

/** Ключ дня (YYYY-MM-DD) для группировки слотов. */
function dayKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export interface SlotDay {
  key: string
  label: string
  /** ISO начала дня (первого слота) — для сортировки/выбора. */
  date: string
  slots: Slot[]
}

/** Группирует слоты по календарным дням, сохраняя порядок по времени. */
export function groupSlotsByDay(slots: Slot[]): SlotDay[] {
  const sorted = [...slots].sort((a, b) => a.start.localeCompare(b.start))
  const map = new Map<string, SlotDay>()
  for (const slot of sorted) {
    const key = dayKey(slot.start)
    let day = map.get(key)
    if (!day) {
      day = {
        key,
        label: formatDayLabel(slot.start),
        date: slot.start,
        slots: [],
      }
      map.set(key, day)
    }
    day.slots.push(slot)
  }
  return [...map.values()]
}
