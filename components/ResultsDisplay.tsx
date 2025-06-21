'use client'

import { useEffect, useState, useRef } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import Header from '@/components/Header'
import { FileText, Download, Share2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

interface SummaryData {
  id: string;
  user_id: string | null;
  file_name: string | null;
  summary: string | null;
  key_points: string[] | null;
  action_items: string[] | null;
  status: string | null;
  status_details: string | null;
  created_at: string;
}

const getStatusMessage = (status: string | null, details: string | null): string => {
  switch (status) {
    case 'processing':
      return 'Your document is in the queue for processing.';
    case 'extracting_text':
      return 'Extracting text from the document...';
    case 'summarizing':
      return 'The AI is generating the summary. This may take a moment...';
    case 'failed':
      return `Processing failed: ${details || 'An unknown error occurred.'}`;
    case 'completed':
      return 'Summary complete!';
    default:
      return 'Processing document...';
  }
};

export default function ResultsDisplay({ summaryId }: { summaryId: string }) {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClientComponentClient())
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Effect for managing the Supabase subscription
  useEffect(() => {
    if (!summaryId) {
      setLoading(false);
      setError('No summary ID provided.');
      return;
    }

    const fetchInitialSummary = async () => {
      const { data, error: fetchError } = await supabase
        .from('summaries')
        .select('*')
        .eq('id', summaryId)
        .single();

      if (data) {
        setSummary(data);
        if (data.status === 'completed' || data.status === 'failed') {
          setLoading(false);
        }
      } else if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching initial summary:', fetchError);
        setError('Failed to load summary.');
        setLoading(false);
      } else {
        setLoading(true);
      }
    };

    fetchInitialSummary();

    // Cleanup previous channel before creating a new one
    if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`summaries:${summaryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'summaries',
          filter: `id=eq.${summaryId}`,
        },
        (payload: RealtimePostgresChangesPayload<SummaryData>) => {
          if ('id' in payload.new) {
            setSummary(payload.new);
            if (payload.new.status === 'completed' || payload.new.status === 'failed') {
              setLoading(false);
            }
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [summaryId, supabase]);

  // Effect for managing the processing timeout
  useEffect(() => {
    if (!loading) {
      return;
    }

    const timeout = setTimeout(() => {
        setLoading(false);
        setError("Processing is taking longer than expected. Please check back later.");
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
    }, 120000); // 2 minutes

    return () => {
      clearTimeout(timeout);
    };
  }, [loading, supabase]);


  if (loading) {
    if (summary) {
      return (
        <div className="min-h-screen bg-white">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{getStatusMessage(summary.status, summary.status_details)}</h1>
              <p className="text-gray-600 mb-8">
                This page will update automatically when it's ready. Feel free to keep this page open in the background.
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            </div>
          </main>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Document...</h1>
            <p className="text-gray-600 mb-8">
              Your summary is being generated. This page will update automatically when it's ready.
            </p>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || (summary && summary.status === 'failed')) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">An Error Occurred</h1>
            <p className="text-gray-600 mb-8">{error || summary?.status_details}</p>
            <Link href="/demo" className={buttonVariants()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!summary) {
     return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Summary Not Found</h1>
            <p className="text-gray-600 mb-8">The summary you're looking for couldn't be found.</p>
            <Link href="/demo" className={buttonVariants()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Link>
          </div>
        </main>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/demo" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Summary</h1>
                <div className="flex items-center text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>{summary.file_name}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className={buttonVariants({ variant: 'outline' })}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                <button className={buttonVariants({ variant: 'outline' })}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* Summary Content */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Summary */}
            <div className="md:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {summary.summary || 'Summary is being generated...'}
                  </p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Points */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Points</h3>
                <ul className="space-y-2">
                  {summary.key_points && summary.key_points.length > 0 ? (
                    summary.key_points.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700 text-sm">{point}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 text-sm">No key points generated yet.</li>
                  )}
                </ul>
              </div>

              {/* Action Items */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Items</h3>
                <ul className="space-y-2">
                  {summary.action_items && summary.action_items.length > 0 ? (
                    summary.action_items.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-500 text-sm">No action items generated yet.</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 