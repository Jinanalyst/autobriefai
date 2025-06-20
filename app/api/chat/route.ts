import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages) {
      return new NextResponse('Messages are required', { status: 400 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      stream: true,
      messages,
    });
    
    // Create a stream of data from the OpenAI API response
    const stream = OpenAIStream(response);
    
    // Respond with the stream
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 