const DAYS_SHORT = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör']
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return d
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date())
}

export function formatDayShort(date: Date): string {
  return DAYS_SHORT[date.getDay()]
}

export function formatWeekRange(start: Date, end: Date): string {
  const startDay = start.getDate()
  const startMonth = MONTHS_SHORT[start.getMonth()]
  const endDay = end.getDate()
  const endMonth = MONTHS_SHORT[end.getMonth()]
  const year = end.getFullYear()

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay} ${startMonth} ${year}`
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`
}

export function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
