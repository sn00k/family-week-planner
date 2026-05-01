import type { CalendarEvent } from '@/types'
import { EVENT_ICONS } from '@/lib/eventIcons'
import { formatTime } from '@/lib/dates'

interface Props {
  event: CalendarEvent
  color: string
  onClick: () => void
}

export default function EventChip({ event, color, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      style={{ borderLeftColor: color, backgroundColor: `${color}1a` }}
      className="w-full text-left border-l-2 rounded-sm px-1 py-0.5 active:opacity-70 transition-opacity"
    >
      <p className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
        {EVENT_ICONS[event.type]} {event.title}
      </p>
      {!event.allDay && (
        <p className="text-[12px] text-gray-500 leading-tight tabular-nums">
          {formatTime(event.startTime)}
        </p>
      )}
    </button>
  )
}
