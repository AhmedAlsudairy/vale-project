import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ThermographyDetailPage({ params }: Props) {
  const { id } = await params
  
  // Redirect to the main thermography page for now
  // This route might be legacy or unused
  redirect('/thermography')
}
