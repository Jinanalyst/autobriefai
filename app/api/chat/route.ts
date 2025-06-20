import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  // This feature is temporarily disabled due to a build issue.
  return new NextResponse(
    'This feature is temporarily disabled.', 
    { status: 503 }
  );
}

// import { createOpenAI } from 'ai/providers/openai';
// import { streamText } from 'ai';
// import type { CoreMessage } from 'ai';

// export const runtime = 'edge';

// const openai = createOpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export async function POST(req: Request) {
//   const { messages }: { messages: CoreMessage[] } = await req.json();

//   const result = await streamText({
//     model: openai.chat('gpt-4o'),
//     messages,
//   });

//   return result.toAIStreamResponse();
// } 