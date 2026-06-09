'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Clock, Trash2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Instrument } from '@/types'
import { cn } from '@/lib/utils'

interface InstrumentCardProps {
  instrument: Instrument
  todayCount: number
  upcomingCount: number
  onDelete: (id: string) => void
}

export function InstrumentCard({ instrument, todayCount, upcomingCount, onDelete }: InstrumentCardProps) {
  const router = useRouter()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <Card
        className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer group overflow-hidden"
        onClick={() => router.push(`/instruments/${instrument.id}`)}
      >
        {/* Color bar */}
        <div className={cn('h-2 w-full', instrument.color)} />
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                {instrument.name}
              </h2>
              {instrument.description && (
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{instrument.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-300 hover:text-red-500 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={e => { e.stopPropagation(); setConfirmOpen(true) }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 p-1.5 rounded-md">
                <CalendarDays className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-sm font-semibold">{todayCount} booking{todayCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-emerald-50 p-1.5 rounded-md">
                <Clock className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Upcoming</p>
                <p className="text-sm font-semibold">{upcomingCount} total</p>
              </div>
            </div>
          </div>

          <div className={cn(
            'mt-4 flex items-center justify-between rounded-lg px-3 py-2',
            'bg-gray-50 group-hover:bg-blue-50 transition-colors'
          )}>
            <span className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">
              View Schedule
            </span>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent onClick={e => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Remove Instrument?</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{instrument.name}</strong> and all its reservations. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { setConfirmOpen(false); onDelete(instrument.id) }}>
              Yes, Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
