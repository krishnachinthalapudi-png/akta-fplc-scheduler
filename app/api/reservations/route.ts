import { NextResponse } from 'next/server'
import { getReservations, addReservation, hasConflict } from '@/lib/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instrumentId = searchParams.get('instrumentId') ?? undefined
  const reservations = await getReservations(instrumentId)
  return NextResponse.json(reservations)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { instrumentId, userName, userEmail = '', purpose, startTime, endTime, notes = '' } = body

    if (!instrumentId) return NextResponse.json({ error: 'Instrument ID is required.' }, { status: 400 })
    if (!userName?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    if (!startTime || !endTime) return NextResponse.json({ error: 'Start and end time are required.' }, { status: 400 })
    if (new Date(startTime) >= new Date(endTime)) return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 })

    const conflict = await hasConflict(instrumentId, startTime, endTime)
    if (conflict) return NextResponse.json({ error: 'This time slot conflicts with an existing reservation for this instrument.' }, { status: 409 })

    const reservation = await addReservation({ instrumentId, userName: userName.trim(), userEmail, purpose, startTime, endTime, notes })
    return NextResponse.json(reservation, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create reservation.' }, { status: 500 })
  }
}
