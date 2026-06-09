import { NextResponse } from 'next/server'
import { deleteReservation } from '@/lib/store'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const success = await deleteReservation(id)
  if (!success) {
    return NextResponse.json({ error: 'Reservation not found.' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
