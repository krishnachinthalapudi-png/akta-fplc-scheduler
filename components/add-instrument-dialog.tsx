'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { INSTRUMENT_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface AddInstrumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
  existingCount: number
}

export function AddInstrumentDialog({ open, onOpenChange, onCreated, existingCount }: AddInstrumentDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(INSTRUMENT_COLORS[existingCount % INSTRUMENT_COLORS.length])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => { setName(''); setDescription(''); setError('') }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Instrument name is required.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/instruments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, color: selectedColor }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to add instrument.'); return }
      onCreated()
      onOpenChange(false)
      reset()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Instrument</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="inst-name">Instrument Name *</Label>
            <Input id="inst-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ÄKTA FPLC, Cryo-EM Grid Plunger" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inst-desc">Description</Label>
            <Textarea id="inst-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of the instrument and its use…" rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {INSTRUMENT_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'w-7 h-7 rounded-full transition-all',
                    color,
                    selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-105'
                  )}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
          </div>
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onOpenChange(false); reset() }}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add Instrument'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
