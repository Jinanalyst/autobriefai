-- Create the summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  summary TEXT,
  key_points TEXT[],
  action_items TEXT[],
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on created_at for better performance
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON summaries(created_at);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_summaries_user_id ON summaries(user_id);

-- Create an index on status for filtering
CREATE INDEX IF NOT EXISTS idx_summaries_status ON summaries(status);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
DROP TRIGGER IF EXISTS update_summaries_updated_at ON summaries;
CREATE TRIGGER update_summaries_updated_at 
    BEFORE UPDATE ON summaries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- Remove the permissive MVP policy
DROP POLICY IF EXISTS "Allow all operations" ON summaries;

-- Create policies for user-specific access
CREATE POLICY "Users can insert their own summaries" ON summaries
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own summaries" ON summaries
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own summaries" ON summaries
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own summaries" ON summaries
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', false) -- Make uploads private
ON CONFLICT (id) DO NOTHING;

-- REMOVE existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public access to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects;
DROP POLICY IF EXISTS "Public all access" ON storage.objects;

-- Grant authenticated users access to the 'uploads' bucket
CREATE POLICY "Authenticated users can manage their own files" ON storage.objects
    FOR ALL TO authenticated USING (bucket_id = 'uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid)
    WITH CHECK (bucket_id = 'uploads' AND auth.uid() = (storage.foldername(name))[1]::uuid); 