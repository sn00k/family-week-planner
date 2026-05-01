import { useState, useRef } from 'react'
import {
  getWeekStart,
  addDays,
  isSameDay,
  isToday,
  formatDayShort,
  formatWeekRange,
  formatTime,
} from '@/lib/dates'
import { useWeekEvents } from '@/hooks/useWeekEvents'
import { EVENT_ICONS } from '@/lib/eventIcons'
import EventChip from './EventChip'
import type { UserProfile } from '@/types'

interface Props {
  familyId: string
  familyName: string
  members: UserProfile[]
  onAddEvent: () => void
  onEventClick: (eventId: string) => void
  onMembersClick: () => void
  onSettingsClick: () => void
}

export default function WeekView({ familyId, familyName, members, onAddEvent, onEventClick, onMembersClick, onSettingsClick }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [selectedDay, setSelectedDay] = useState(() => new Date())
  const prevWeekStart = useRef(weekStart)

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const weekEnd = days[6]
  const { events } = useWeekEvents(familyId, weekStart)

  const memberColorMap = Object.fromEntries(members.map((m) => [m.uid, m.color]))
  const eventsForDay = (day: Date) => events.filter((e) => isSameDay(new Date(e.startTime), day))
  const isCurrentWeek = isSameDay(weekStart, getWeekStart(new Date()))

  if (!isSameDay(weekStart, prevWeekStart.current)) {
    prevWeekStart.current = weekStart
    setSelectedDay(days[0])
  }

  const selectedDayEvents = eventsForDay(selectedDay)

  const header = (
    <header className="px-4 py-3 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
      <h1 className="text-base font-semibold text-gray-900">{familyName}</h1>
      <div className="flex items-center gap-1">
        <button
          onClick={onMembersClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors text-base"
          aria-label="Familjemedlemmar"
        >
          👥
        </button>
        <button
          onClick={onSettingsClick}
          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors text-base"
          aria-label="Inställningar"
        >
          ⚙️
        </button>
        <button
          onClick={onAddEvent}
          className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm active:bg-indigo-700 transition-colors"
          aria-label="Lägg till händelse"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="10" y1="4" x2="10" y2="16"/>
            <line x1="4" y1="10" x2="16" y2="10"/>
          </svg>
        </button>
      </div>
    </header>
  )

  const weekNav = (
    <div className="px-3 py-2 flex items-center gap-1 border-b border-gray-100 flex-shrink-0">
      <button
        onClick={() => setWeekStart((d) => addDays(d, -7))}
        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 transition-colors text-sm"
        aria-label="Föregående vecka"
      >
        ←
      </button>
      <span className="flex-1 text-center text-sm font-medium text-gray-700 tabular-nums">
        {formatWeekRange(weekStart, weekEnd)}
      </span>
      <button
        onClick={() => setWeekStart((d) => addDays(d, 7))}
        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 transition-colors text-sm"
        aria-label="Nästa vecka"
      >
        →
      </button>
      {!isCurrentWeek && (
        <button
          onClick={() => { setWeekStart(getWeekStart(new Date())); setSelectedDay(new Date()) }}
          className="ml-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
        >
          Idag
        </button>
      )}
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-white">
      {header}
      {weekNav}

      {/* ── Mobile layout: week strip + selected-day list ── */}
      <div className="md:hidden flex flex-col flex-1 overflow-hidden">
        {/* Week strip */}
        <div className="grid grid-cols-7 border-b border-gray-100 flex-shrink-0">
          {days.map((day) => {
            const today = isToday(day)
            const selected = isSameDay(day, selectedDay)
            const dayEvents = eventsForDay(day)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className="flex flex-col items-center pt-2 pb-2 transition-colors"
              >
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                  {formatDayShort(day)}
                </span>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    today ? 'bg-indigo-600' : selected ? 'bg-gray-100' : ''
                  }`}
                >
                  <span className={`text-sm font-semibold tabular-nums ${today ? 'text-white' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </span>
                </div>
                <div className="flex gap-0.5 mt-1.5 h-2 items-center">
                  {dayEvents.slice(0, 3).map((e, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: memberColorMap[e.createdBy] ?? '#6366f1' }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-gray-400 ml-0.5">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Day event list */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs font-medium text-gray-400 capitalize">
              {selectedDay.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {selectedDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-300">
              <span className="text-4xl mb-2">📅</span>
              <p className="text-sm">Inga händelser</p>
            </div>
          ) : (
            <div className="px-4 space-y-2 pb-6">
              {selectedDayEvents.map((event) => {
                const color = memberColorMap[event.createdBy] ?? '#6366f1'
                return (
                  <button
                    key={event.id}
                    onClick={() => onEventClick(event.id)}
                    className="w-full text-left flex items-start gap-3 p-3 rounded-2xl border border-gray-100 active:bg-gray-50 transition-colors"
                    style={{ borderLeftColor: color, borderLeftWidth: 3 }}
                  >
                    <span className="text-xl mt-0.5 leading-none">{EVENT_ICONS[event.type]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                      {!event.allDay && (
                        <p className="text-xs text-gray-400 tabular-nums mt-0.5">
                          {formatTime(event.startTime)} – {formatTime(event.endTime)}
                        </p>
                      )}
                      {event.location && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">📍 {event.location}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Desktop/tablet layout: 7-column grid ── */}
      <div className="hidden md:flex md:flex-col md:flex-1">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {days.map((day) => {
            const today = isToday(day)
            return (
              <div key={day.toISOString()} className="flex flex-col items-center pt-3 pb-2">
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide mb-1">
                  {formatDayShort(day)}
                </span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${today ? 'bg-indigo-600' : ''}`}>
                  <span className={`text-sm font-semibold tabular-nums ${today ? 'text-white' : 'text-gray-900'}`}>
                    {day.getDate()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Event columns */}
        <div className="grid grid-cols-7 flex-1">
          {days.map((day) => {
            const dayEvents = eventsForDay(day)
            const today = isToday(day)
            return (
              <div
                key={`events-${day.toISOString()}`}
                className={`border-r border-gray-50 last:border-r-0 px-0.5 py-1 space-y-0.5 min-h-32 ${today ? 'bg-indigo-50/40' : ''}`}
              >
                {dayEvents.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    color={memberColorMap[event.createdBy] ?? '#6366f1'}
                    onClick={() => onEventClick(event.id)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
