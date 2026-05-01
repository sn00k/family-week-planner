import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, type FormEvent } from 'react'
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { EventSheet } from '@/components/calendar/EventSheet'
import { EVENT_ICONS } from '@/lib/eventIcons'
import { EVENT_TYPE_LABELS, EVENT_TYPES } from '@/lib/eventTypes'
import { formatTime } from '@/lib/dates'
import type { CalendarEvent, EventType } from '@/types'

export const Route = createFileRoute('/_app/_calendar/events/$eventId')({
  component: EventDetailPage,
})

function toDateString(iso: string) {
  return iso.slice(0, 10)
}

function toTimeString(iso: string) {
  return new Date(iso).toTimeString().slice(0, 5)
}

function EventDetailPage() {
  const navigate = useNavigate()
  const { eventId } = Route.useParams()
  const [event, setEvent] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const close = () => navigate({ to: '/' })

  useEffect(() => {
    getDoc(doc(db, 'events', eventId)).then((snap) => {
      if (snap.exists()) setEvent({ id: snap.id, ...snap.data() } as CalendarEvent)
      setLoading(false)
    })
  }, [eventId])

  const handleDelete = async () => {
    if (!confirm('Ta bort den här händelsen?')) return
    setDeleting(true)
    try {
      await deleteDoc(doc(db, 'events', eventId))
      close()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <EventSheet
      title={isEditing ? 'Redigera händelse' : 'Händelse'}
      onClose={isEditing ? () => setIsEditing(false) : close}
      closeLabel={isEditing ? '←' : undefined}
    >
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !event ? (
        <p className="text-sm text-gray-500 text-center py-8">Händelsen hittades inte.</p>
      ) : isEditing ? (
        <EditForm
          event={event}
          onSaved={(updated) => { setEvent(updated); setIsEditing(false) }}
        />
      ) : (
        <DetailView
          event={event}
          onEdit={() => setIsEditing(true)}
          onDelete={handleDelete}
          deleting={deleting}
        />
      )}
    </EventSheet>
  )
}

function DetailView({
  event,
  onEdit,
  onDelete,
  deleting,
}: {
  event: CalendarEvent
  onEdit: () => void
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{EVENT_ICONS[event.type]}</span>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            {EVENT_TYPE_LABELS[event.type]}
          </span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
      </div>

      <div className="flex items-start gap-3 text-sm text-gray-600">
        <span className="mt-0.5">🕐</span>
        <div>
          <p>
            {new Date(event.startTime).toLocaleDateString('sv-SE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          {!event.allDay && (
            <p className="text-gray-400 tabular-nums">
              {formatTime(event.startTime)} – {formatTime(event.endTime)}
            </p>
          )}
        </div>
      </div>

      {event.location && (
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <span className="mt-0.5">📍</span>
          <p>{event.location}</p>
        </div>
      )}

      {event.notes && (
        <div className="flex items-start gap-3 text-sm text-gray-600">
          <span className="mt-0.5">📝</span>
          <p className="whitespace-pre-wrap">{event.notes}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onEdit}
          className="flex-1 py-2.5 text-indigo-600 text-sm font-medium rounded-xl border border-indigo-200 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
        >
          Redigera
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex-1 py-2.5 text-red-500 text-sm font-medium rounded-xl border border-red-200 hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Tar bort…' : 'Ta bort'}
        </button>
      </div>
    </div>
  )
}

function EditForm({
  event,
  onSaved,
}: {
  event: CalendarEvent
  onSaved: (updated: CalendarEvent) => void
}) {
  const [title, setTitle] = useState(event.title)
  const [type, setType] = useState<EventType>(event.type)
  const [date, setDate] = useState(() => toDateString(event.startTime))
  const [allDay, setAllDay] = useState(event.allDay)
  const [startTime, setStartTime] = useState(() => toTimeString(event.startTime))
  const [endTime, setEndTime] = useState(() => toTimeString(event.endTime))
  const [location, setLocation] = useState(event.location ?? '')
  const [notes, setNotes] = useState(event.notes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const startISO = allDay
        ? new Date(`${date}T00:00:00`).toISOString()
        : new Date(`${date}T${startTime}`).toISOString()
      const endISO = allDay
        ? new Date(`${date}T23:59:59`).toISOString()
        : new Date(`${date}T${endTime}`).toISOString()

      const patch = {
        title: title.trim(),
        type,
        startTime: startISO,
        endTime: endISO,
        allDay,
        location: location.trim() || null,
        notes: notes.trim() || null,
      }

      await updateDoc(doc(db, 'events', event.id), patch)
      onSaved({
        ...event,
        ...patch,
        location: patch.location ?? undefined,
        notes: patch.notes ?? undefined,
      })
    } catch {
      setError('Något gick fel. Försök igen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Titel</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
        />
      </div>

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
        {loading ? 'Sparar…' : 'Spara ändringar'}
      </button>
    </form>
  )
}
