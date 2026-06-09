import { InstrumentPageClient } from '@/components/instrument-page-client'

export default async function InstrumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <InstrumentPageClient instrumentId={id} />
}
