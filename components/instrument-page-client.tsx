'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { ArrowLeft, CalendarDays, Clock, BarChart3, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { WeeklyCalendar } from '@/components/weekly-calendar'
import { ReservationForm } from '@/components/reservation-form'
import { ReservationList } from '@/components/reservation-list'
import { Instrument, Reservation, PURPOSE_LABELS, PURPOSE_COLORS } from '@/types'
import { cn } from '@/lib/utils'

export function InstrumentPageClient({ instrumentId }: { instrumentId: string }) {
  const router = useRouter()
  const [instrument, setInstrument] = useState<Instrument | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>()
  const [defaultHour, setDefaultHour] = useState<number | undefined>()
  const [detailRes, setDetailRes] = useState<Reservation | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [instRes, resRes] = await Promise.all([
        fetch(`/api/instruments`),
        fetch(`/api/reservations?instrumentId=${instrumentId}`),
      ])
      const [insts, ress] = await Promise.all([instRes.json(), resRes.json()])
      const inst = insts.find((i: Instrument) => i.id === instrumentId)
      if (!inst) { router.push('/'); return }
      setInstrument(inst)
      setReservations(ress)
    } catch (e) {
      console.error('Failed to fetch', e)
    } finally {
      setLoading(false)
    }
  }, [instrumentId, router])

  useEffect(() => { fetchData() }, [fetchData])

  if (!instrument && !loading) return null

  const todayRes = reservations.filter(r => isToday(new Date(r.startTime)))
  const bookedHoursToday = todayRes.reduce((acc, r) =>
    acc + (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 3_600_000, 0)
  const availableHoursToday = Math.max(0, 15 - bookedHoursToday)
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekRes = reservations.filter(r => { const d = new Date(r.startTime); return d >= weekStart && d <= weekEnd })

  const handleSlotClick = (day: Date, hour: number) => {
    setDefaultDate(day); setDefaultHour(hour); setFormOpen(true)
  }

  const handleCancel = async (id: string) => {
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    setDetailRes(null)
    fetchData()
  }

  const color = instrument?.color ?? 'bg-blue-500'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={cn('text-white shadow-lg', color)}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 -ml-2" onClick={() => router.push('/')}>
              <ArrowLeft className="h-4 w-4 mr-1" /> All Instruments
            </Button>
            <div className="w-px h-6 bg-white/30" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">{instrument?.name ?? '…'}</h1>
              {instrument?.description && <p className="text-white/80 text-sm">{instrument.description}</p>}
            </div>
          </div>
          <Button
            onClick={() => { setDefaultDate(undefined); setDefaultHour(undefined); setFormOpen(true) }}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold border border-white/30"
          >
            <Plus className="h-4 w-4 mr-2" />Reserve
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today&apos;s Bookings</p>
                  <p className="text-3xl font-bold text-blue-700">{todayRes.length}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Today</p>
                  <p className="text-3xl font-bold text-emerald-600">{availableHoursToday.toFixed(1)}h</p>
                </div>
                <Clock className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-3xl font-bold text-violet-600">{weekRes.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-violet-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-2" />Calendar</TabsTrigger>
            <TabsTrigger value="list"><BarChart3 className="h-4 w-4 mr-2" />All Reservations</TabsTrigger>
          </TabsList>
          <TabsContent value="calendar">
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <WeeklyCalendar
                  reservations={reservations}
                  loading={loading}
                  onSlotClick={handleSlotClick}
                  onReservationClick={setDetailRes}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="list">
            <ReservationList reservations={reservations} loading={loading} onCancel={handleCancel} onRefresh={fetchData} />
          </TabsContent>
        </Tabs>
      </main>

      <ReservationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        instrumentId={instrumentId}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        onCreated={fetchData}
      />

      {detailRes && (
        <Dialog open={!!detailRes} onOpenChange={() => setDetailRes(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Reservation Details</DialogTitle></DialogHeader>
            <div className="space-y-3 py-2">
              <Badge className={cn(PURPOSE_COLORS[detailRes.purpose], 'text-white')}>
                {PURPOSE_LABELS[detailRes.purpose]}
              </Badge>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Researcher</p>
                  <p className="font-medium">{detailRes.userName}</p>
                  <p className="text-muted-foreground text-xs">{detailRes.userEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Time</p>
                  <p className="font-medium">{format(new Date(detailRes.startTime), 'EEE MMM d')}</p>
                  <p className="text-muted-foreground text-xs">
                    {format(new Date(detailRes.startTime), 'h:mm a')} – {format(new Date(detailRes.endTime), 'h:mm a')}
                  </p>
                </div>
              </div>
              {detailRes.notes && (
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 rounded p-2">{detailRes.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailRes(null)}>Close</Button>
              <Button variant="destructive" onClick={() => handleCancel(detailRes.id)}>Cancel Reservation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
