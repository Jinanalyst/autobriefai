import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface SummarizationResult {
  summary: string
  keyPoints: string[]
  actionItems: string[]
}

export const summarizeContent = async (content: string): Promise<SummarizationResult> => {
  try {
    const prompt = `
Please analyze the following content and provide:
1. A comprehensive executive summary (2-3 paragraphs)
2. 5-7 key points that were discussed or mentioned
3. 3-5 specific action items that need to be completed

Content to analyze:
${content}

Please format your response as JSON with the following structure:
{
  "summary": "Executive summary here...",
  "keyPoints": ["Key point 1", "Key point 2", ...],
  "actionItems": ["Action item 1", "Action item 2", ...]
}
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an expert business analyst and meeting summarizer. Provide clear, actionable insights from the content provided. Your response must be in JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    // JSON mode guarantees a valid JSON string
    const parsed = JSON.parse(response)
    return {
      summary: parsed.summary || 'No summary available',
      keyPoints: parsed.keyPoints || [],
      actionItems: parsed.actionItems || [],
    }
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('Failed to generate summary')
  }
}

export const extractTextFromAudio = async (audioBuffer: Buffer): Promise<string> => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.mp3', { type: 'audio/mp3' }),
      model: "whisper-1",
      response_format: "text",
    })

    return transcription
  } catch (error) {
    console.error('Audio transcription error:', error)
    throw new Error('Failed to transcribe audio')
  }
} 