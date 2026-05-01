import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { collection, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/auth'
import { useUserProfile } from '@/hooks/useUserProfile'
import { EventSheet } from '@/components/calendar/EventSheet'
import { EVENT_TYPE_LABELS, EVENT_TYPES } from '@/lib/eventTypes'
import { EVENT_ICONS } from '@/lib/eventIcons'
import type { EventType } from '@/types'

export const Route = createFileRoute('/_app/_calendar/events/new')({
  component: CreateEventPage,
})

function todayString() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function offsetHour(offset: number) {
  const d = new Date()
  d.setHours(d.getHours() + offset, 0, 0, 0)
  return d.toTimeString().slice(0, 5)
}

function CreateEventPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: profile } = useUserProfile(user?.uid)

  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('other')
  const [date, setDate] = useState(todayString)
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState(() => offsetHour(1))
  const [endTime, setEndTime] = useState(() => offsetHour(2))
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const close = () => navigate({ to: '/' })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !profile?.familyId) return
    setLoading(true)
    setError('')
    try {
      const startISO = allDay
        ? new Date(`${date}T00:00:00`).toISOString()
        : new Date(`${date}T${startTime}`).toISOString()
      const endISO = allDay
        ? new Date(`${date}T23:59:59`).toISOString()
        : new Date(`${date}T${endTime}`).toISOString()

      await addDoc(collection(db, 'events'), {
        title: title.trim(),
        type,
        startTime: startISO,
        endTime: endISO,
        allDay,
        location: location.trim() || null,
        notes: notes.trim() || null,
        createdBy: user.uid,
        familyId: profile.familyId,
        color: profile.color,
        createdAt: Timestamp.now(),
      })

      close()
    } catch {
      setError('Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <EventSheet title="Ny händelse" onClose={close}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Vad händer?"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Typ</label>
          <div className="grid grid-cols-4 gap-1.5">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border text-xs font-medium transition-colors ${
                  type === t
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span className="text-base">{EVENT_ICONS[t]}</span>
                <span className="truncate w-full text-center">{EVENT_TYPE_LABELS[t]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>

        {/* All-day toggle */}
        <div className="flex items-center justify-between py-1">
          <span className="text-sm font-medium text-gray-700">Hela dagen</span>
          <button
            type="button"
            onClick={() => setAllDay((v) => !v)}
            className={`relative w-11 h-6 rounded-full transition-colors ${allDay ? 'bg-indigo-600' : 'bg-gray-200'}`}
            aria-checked={allDay}
            role="switch"
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${allDay ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        {/* Start / End time */}
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Starttid</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sluttid</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Plats <span className="text-gray-400 font-normal">(valfritt)</span>
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Var sker det?"
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Anteckningar <span className="text-gray-400 font-normal">(valfritt)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Övrig information…"
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? 'Sparar…' : 'Spara händelse'}
        </button>
      </form>
    </EventSheet>
  )
}
