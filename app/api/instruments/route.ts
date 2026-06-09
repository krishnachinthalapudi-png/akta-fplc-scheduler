import { NextResponse } from 'next/server'
import { getInstruments, addInstrument } from '@/lib/store'
import { INSTRUMENT_COLORS } from '@/types'

export async function GET() {
  const instruments = await getInstruments()
  return NextResponse.json(instruments)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description = '', color } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    const instruments = await getInstruments()
    const assignedColor = color ?? INSTRUMENT_COLORS[instruments.length % INSTRUMENT_COLORS.length]
    const instrument = await addInstrument({ name: name.trim(), description: description.trim(), color: assignedColor })
    return NextResponse.json(instrument, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create instrument.' }, { status: 500 })
  }
}
