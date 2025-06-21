'use client'

import { useParams } from 'next/navigation'
import dynamic from 'next/dynamic'

const ResultsDisplay = dynamic(() => import('@/components/ResultsDisplay'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Results...</p>
        </div>
      </div>
    </div>
  ),
})

export default function ResultsPage() {
  const params = useParams()
  const summaryId = params.id as string

  return <ResultsDisplay summaryId={summaryId} />
} 