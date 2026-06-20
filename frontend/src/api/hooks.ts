import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { api } from './client'
import type { BookingCreate, EventTypeCreate } from './client'

/** Ошибка API с кодом статуса и телом из контракта ({ code, message }). */
export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, body?: { code?: string; message?: string }) {
    super(body?.message ?? `Ошибка запроса (${status})`)
    this.name = 'ApiError'
    this.status = status
    this.code = body?.code
  }
}

export const queryKeys = {
  owner: ['owner'] as const,
  eventTypes: ['event-types'] as const,
  eventType: (id: string) => ['event-types', id] as const,
  slots: (id: string) => ['event-types', id, 'slots'] as const,
  bookings: ['bookings'] as const,
}

export function useOwner() {
  return useQuery({
    queryKey: queryKeys.owner,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/owner')
      if (error || !data) throw new ApiError(response.status, error)
      return data
    },
  })
}

export function useEventTypes() {
  return useQuery({
    queryKey: queryKeys.eventTypes,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/event-types')
      if (error || !data) throw new ApiError(response.status, error)
      return data
    },
  })
}

export function useEventType(id: string) {
  return useQuery({
    queryKey: queryKeys.eventType(id),
    queryFn: async () => {
      const { data, error, response } = await api.GET('/event-types/{id}', {
        params: { path: { id } },
      })
      if (error || !data) throw new ApiError(response.status, error)
      return data
    },
    enabled: Boolean(id),
  })
}

export function useSlots(id: string) {
  return useQuery({
    queryKey: queryKeys.slots(id),
    queryFn: async () => {
      const { data, error, response } = await api.GET(
        '/event-types/{id}/slots',
        { params: { path: { id } } },
      )
      if (error || !data) throw new ApiError(response.status, error)
      return data
    },
    enabled: Boolean(id),
  })
}

export function useBookings() {
  return useQuery({
    queryKey: queryKeys.bookings,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/bookings')
      if (error || !data) throw new ApiError(response.status, error)
      return data
    },
  })
}

export function useCreateBooking(eventTypeId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: BookingCreate) => {
      const { data, error, response } = await api.POST('/bookings', { body })
      if (error || !data) throw new ApiError(response.status, error)
      return data
    },
    onSuccess: () => {
      // Слот занят — обновляем список доступных слотов и список встреч.
      queryClient.invalidateQueries({ queryKey: queryKeys.slots(eventTypeId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings })
    },
  })
}

export function useCreateEventType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: EventTypeCreate) => {
      const { data, error, response } = await api.POST('/event-types', { body })
      if (error || !data) throw new ApiError(response.status, error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventTypes })
    },
  })
}
