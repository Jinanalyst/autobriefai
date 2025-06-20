'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Download, Copy, CheckCircle, Clock, Users, Target } from 'lucide-react'
import Header from '@/components/Header'
import { generatePDF } from '@/utils/pdfGenerator'
import toast from 'react-hot-toast'

interface SummaryResult {
  id: string
  fileName: string
  fileType: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  createdAt: string
  status: 'processing' | 'completed' | 'failed'
}

export default function ResultsPage() {
  const params = useParams()
  const [result, setResult] = useState<SummaryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/results/${params.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch result')
        }
        const data = await response.json()
        setResult(data)
      } catch (error) {
        console.error('Error fetching result:', error)
        toast.error('Failed to load results')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchResult()
    }
  }, [params.id])

  const handleDownloadPDF = async () => {
    if (!result) return
    
    setGeneratingPDF(true)
    try {
      await generatePDF(result)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="card text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your results...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="card text-center">
              <p className="text-gray-600">Result not found</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="card mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Summary Results
                </h1>
                <p className="text-gray-600">
                  {result.fileName} • {new Date(result.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => copyToClipboard(result.summary)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={generatingPDF}
                  className="btn-primary flex items-center space-x-2"
                >
                  {generatingPDF ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  <span>{generatingPDF ? 'Generating...' : 'Download PDF'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              Executive Summary
            </h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">
                {result.summary}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Key Points */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 text-primary-600 mr-2" />
                Key Points
              </h3>
              <ul className="space-y-3">
                {result.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Items */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                Action Items
              </h3>
              <ul className="space-y-3">
                {result.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Metadata */}
          <div className="card mt-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Processed on {new Date(result.createdAt).toLocaleString()}
                </span>
                <span>File type: {result.fileType.toUpperCase()}</span>
              </div>
              <span className="text-primary-600 font-medium">
                Powered by AutoBrief.AI
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 