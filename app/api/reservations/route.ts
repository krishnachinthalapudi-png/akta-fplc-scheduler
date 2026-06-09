import { NextResponse } from 'next/server'
import { getReservations, addReservation, hasConflict } from '@/lib/store'

export async function GET() {
  const reservations = await getReservations()
  return NextResponse.json(reservations)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userName, userEmail, purpose, startTime, endTime, notes } = body

    if (!userName?.trim() || !purpose || !startTime || !endTime) {
      return NextResponse.json({ error: 'Name, purpose, and time range are required.' }, { status: 400 })
    }

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time format.' }, { status: 400 })
    }

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 })
    }

    const durationMinutes = (end.getTime() - start.getTime()) / 60000
    if (durationMinutes < 30) {
      return NextResponse.json({ error: 'Minimum reservation duration is 30 minutes.' }, { status: 400 })
    }

    const conflict = await hasConflict(startTime, endTime)
    if (conflict) {
      return NextResponse.json(
        { error: 'This time slot overlaps with an existing reservation. Please choose a different time.' },
        { status: 409 }
      )
    }

    const reservation = await addReservation({
      userName: userName.trim(),
      userEmail: userEmail?.trim() || '',
      purpose,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      notes: notes?.trim() || '',
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }
}
