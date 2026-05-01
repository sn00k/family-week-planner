import { createPortal } from 'react-dom'
import { useRef, useEffect } from 'react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  onClose: () => void
  closeLabel?: string
  children: ReactNode
}

export function EventSheet({ title, onClose, closeLabel, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragHandleRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const currentDelta = useRef(0)

  useEffect(() => {
    const handle = dragHandleRef.current
    const sheet = sheetRef.current
    if (!handle || !sheet) return

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      currentDelta.current = 0
      sheet.style.transition = 'none'
    }

    const onTouchMove = (e: TouchEvent) => {
      const delta = e.touches[0].clientY - touchStartY.current
      if (delta > 0) {
        e.preventDefault()
        currentDelta.current = delta
        sheet.style.transform = `translateY(${delta}px)`
      }
    }

    const onTouchEnd = () => {
      const delta = currentDelta.current
      if (delta > 80) {
        sheet.style.transition = 'transform 0.25s ease-in'
        sheet.style.transform = 'translateY(100%)'
        setTimeout(onClose, 220)
      } else {
        sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)'
        sheet.style.transform = ''
      }
    }

    handle.addEventListener('touchstart', onTouchStart, { passive: true })
    handle.addEventListener('touchmove', onTouchMove, { passive: false })
    handle.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      handle.removeEventListener('touchstart', onTouchStart)
      handle.removeEventListener('touchmove', onTouchMove)
      handle.removeEventListener('touchend', onTouchEnd)
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={sheetRef}
        className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto animate-sheet-in"
      >
        <div
          ref={dragHandleRef}
          className="sm:hidden flex justify-center pt-6 pb-3 touch-none cursor-grab"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors text-sm"
            aria-label="Stäng"
          >
            {closeLabel ?? '✕'}
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
