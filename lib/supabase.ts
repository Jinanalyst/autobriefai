import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface SummaryRecord {
  id: string
  file_name: string
  file_type: string
  file_url: string
  summary: string
  key_points: string[]
  action_items: string[]
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at: string
}

export const createSummaryRecord = async (data: Omit<SummaryRecord, 'id' | 'created_at' | 'updated_at'>) => {
  const { data: record, error } = await supabase
    .from('summaries')
    .insert([data])
    .select()
    .single()

  if (error) throw error
  return record
}

export const getSummaryRecord = async (id: string) => {
  const { data: record, error } = await supabase
    .from('summaries')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return record
}

export const updateSummaryRecord = async (id: string, data: Partial<SummaryRecord>) => {
  const { data: record, error } = await supabase
    .from('summaries')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return record
} 