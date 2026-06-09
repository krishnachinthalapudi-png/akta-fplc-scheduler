export type ReservationPurpose =
  | 'sample_prep'
  | 'data_collection'
  | 'method_development'
  | 'training'
  | 'maintenance'
  | 'other'

export const PURPOSE_LABELS: Record<ReservationPurpose, string> = {
  sample_prep: 'Sample Preparation',
  data_collection: 'Data Collection',
  method_development: 'Method Development',
  training: 'Training',
  maintenance: 'Maintenance',
  other: 'Other',
}

export const PURPOSE_COLORS: Record<ReservationPurpose, string> = {
  sample_prep: 'bg-blue-500',
  data_collection: 'bg-emerald-500',
  method_development: 'bg-amber-500',
  training: 'bg-pink-500',
  maintenance: 'bg-slate-500',
  other: 'bg-violet-500',
}

export const INSTRUMENT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-amber-600',
  'bg-red-500',
  'bg-indigo-500',
  'bg-cyan-600',
]

export const INSTRUMENT_TEXT_COLORS: Record<string, string> = {
  'bg-blue-500': 'text-blue-600',
  'bg-emerald-500': 'text-emerald-600',
  'bg-violet-500': 'text-violet-600',
  'bg-orange-500': 'text-orange-600',
  'bg-pink-500': 'text-pink-600',
  'bg-teal-500': 'text-teal-600',
  'bg-amber-600': 'text-amber-600',
  'bg-red-500': 'text-red-600',
  'bg-indigo-500': 'text-indigo-600',
  'bg-cyan-600': 'text-cyan-600',
}

export interface Instrument {
  id: string
  name: string
  description: string
  color: string
  createdAt: string
}

export interface Reservation {
  id: string
  instrumentId: string
  userName: string
  userEmail: string
  purpose: ReservationPurpose
  startTime: string
  endTime: string
  notes: string
  createdAt: string
}
