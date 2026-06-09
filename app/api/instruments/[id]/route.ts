import { NextResponse } from 'next/server'
import { deleteInstrument } from '@/lib/store'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const success = await deleteInstrument(id)
  if (!success) return NextResponse.json({ error: 'Instrument not found.' }, { status: 404 })
  return NextResponse.json({ success: true })
}
