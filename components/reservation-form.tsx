'use client'

import { useState, useEffect } from 'react'
import { format, addHours } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ReservationPurpose, PURPOSE_LABELS } from '@/types'

interface ReservationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  instrumentId: string
  defaultDate?: Date
  defaultHour?: number
  onCreated: () => void
}

function toDatetimeLocal(d: Date) {
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

export function ReservationForm({ open, onOpenChange, instrumentId, defaultDate, defaultHour, onCreated }: ReservationFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [purpose, setPurpose] = useState<ReservationPurpose>('data_collection')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      const base = defaultDate ?? new Date()
      const hour = defaultHour ?? (new Date().getHours() + 1)
      const start = new Date(base)
      start.setHours(hour, 0, 0, 0)
      const end = addHours(start, 2)
      setStartTime(toDatetimeLocal(start))
      setEndTime(toDatetimeLocal(end))
      setError('')
    }
  }, [open, defaultDate, defaultHour])

  const reset = () => { setName(''); setEmail(''); setNotes(''); setError(''); setPurpose('data_collection') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Name is required.'); return }
    if (!startTime || !endTime) { setError('Start and end time are required.'); return }
    if (new Date(startTime) >= new Date(endTime)) { setError('End time must be after start time.'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instrumentId, userName: name, userEmail: email, purpose, startTime, endTime, notes }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to create reservation.')
      } else {
        onCreated()
        onOpenChange(false)
        reset()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book Instrument</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rf-name">Your Name *</Label>
              <Input id="rf-name" value={name} onChange={e => setName(e.target.value)} placeholder="First Last" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-email">Email</Label>
              <Input id="rf-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@osu.edu" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <Select value={purpose} onValueChange={v => setPurpose(v as ReservationPurpose)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(PURPOSE_LABELS) as [ReservationPurpose, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rf-start">Start Time *</Label>
              <Input id="rf-start" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rf-end">End Time *</Label>
              <Input id="rf-end" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rf-notes">Notes</Label>
            <Textarea id="rf-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Sample info, method, column used…" rows={3} />
          </div>

          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); reset() }}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Booking…' : 'Confirm Reservation'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
