export type EventType =
  | 'lunch'
  | 'dinner'
  | 'pickup'
  | 'dropoff'
  | 'trip'
  | 'appointment'
  | 'other'

export interface Family {
  id: string
  name: string
  adminId: string
  members: string[]
}

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  color: string
  familyId: string
  createdAt: string
}

export interface InviteCode {
  familyId: string
  createdBy: string
  createdAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  type: EventType
  startTime: string
  endTime: string
  allDay: boolean
  location?: string
  notes?: string
  createdBy: string
  familyId: string
  color: string
  recurring?: RecurringRule
}

export interface RecurringRule {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval: number
  endDate?: string
  daysOfWeek?: number[]
}
