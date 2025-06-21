-- Drop existing policies and table to ensure a clean slate
DROP POLICY IF EXISTS "Allow anonymous read access" ON "public"."summaries";
DROP POLICY IF EXISTS "Allow authenticated read access" ON "public"."summaries";
DROP POLICY IF EXISTS "Allow individual write access" ON "public"."summaries";
DROP POLICY IF EXISTS "Allow anonymous insert access" ON "public"."summaries";
DROP TABLE IF EXISTS "public"."summaries";

-- Create the summaries table
CREATE TABLE "public"."summaries" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "file_name" text,
    "file_path" text, -- New field to store the storage path
    "summary" text,
    "key_points" text[],
    "action_items" text[],
    "status" text DEFAULT 'processing'::text,
    "status_details" text, -- New field for more detailed status or error messages
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE "public"."summaries" ENABLE ROW LEVEL SECURITY;

-- Set primary key
ALTER TABLE ONLY "public"."summaries"
    ADD CONSTRAINT "summaries_pkey" PRIMARY KEY ("id");

-- Add foreign key constraint to auth.users
ALTER TABLE "public"."summaries" 
    ADD CONSTRAINT "summaries_user_id_fkey" 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create Policies
CREATE POLICY "Allow anonymous read access" ON "public"."summaries"
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Allow authenticated read access" ON "public"."summaries"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow individual write access" ON "public"."summaries"
    FOR ALL USING (auth.uid() = user_id);

-- This policy allows anonymous users to create new summary records.
-- It's crucial for the demo page where users are not logged in.
CREATE POLICY "Allow anonymous insert access" ON "public"."summaries"
    FOR INSERT WITH CHECK (auth.role() = 'anon');

-- Drop the old placeholder trigger and function to avoid conflicts
DROP TRIGGER IF EXISTS on_new_summary ON "public"."summaries";
DROP FUNCTION IF EXISTS public.handle_new_summary();

-- Create the trigger function that calls our Edge Function
CREATE OR REPLACE FUNCTION public.invoke_process_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- IMPORTANT: Replace <YOUR_PROJECT_REF> with your actual Supabase project reference ID.
  -- You can find it in your project's URL (e.g., https://<YOUR_PROJECT_REF>.supabase.co) or in Project Settings > General.
  PERFORM net.http_post(
    url := 'https://knowhpqkzbkxpveewkvo.supabase.co/functions/v1/process-summary',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    -- The Edge Function expects a 'record' object in the body
    body := jsonb_build_object('record', NEW)
  );
  RETURN NEW;
END;
$$;

-- Create the trigger to invoke the function on new inserts
CREATE TRIGGER on_new_summary
  AFTER INSERT ON public.summaries
  FOR EACH ROW EXECUTE PROCEDURE public.invoke_process_summary();

-- Drop existing storage policies to ensure a clean slate
DROP POLICY IF EXISTS "Authenticated users can manage their own files" ON "storage"."objects";
DROP POLICY IF EXISTS "Anonymous users can upload to the 'uploads' bucket" ON "storage"."objects";

-- Create storage bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
-- 1. Authenticated users can CRUD their own files
CREATE POLICY "Authenticated users can manage their own files"
ON storage.objects
FOR ALL
TO authenticated
USING (auth.uid()::text = owner_id);

-- 2. Allow anonymous users to upload to the 'uploads' bucket
-- This is crucial for the demo page.
CREATE POLICY "Anonymous users can upload to the 'uploads' bucket"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'uploads');

-- Create a function to be called by our storage trigger
CREATE OR REPLACE FUNCTION public.process_uploaded_summary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Invoke the 'process-summary' edge function
  PERFORM net.http_post(
    url := 'https://knowhpqkzbkxpveewkvo.supabase.co/functions/v1/process-summary',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtub3docHFremJreHB2ZWV3a3ZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODE2NzgsImV4cCI6MjA2NTI1NzY3OH0.pq2aZ6Cr65AV2CLzDRevu2ECz5d15dq__kG5UjU0BAw' -- Use the anon key
    ),
    body := jsonb_build_object(
      'record', NEW
    )
  );
  RETURN NEW;
END;
$$;

-- Create a trigger that fires after a new file is inserted into the 'uploads' bucket
DROP TRIGGER IF EXISTS on_upload_created ON storage.objects;
CREATE TRIGGER on_upload_created
AFTER INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'uploads')
EXECUTE FUNCTION public.process_uploaded_summary();