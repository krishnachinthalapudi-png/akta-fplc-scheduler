export type ReservationPurpose =
  | 'protein_purification'
  | 'size_exclusion'
  | 'ion_exchange'
  | 'affinity_chromatography'
  | 'method_development'
  | 'column_equilibration'
  | 'training'
  | 'other'

export const PURPOSE_LABELS: Record<ReservationPurpose, string> = {
  protein_purification: 'Protein Purification',
  size_exclusion: 'Size Exclusion (SEC)',
  ion_exchange: 'Ion Exchange (IEX)',
  affinity_chromatography: 'Affinity Chromatography',
  method_development: 'Method Development',
  column_equilibration: 'Column Equilibration',
  training: 'Training / Onboarding',
  other: 'Other',
}

export const PURPOSE_COLORS: Record<ReservationPurpose, string> = {
  protein_purification: 'bg-blue-500',
  size_exclusion: 'bg-emerald-500',
  ion_exchange: 'bg-orange-500',
  affinity_chromatography: 'bg-violet-500',
  method_development: 'bg-amber-500',
  column_equilibration: 'bg-teal-500',
  training: 'bg-pink-500',
  other: 'bg-slate-500',
}

export const PURPOSE_BORDER_COLORS: Record<ReservationPurpose, string> = {
  protein_purification: 'border-blue-400',
  size_exclusion: 'border-emerald-400',
  ion_exchange: 'border-orange-400',
  affinity_chromatography: 'border-violet-400',
  method_development: 'border-amber-400',
  column_equilibration: 'border-teal-400',
  training: 'border-pink-400',
  other: 'border-slate-400',
}

export interface Reservation {
  id: string
  userName: string
  userEmail: string
  purpose: ReservationPurpose
  startTime: string
  endTime: string
  notes: string
  createdAt: string
}
