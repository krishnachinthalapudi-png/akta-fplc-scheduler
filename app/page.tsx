'use client'

import { useState, useEffect, useCallback } from 'react'
import { isToday } from 'date-fns'
import { Plus, FlaskConical, Microscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Instrument, Reservation } from '@/types'
import { InstrumentCard } from '@/components/instrument-card'
import { AddInstrumentDialog } from '@/components/add-instrument-dialog'

export default function Home() {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [instRes, resRes] = await Promise.all([
        fetch('/api/instruments'),
        fetch('/api/reservations'),
      ])
      const [insts, ress] = await Promise.all([instRes.json(), resRes.json()])
      setInstruments(insts)
      setReservations(ress)
    } catch (e) {
      console.error('Failed to fetch data', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const getTodayCount = (instrumentId: string) =>
    reservations.filter(r => r.instrumentId === instrumentId && isToday(new Date(r.startTime))).length

  const getUpcomingCount = (instrumentId: string) =>
    reservations.filter(r => r.instrumentId === instrumentId && new Date(r.endTime) > new Date()).length

  const handleDelete = async (id: string) => {
    await fetch(`/api/instruments/${id}`, { method: 'DELETE' })
    fetchData()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Microscope className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lab Instrument Scheduler</h1>
              <p className="text-blue-100 text-sm">Chinthalapudi Lab · Pelotonia Research Center · OSU</p>
            </div>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="bg-white text-blue-700 hover:bg-blue-50 font-semibold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Instrument
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-48 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : instruments.length === 0 ? (
          <div className="text-center py-20">
            <FlaskConical className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">No instruments yet</p>
            <p className="text-gray-400 text-sm mt-1">Click &quot;Add Instrument&quot; to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {instruments.map(inst => (
              <InstrumentCard
                key={inst.id}
                instrument={inst}
                todayCount={getTodayCount(inst.id)}
                upcomingCount={getUpcomingCount(inst.id)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>

      <AddInstrumentDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={fetchData}
        existingCount={instruments.length}
      />
    </div>
  )
}
