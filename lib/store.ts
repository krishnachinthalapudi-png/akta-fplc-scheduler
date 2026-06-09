import { Instrument, Reservation, INSTRUMENT_COLORS } from '@/types'

// ── In-memory fallback ──────────────────────────────────────────────────────
const now = new Date()
const d = (daysOffset: number, h: number, m = 0) => {
  const d = new Date(now)
  d.setDate(d.getDate() + daysOffset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

const memInstruments: Instrument[] = [
  { id: 'leica-plunger', name: 'Leica Plunger', description: 'Cryo-plunger for vitrification of cryo-EM samples', color: 'bg-blue-500', createdAt: new Date().toISOString() },
  { id: 'akta1', name: 'Akta1', description: 'ÄKTA FPLC #1 — protein purification', color: 'bg-emerald-500', createdAt: new Date().toISOString() },
  { id: 'akta2', name: 'Akta 2', description: 'ÄKTA FPLC #2 — size exclusion & ion exchange', color: 'bg-violet-500', createdAt: new Date().toISOString() },
  { id: 'mass-photometer', name: 'Mass Photometer', description: 'Mass photometry for protein complex characterization', color: 'bg-orange-500', createdAt: new Date().toISOString() },
  { id: 'nanotemper', name: 'Nanotemper', description: 'MST / nanoDSF thermal stability measurements', color: 'bg-pink-500', createdAt: new Date().toISOString() },
]

const memReservations: Reservation[] = [
  { id: 'r1', instrumentId: 'leica-plunger', userName: 'Sarah Chen', userEmail: 'chen.1234@osu.edu', purpose: 'sample_prep', startTime: d(0, 9), endTime: d(0, 11), notes: 'Vitrifying dysferlin-liposome samples', createdAt: d(-1, 10) },
  { id: 'r2', instrumentId: 'akta1', userName: 'Marcus Webb', userEmail: 'webb.567@osu.edu', purpose: 'data_collection', startTime: d(0, 13), endTime: d(0, 16), notes: 'SEC run for NMM2A purification', createdAt: d(-2, 14) },
  { id: 'r3', instrumentId: 'akta2', userName: 'Priya Nair', userEmail: 'nair.89@osu.edu', purpose: 'method_development', startTime: d(1, 10), endTime: d(1, 13), notes: 'Optimizing ion exchange gradient', createdAt: d(-1, 9) },
  { id: 'r4', instrumentId: 'mass-photometer', userName: 'James Liu', userEmail: 'liu.345@osu.edu', purpose: 'data_collection', startTime: d(1, 14), endTime: d(1, 16), notes: 'Checking oligomeric state of dysferlin C2 domains', createdAt: d(-1, 11) },
  { id: 'r5', instrumentId: 'nanotemper', userName: 'Aisha Patel', userEmail: 'patel.678@osu.edu', purpose: 'data_collection', startTime: d(2, 9), endTime: d(2, 12), notes: 'MST binding assay — dysferlin + PIP2 liposomes', createdAt: d(0, 8) },
]

let nextId = 6

function memSortRes() { return [...memReservations].sort((a, b) => a.startTime.localeCompare(b.startTime)) }

// ── Neon helpers ───────────────────────────────────────────────────────────
type NeonSQL = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]>
let _sql: NeonSQL | null = null
async function getSQL(): Promise<NeonSQL> {
  if (!_sql) {
    const { neon } = await import('@neondatabase/serverless')
    _sql = neon(process.env.DATABASE_URL!) as NeonSQL
  }
  return _sql
}

let tableReady = false
async function ensureTables() {
  if (tableReady) return
  const sql = await getSQL()
  await sql`CREATE TABLE IF NOT EXISTS instruments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'bg-blue-500',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    instrument_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL DEFAULT '',
    purpose TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  // Seed instruments if empty
  const existing = await sql`SELECT id FROM instruments LIMIT 1`
  if (existing.length === 0) {
    for (const inst of memInstruments) {
      await sql`INSERT INTO instruments (id, name, description, color, created_at)
        VALUES (${inst.id}, ${inst.name}, ${inst.description}, ${inst.color}, ${inst.createdAt})`
    }
  }
  tableReady = true
}

function rowToInstrument(row: Record<string, unknown>): Instrument {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    color: row.color as string,
    createdAt: String(row.created_at),
  }
}

function rowToReservation(row: Record<string, unknown>): Reservation {
  return {
    id: row.id as string,
    instrumentId: row.instrument_id as string,
    userName: row.user_name as string,
    userEmail: row.user_email as string,
    purpose: row.purpose as Reservation['purpose'],
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    notes: row.notes as string,
    createdAt: String(row.created_at),
  }
}

// ── Instrument CRUD ────────────────────────────────────────────────────────
export async function getInstruments(): Promise<Instrument[]> {
  if (!process.env.DATABASE_URL) return [...memInstruments]
  await ensureTables()
  const sql = await getSQL()
  const rows = await sql`SELECT * FROM instruments ORDER BY created_at ASC`
  return rows.map(rowToInstrument)
}

export async function getInstrument(id: string): Promise<Instrument | null> {
  if (!process.env.DATABASE_URL) return memInstruments.find(i => i.id === id) ?? null
  await ensureTables()
  const sql = await getSQL()
  const rows = await sql`SELECT * FROM instruments WHERE id = ${id}`
  return rows.length ? rowToInstrument(rows[0]) : null
}

export async function addInstrument(data: Omit<Instrument, 'id' | 'createdAt'>): Promise<Instrument> {
  const id = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36)
  const createdAt = new Date().toISOString()
  const instrument: Instrument = { id, ...data, createdAt }
  if (!process.env.DATABASE_URL) {
    memInstruments.push(instrument)
    return instrument
  }
  await ensureTables()
  const sql = await getSQL()
  await sql`INSERT INTO instruments (id, name, description, color, created_at)
    VALUES (${id}, ${data.name}, ${data.description}, ${data.color}, ${createdAt})`
  return instrument
}

export async function deleteInstrument(id: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    const idx = memInstruments.findIndex(i => i.id === id)
    if (idx === -1) return false
    memInstruments.splice(idx, 1)
    const toRemove = memReservations.filter(r => r.instrumentId === id).map(r => r.id)
    toRemove.forEach(rid => { const i = memReservations.findIndex(r => r.id === rid); if (i !== -1) memReservations.splice(i, 1) })
    return true
  }
  await ensureTables()
  const sql = await getSQL()
  await sql`DELETE FROM reservations WHERE instrument_id = ${id}`
  const res = await sql`DELETE FROM instruments WHERE id = ${id} RETURNING id`
  return res.length > 0
}

// ── Reservation CRUD ───────────────────────────────────────────────────────
export async function getReservations(instrumentId?: string): Promise<Reservation[]> {
  if (!process.env.DATABASE_URL) {
    const all = memSortRes()
    return instrumentId ? all.filter(r => r.instrumentId === instrumentId) : all
  }
  await ensureTables()
  const sql = await getSQL()
  const rows = instrumentId
    ? await sql`SELECT * FROM reservations WHERE instrument_id = ${instrumentId} ORDER BY start_time ASC`
    : await sql`SELECT * FROM reservations ORDER BY start_time ASC`
  return rows.map(rowToReservation)
}

export async function addReservation(data: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
  const id = 'res-' + Date.now().toString(36) + '-' + (nextId++).toString()
  const createdAt = new Date().toISOString()
  const reservation: Reservation = { id, ...data, createdAt }
  if (!process.env.DATABASE_URL) {
    memReservations.push(reservation)
    return reservation
  }
  await ensureTables()
  const sql = await getSQL()
  await sql`INSERT INTO reservations (id, instrument_id, user_name, user_email, purpose, start_time, end_time, notes, created_at)
    VALUES (${id}, ${data.instrumentId}, ${data.userName}, ${data.userEmail}, ${data.purpose}, ${data.startTime}, ${data.endTime}, ${data.notes}, ${createdAt})`
  return reservation
}

export async function deleteReservation(id: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    const idx = memReservations.findIndex(r => r.id === id)
    if (idx === -1) return false
    memReservations.splice(idx, 1)
    return true
  }
  await ensureTables()
  const sql = await getSQL()
  const res = await sql`DELETE FROM reservations WHERE id = ${id} RETURNING id`
  return res.length > 0
}

export async function hasConflict(instrumentId: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean> {
  const reservations = await getReservations(instrumentId)
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  return reservations.some(r => {
    if (excludeId && r.id === excludeId) return false
    const rStart = new Date(r.startTime).getTime()
    const rEnd = new Date(r.endTime).getTime()
    return start < rEnd && end > rStart
  })
}
