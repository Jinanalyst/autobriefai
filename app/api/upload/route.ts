import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createSummaryRecord } from '@/lib/supabase'
import { summarizeContent, extractTextFromAudio } from '@/lib/openai'

// Helper function to extract text from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfTextExtract = require('pdf-text-extract');
    
    return new Promise((resolve, reject) => {
      pdfTextExtract(buffer, (err: any, text: string) => {
        if (err) {
          console.error('PDF parsing error:', err);
          reject(new Error('Failed to parse PDF'));
        } else {
          resolve(text);
        }
      });
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF');
  }
}

// Helper function to extract text from DOCX
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('DOCX parsing error:', error)
    throw new Error('Failed to parse DOCX')
  }
}

export async function POST(request: NextRequest) {
  console.log("Upload API endpoint hit.");
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const user = session.user;
    console.log(`User ${user.id} authenticated.`);

    // Check summary count for the user
    const { count, error: countError } = await supabase
      .from('summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('Error counting summaries:', countError);
      throw countError;
    }
    
    console.log(`User ${user.id} has ${count} summaries.`);

    // For the free plan, limit to 5 summaries
    if (count !== null && count >= 5) {
      return NextResponse.json({ 
        error: 'You have reached the maximum number of 5 summaries for the free plan.' 
      }, { status: 403 }); // 403 Forbidden
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log("Error: No file provided.");
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    console.log(`Received file: ${file.name}, type: ${file.type}, size: ${file.size}`);

    // Validate file type
    const allowedTypes = [
      'audio/mp3', 
      'audio/wav', 
      'video/mp4', 
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Currently supporting: PDF, DOCX, MP3, WAV, MP4' 
      }, { status: 400 })
    }

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // --- Start File Processing ---
    console.log("Starting file processing...");
    let content = ''
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    console.log("File converted to buffer.");

    // Extract text based on file type
    if (file.type.includes('audio') || file.type.includes('video')) {
      console.log("Extracting text from audio/video...");
      content = await extractTextFromAudio(fileBuffer)
    } else if (file.type === 'application/pdf') {
      console.log("Extracting text from PDF...");
      content = await extractTextFromPDF(fileBuffer)
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      console.log("Extracting text from DOCX...");
      content = await extractTextFromDOCX(fileBuffer)
    }
    console.log("File content extracted successfully.");
    // --- End File Processing ---

    if (!content) {
      console.log("Error: Could not extract content from file.");
      return NextResponse.json({ error: 'Could not extract content from file' }, { status: 400 })
    }

    // Generate summary using OpenAI
    console.log("Generating summary with OpenAI...");
    const summaryResult = await summarizeContent(content)
    console.log("Summary generated successfully.");

    // Upload file to Supabase Storage
    console.log("Uploading file to Supabase Storage...");
    
    // Sanitize filename to avoid Supabase storage issues
    const sanitizeFilename = (filename: string) => {
      return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscores
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    };
    
    const sanitizedFileName = sanitizeFilename(file.name);
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    const filePath = `${user.id}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
    }
    console.log("File uploaded to Supabase Storage successfully.");

    // Create a signed URL for the private file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('uploads')
      .createSignedUrl(filePath, 60 * 60 * 24 * 7) // Expires in 7 days

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }
    console.log(`Retrieved signed URL: ${signedUrlData.signedUrl}`);

    // Create final record in Supabase
    console.log("Creating final record in database...");
    const record = await createSummaryRecord({
      user_id: user.id,
      file_name: file.name,
      file_type: file.type,
      file_url: signedUrlData.signedUrl,
      summary: summaryResult.summary,
      key_points: summaryResult.keyPoints,
      action_items: summaryResult.actionItems,
      status: 'completed'
    })
    console.log(`Database record created with ID: ${record.id}`);

    return NextResponse.json({ 
      id: record.id,
      message: 'File processed and summarized successfully.'
    })

  } catch (error) {
    console.error('Unhandled error in Upload API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 