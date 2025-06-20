import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@/lib/openai';

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
    
    // The response is a stream, so we can't just return it as JSON.
    // We need to pipe it to the client.
    return new NextResponse(response.toReadableStream());

  } catch (error) {
    console.error('[CHAT_API_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 