'use client'

import { useState } from 'react'
import { format, addWeeks, subWeeks, startOfWeek, addDays, isToday, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Reservation, PURPOSE_COLORS, PURPOSE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const START_HOUR = 7
const END_HOUR = 22
const SLOT_H = 52

interface WeeklyCalendarProps {
  reservations: Reservation[]
  loading: boolean
  onSlotClick: (day: Date, hour: number) => void
  onReservationClick: (res: Reservation) => void
}

function getBlockStyle(r: Reservation) {
  const start = new Date(r.startTime)
  const end = new Date(r.endTime)
  const startMins = start.getHours() * 60 + start.getMinutes()
  const endMins = end.getHours() * 60 + end.getMinutes()
  const top = ((startMins - START_HOUR * 60) / 60) * SLOT_H
  const height = Math.max(((endMins - startMins) / 60) * SLOT_H, 22)
  return { top, height }
}

export function WeeklyCalendar({ reservations, loading, onSlotClick, onReservationClick }: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)
  const totalHeight = (END_HOUR - START_HOUR) * SLOT_H

  const getDayReservations = (day: Date) =>
    reservations.filter(r => isSameDay(new Date(r.startTime), day))

  return (
    <div className="flex flex-col bg-white">
      {/* Navigation bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => setWeekStart(w => subWeeks(w, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setWeekStart(w => addWeeks(w, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="ml-1"
            onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Today
          </Button>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
        </span>
      </div>

      {/* Day headers */}
      <div className="flex border-b sticky top-0 bg-white z-20">
        <div className="w-14 flex-shrink-0" />
        {days.map(day => (
          <div key={day.toISOString()} className="flex-1 text-center py-2 border-l">
            <div className={cn(
              'text-xs font-medium uppercase tracking-wide',
              isToday(day) ? 'text-blue-600' : 'text-muted-foreground'
            )}>
              {format(day, 'EEE')}
            </div>
            <div className={cn('text-lg font-semibold mx-auto w-fit')}>
              {isToday(day) ? (
                <span className="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  {format(day, 'd')}
                </span>
              ) : (
                <span className="text-gray-800">{format(day, 'd')}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable time grid */}
      <div className="flex overflow-y-auto" style={{ maxHeight: '560px' }}>
        {/* Hour labels */}
        <div className="w-14 flex-shrink-0 border-r bg-white">
          {hours.map(h => (
            <div key={h} style={{ height: SLOT_H }} className="flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map(day => {
          const dayRes = getDayReservations(day)
          return (
            <div
              key={day.toISOString()}
              className={cn('flex-1 border-l relative', isToday(day) ? 'bg-blue-50/30' : 'bg-white')}
              style={{ height: totalHeight }}
            >
              {/* Hour grid lines + click targets */}
              {hours.map((h, i) => (
                <div
                  key={h}
                  style={{ position: 'absolute', top: i * SLOT_H, left: 0, right: 0, height: SLOT_H }}
                  className="border-b border-gray-100 cursor-pointer hover:bg-blue-50/60 transition-colors"
                  onClick={() => onSlotClick(day, h)}
                />
              ))}

              {/* Reservation blocks */}
              {!loading && dayRes.map(res => {
                const { top, height } = getBlockStyle(res)
                return (
                  <div
                    key={res.id}
                    className={cn(
                      'absolute rounded text-white text-xs p-1 cursor-pointer overflow-hidden z-10 shadow-sm',
                      'opacity-90 hover:opacity-100 transition-opacity',
                      PURPOSE_COLORS[res.purpose]
                    )}
                    style={{ top, height, left: 2, right: 2 }}
                    onClick={e => { e.stopPropagation(); onReservationClick(res) }}
                  >
                    <div className="font-semibold truncate leading-tight">{res.userName}</div>
                    {height > 34 && <div className="truncate opacity-90 text-[10px]">{PURPOSE_LABELS[res.purpose]}</div>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
