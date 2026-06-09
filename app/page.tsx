'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns'
import { CalendarDays, Clock, BarChart3, Plus, FlaskConical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { WeeklyCalendar } from '@/components/weekly-calendar'
import { ReservationForm } from '@/components/reservation-form'
import { ReservationList } from '@/components/reservation-list'
import { Reservation, PURPOSE_LABELS, PURPOSE_COLORS } from '@/types'

export default function Home() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>()
  const [defaultHour, setDefaultHour] = useState<number | undefined>()
  const [detailRes, setDetailRes] = useState<Reservation | null>(null)

  const fetchReservations = useCallback(async () => {
    try {
      const res = await fetch('/api/reservations')
      const data = await res.json()
      setReservations(data)
    } catch (e) {
      console.error('Failed to fetch reservations', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchReservations() }, [fetchReservations])

  const todayReservations = reservations.filter(r => isToday(new Date(r.startTime)))
  const bookedHoursToday = todayReservations.reduce((acc, r) => {
    const diff = (new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 3_600_000
    return acc + diff
  }, 0)
  const availableHoursToday = Math.max(0, 15 - bookedHoursToday)

  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const weekReservations = reservations.filter(r => {
    const d = new Date(r.startTime)
    return d >= weekStart && d <= weekEnd
  })

  const handleSlotClick = (day: Date, hour: number) => {
    setDefaultDate(day)
    setDefaultHour(hour)
    setFormOpen(true)
  }

  const handleCancel = async (id: string) => {
    await fetch(`/api/reservations/${id}`, { method: 'DELETE' })
    setDetailRes(null)
    fetchReservations()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ÄKTA FPLC Scheduler</h1>
              <p className="text-blue-100 text-sm">Chinthalapudi Lab · Pelotonia Research Center · OSU</p>
            </div>
          </div>
          <Button
            onClick={() => { setDefaultDate(undefined); setDefaultHour(undefined); setFormOpen(true) }}
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Reserve Instrument
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Today&apos;s Bookings</p>
                  <p className="text-3xl font-bold text-blue-700">{todayReservations.length}</p>
                </div>
                <CalendarDays className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Available Hours Today</p>
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
                  <p className="text-3xl font-bold text-violet-600">{weekReservations.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-violet-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="calendar">
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">
              <CalendarDays className="h-4 w-4 mr-2" />Calendar View
            </TabsTrigger>
            <TabsTrigger value="list">
              <BarChart3 className="h-4 w-4 mr-2" />All Reservations
            </TabsTrigger>
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
            <ReservationList
              reservations={reservations}
              loading={loading}
              onCancel={handleCancel}
              onRefresh={fetchReservations}
            />
          </TabsContent>
        </Tabs>
      </main>

      <ReservationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultDate={defaultDate}
        defaultHour={defaultHour}
        onCreated={fetchReservations}
      />

      {detailRes && (
        <Dialog open={!!detailRes} onOpenChange={() => setDetailRes(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reservation Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Badge className={`${PURPOSE_COLORS[detailRes.purpose]} text-white`}>
                {PURPOSE_LABELS[detailRes.purpose]}
              </Badge>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Researcher</p>
                  <p className="font-medium">{detailRes.userName}</p>
                  <p className="text-muted-foreground">{detailRes.userEmail}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Time</p>
                  <p className="font-medium">{format(new Date(detailRes.startTime), 'EEE MMM d')}</p>
                  <p className="text-muted-foreground">
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
              <p className="text-xs text-muted-foreground">
                Booked {format(new Date(detailRes.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailRes(null)}>Close</Button>
              <Button variant="destructive" onClick={() => handleCancel(detailRes.id)}>
                Cancel Reservation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
