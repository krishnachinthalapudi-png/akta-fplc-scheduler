'use client'

import { useState } from 'react'
import { format, isPast, isToday } from 'date-fns'
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Reservation, PURPOSE_LABELS, PURPOSE_COLORS } from '@/types'
import { cn } from '@/lib/utils'

interface ReservationListProps {
  reservations: Reservation[]
  loading: boolean
  onCancel: (id: string) => void
  onRefresh: () => void
}

function getStatus(r: Reservation): 'upcoming' | 'today' | 'past' {
  if (isToday(new Date(r.startTime))) return 'today'
  if (isPast(new Date(r.endTime))) return 'past'
  return 'upcoming'
}

function ReservationRow({ r, onCancel }: { r: Reservation; onCancel: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const status = getStatus(r)

  return (
    <>
      <TableRow className={cn(status === 'past' && 'opacity-60')}>
        <TableCell>
          <Badge className={cn(PURPOSE_COLORS[r.purpose], 'text-white text-xs')}>
            {PURPOSE_LABELS[r.purpose]}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="font-medium">{r.userName}</div>
          {r.userEmail && <div className="text-xs text-muted-foreground">{r.userEmail}</div>}
        </TableCell>
        <TableCell className="text-sm">
          <div>{format(new Date(r.startTime), 'EEE, MMM d')}</div>
          <div className="text-xs text-muted-foreground">
            {format(new Date(r.startTime), 'h:mm a')} – {format(new Date(r.endTime), 'h:mm a')}
          </div>
        </TableCell>
        <TableCell>
          {status === 'today' && <Badge className="bg-blue-600 text-white">Today</Badge>}
          {status === 'upcoming' && <Badge variant="outline">Upcoming</Badge>}
          {status === 'past' && <Badge variant="secondary">Past</Badge>}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            {r.notes && (
              <Button variant="ghost" size="sm" onClick={() => setExpanded(v => !v)}>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
            {status !== 'past' && (
              <Button
                variant="ghost" size="sm"
                className="text-red-400 hover:text-red-600"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>

      {expanded && r.notes && (
        <TableRow>
          <TableCell colSpan={5} className="bg-gray-50 py-2 px-4">
            <span className="text-sm font-medium text-gray-600">Notes: </span>
            <span className="text-sm">{r.notes}</span>
            <div className="text-xs text-muted-foreground mt-1">
              Booked {format(new Date(r.createdAt), 'MMM d, yyyy h:mm a')}
            </div>
          </TableCell>
        </TableRow>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation?</DialogTitle>
            <DialogDescription>
              This will permanently remove the booking for <strong>{r.userName}</strong> on{' '}
              {format(new Date(r.startTime), 'EEEE, MMM d')} at {format(new Date(r.startTime), 'h:mm a')}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Keep</Button>
            <Button variant="destructive" onClick={() => { setConfirmOpen(false); onCancel(r.id) }}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ReservationTable({ items, onCancel }: { items: Reservation[]; onCancel: (id: string) => void }) {
  if (items.length === 0) {
    return <p className="text-center text-muted-foreground py-10 text-sm">No reservations found.</p>
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Purpose</TableHead>
          <TableHead>Researcher</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(r => <ReservationRow key={r.id} r={r} onCancel={onCancel} />)}
      </TableBody>
    </Table>
  )
}

export function ReservationList({ reservations, loading, onCancel }: ReservationListProps) {
  const upcoming = reservations.filter(r => getStatus(r) !== 'past')
  const past = reservations.filter(r => getStatus(r) === 'past')

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <Tabs defaultValue="upcoming">
          <div className="px-4 pt-4">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
              <TabsTrigger value="all">All ({reservations.length})</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="upcoming" className="mt-0"><ReservationTable items={upcoming} onCancel={onCancel} /></TabsContent>
          <TabsContent value="past" className="mt-0"><ReservationTable items={past} onCancel={onCancel} /></TabsContent>
          <TabsContent value="all" className="mt-0"><ReservationTable items={reservations} onCancel={onCancel} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
