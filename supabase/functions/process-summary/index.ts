// @ts-nocheck
// deno-lint-ignore-file
// deno-fmt-ignore-file

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from "https://esm.sh/openai@4.20.1";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";
import "https://deno.land/x/dotenv/load.ts";
import pdf from 'https://esm.sh/pdf-parse@1.1.1';

// Note: pdf-parse is not directly available in Deno.
// We'd need to find a Deno-compatible PDF parsing library.
// For now, this is a placeholder. A real implementation would require a suitable library.
// For example, if a library like 'pdf-parse-deno' existed:
// import pdf from 'https://esm.sh/pdf-parse-deno'; 

interface SummaryResult {
  summary: string
  keyPoints: string[]
  actionItems: string[]
}

const MAX_CONTENT_LENGTH = 15000; // Approx 3k tokens

const summarizeContent = async (content: string, openai: OpenAI): Promise<SummaryResult> => {
  const truncatedContent = content.substring(0, MAX_CONTENT_LENGTH);

  const prompt = `
Please analyze the following content and provide:
1. A comprehensive executive summary (2-3 paragraphs)
2. 5-7 key points that were discussed or mentioned
3. 3-5 specific action items that need to be completed

Content to analyze:
${truncatedContent}
${content.length > MAX_CONTENT_LENGTH ? "\n\n[Note: The document was too long and has been truncated. This summary is based on the beginning of the document.]" : ""}

Please format your response as JSON with the following structure:
{
  "summary": "Executive summary here...",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "actionItems": ["Action item 1", "Action item 2", ...]
}
`;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "You are an expert business analyst and meeting summarizer. Provide clear, actionable insights from the content provided. Your response must be in JSON format." },
      { role: "user", content: prompt }
    ],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from OpenAI');
  }
  const parsed = JSON.parse(response);
  return {
    summary: parsed.summary || 'No summary available',
    keyPoints: parsed.keyPoints || [],
    actionItems: parsed.actionItems || [],
  };
};


serve(async (req) => {
  let summaryId: string | null = null;
  try {
    const { record: triggerRecord, old_record: oldRecord } = await req.json();

    // The function can be triggered by INSERT or UPDATE on 'summaries' table
    // For INSERT, the record is in 'triggerRecord'
    // For direct invocation (not yet implemented but good practice), we might pass it differently
    const summaryRecord = triggerRecord || oldRecord;
    if (!summaryRecord) throw new Error("Could not determine the record to process.");

    summaryId = summaryRecord.id;
    const userId = summaryRecord.user_id;
    const filePath = summaryRecord.file_path; // Use file_path from the trigger
    const fileName = summaryRecord.file_name;

    if (!summaryId || !filePath || !fileName) {
      throw new Error("Missing required fields in the summary record (id, file_path, file_name).");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const updateStatus = async (status: string, details?: string) => {
      const { error } = await supabaseAdmin
        .from('summaries')
        .update({ status, status_details: details || null })
        .eq('id', summaryId);
      if (error) console.error(`Failed to update status to ${status}:`, error.message);
    };

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });

    await updateStatus('extracting_text');
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('uploads')
      .download(filePath);

    if (downloadError) throw downloadError;

    const buffer = Buffer.from(await fileData.arrayBuffer());
    let content = '';

    const { data: fileMetadata, error: metadataError } = await supabaseAdmin.storage.from('uploads').getPublicUrl(filePath);
    if(metadataError) console.error("Could not get mimetype, proceeding with PDF assumption", metadataError)
    const fileType = fileMetadata?.publicUrl?.endsWith('.pdf') ? 'application/pdf' : 'other';

    if (fileType === 'application/pdf') {
      const data = await pdf(buffer);
      content = data.text;
      console.log("Successfully extracted text from PDF.");
    } else {
      content = "File type not supported for text extraction.";
      await updateStatus('failed', 'File type not supported.');
      throw new Error(content)
    }
    
    if (!content) {
      await updateStatus('failed', 'Could not extract content from file.');
      throw new Error('Could not extract content from file.');
    }

    await updateStatus('summarizing');
    const summaryResult = await summarizeContent(content, openai);

    const { error: dbError } = await supabaseAdmin
      .from('summaries')
      .update({
        summary: summaryResult.summary,
        key_points: summaryResult.keyPoints,
        action_items: summaryResult.actionItems,
        status: 'completed',
      })
      .eq('id', summaryId);

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error processing summary:", error.message);
    if(summaryId) {
      // Attempt to update the status to 'failed'
      await createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      ).from('summaries').update({ status: 'failed', status_details: error.message }).eq('id', summaryId);
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}) 