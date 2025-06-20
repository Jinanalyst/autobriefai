import { NextRequest, NextResponse } from 'next/server'
import { getSummaryRecord } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const record = await getSummaryRecord(params.id)

    // Transform the data to match the frontend interface
    const result = {
      id: record.id,
      fileName: record.file_name,
      fileType: record.file_type,
      summary: record.summary,
      keyPoints: record.key_points,
      actionItems: record.action_items,
      createdAt: record.created_at,
      status: record.status
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Results API error:', error)
    return NextResponse.json({ error: 'Result not found' }, { status: 404 })
  }
} 