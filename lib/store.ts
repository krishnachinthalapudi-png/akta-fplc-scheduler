import { Reservation } from '@/types'

// In-memory fallback store (used when DATABASE_URL is not set)
const memStore: Reservation[] = [
  {
    id: '1',
    userName: 'John Smith',
    userEmail: 'smith.123@osu.edu',
    purpose: 'protein_purification',
    startTime: new Date(new Date().setHours(9, 0, 0, 0)).toISOString(),
    endTime: new Date(new Date().setHours(12, 0, 0, 0)).toISOString(),
    notes: 'His6-dysferlin C2 domain, Ni-NTA column equilibrated',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: '2',
    userName: 'Sarah Lee',
    userEmail: 'lee.4521@osu.edu',
    purpose: 'size_exclusion',
    startTime: (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(13, 0, 0, 0); return d.toISOString() })(),
    endTime: (() => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(16, 0, 0, 0); return d.toISOString() })(),
    notes: 'Superdex 200 10/300 GL — NM2A S2 fragment',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '3',
    userName: 'Mike Chen',
    userEmail: 'chen.2847@osu.edu',
    purpose: 'affinity_chromatography',
    startTime: (() => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(8, 0, 0, 0); return d.toISOString() })(),
    endTime: (() => { const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(11, 0, 0, 0); return d.toISOString() })(),
    notes: 'GST-tagged dysferlin C2A, glutathione sepharose FF',
    createdAt: new Date(Date.now() - 43200000).toISOString(),
  },
]

function memSort(): Reservation[] {
  return [...memStore].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
}

// Neon Postgres helpers (only used when DATABASE_URL is set)
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
async function ensureTable() {
  if (tableReady) return
  const sql = await getSQL()
  await sql`
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      user_name TEXT NOT NULL,
      user_email TEXT NOT NULL DEFAULT '',
      purpose TEXT NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  tableReady = true
}

function rowToReservation(row: Record<string, unknown>): Reservation {
  return {
    id: String(row.id),
    userName: String(row.user_name),
    userEmail: String(row.user_email),
    purpose: row.purpose as Reservation['purpose'],
    startTime: new Date(row.start_time as string).toISOString(),
    endTime: new Date(row.end_time as string).toISOString(),
    notes: String(row.notes),
    createdAt: new Date(row.created_at as string).toISOString(),
  }
}

export async function getReservations(): Promise<Reservation[]> {
  if (!process.env.DATABASE_URL) return memSort()
  await ensureTable()
  const sql = await getSQL()
  const rows = await sql`SELECT * FROM reservations ORDER BY start_time ASC`
  return rows.map(rowToReservation)
}

export async function addReservation(
  data: Omit<Reservation, 'id' | 'createdAt'>
): Promise<Reservation> {
  if (!process.env.DATABASE_URL) {
    const r: Reservation = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    memStore.push(r)
    return r
  }
  await ensureTable()
  const sql = await getSQL()
  const id = crypto.randomUUID()
  const rows = await sql`
    INSERT INTO reservations (id, user_name, user_email, purpose, start_time, end_time, notes)
    VALUES (${id}, ${data.userName}, ${data.userEmail}, ${data.purpose}, ${data.startTime}, ${data.endTime}, ${data.notes})
    RETURNING *
  `
  return rowToReservation(rows[0])
}

export async function deleteReservation(id: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    const idx = memStore.findIndex(r => r.id === id)
    if (idx === -1) return false
    memStore.splice(idx, 1)
    return true
  }
  await ensureTable()
  const sql = await getSQL()
  const rows = await sql`DELETE FROM reservations WHERE id = ${id} RETURNING id`
  return rows.length > 0
}

export async function hasConflict(
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    const s = new Date(startTime).getTime()
    const e = new Date(endTime).getTime()
    return memStore.some(r => {
      if (excludeId && r.id === excludeId) return false
      return s < new Date(r.endTime).getTime() && e > new Date(r.startTime).getTime()
    })
  }
  await ensureTable()
  const sql = await getSQL()
  const rows = excludeId
    ? await sql`SELECT 1 FROM reservations WHERE id != ${excludeId} AND start_time < ${endTime}::timestamptz AND end_time > ${startTime}::timestamptz LIMIT 1`
    : await sql`SELECT 1 FROM reservations WHERE start_time < ${endTime}::timestamptz AND end_time > ${startTime}::timestamptz LIMIT 1`
  return rows.length > 0
}
