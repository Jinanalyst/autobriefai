import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import type { CoreMessage } from 'ai';

export const runtime = 'edge';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { messages }: { messages: CoreMessage[] } = await req.json();

  const result = await streamText({
    model: openai.chat('gpt-4o'),
    messages,
  });

  return result.toDataStreamResponse();
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