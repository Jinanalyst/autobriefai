import { NextRequest, NextResponse } from 'next/server'
import { createSummaryRecord, updateSummaryRecord } from '@/lib/supabase'
import { summarizeContent, extractTextFromAudio } from '@/lib/openai'
import { supabase } from '@/lib/supabase'

// Helper function to extract text from PDF
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  
  // Set up the worker for server-side rendering
  if (typeof window === 'undefined') {
    // Server-side: use a simple worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }

  try {
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let text = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      text += pageText + '\n'
    }
    
    return text.trim()
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF')
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
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 })
    }
    console.log("File uploaded to Supabase Storage successfully.");

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)
    console.log(`Retrieved public URL: ${publicUrl}`);

    // Create final record in Supabase
    console.log("Creating final record in database...");
    const record = await createSummaryRecord({
      file_name: file.name,
      file_type: file.type,
      file_url: publicUrl,
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