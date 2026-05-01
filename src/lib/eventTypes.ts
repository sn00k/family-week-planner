import type { EventType } from '@/types'

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  lunch: 'Lunch',
  dinner: 'Middag',
  pickup: 'Hämtning',
  dropoff: 'Lämning',
  trip: 'Resa',
  appointment: 'Möte/tid',
  other: 'Övrigt',
}

export const EVENT_TYPES: EventType[] = [
  'pickup', 'dropoff', 'lunch', 'dinner', 'trip', 'appointment', 'other',
]
