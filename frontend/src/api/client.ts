import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

/**
 * Базовый URL API. По умолчанию — mock-сервер Prism (порт 4010).
 * Реальный бэкенд задаётся через переменную окружения VITE_API_BASE_URL.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4010'

export const api = createClient<paths>({ baseUrl: API_BASE_URL })

// Удобные псевдонимы доменных типов из контракта.
export type Owner = components['schemas']['Owner']
export type EventType = components['schemas']['EventType']
export type EventTypeCreate = components['schemas']['EventTypeCreate']
export type Slot = components['schemas']['Slot']
export type Booking = components['schemas']['Booking']
export type BookingCreate = components['schemas']['BookingCreate']
export type ApiErrorBody =
  | components['schemas']['NotFoundError']
  | components['schemas']['SlotTakenError']
  | components['schemas']['ValidationError']
