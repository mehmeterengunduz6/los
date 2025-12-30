import { NextRequest } from 'next/server';
import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic';
import { getOnboardingSystemPrompt } from '@/lib/prompts';

interface OnboardingRequest {
    messages: { role: 'user' | 'assistant'; content: string }[];
}

export async function POST(request: NextRequest) {
    try {
        const body: OnboardingRequest = await request.json();
        const { messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Missing messages' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const systemPrompt = getOnboardingSystemPrompt();

        // Create streaming response
        const stream = await anthropic.messages.stream({
            model: MODEL,
            max_tokens: MAX_TOKENS,
            system: systemPrompt,
            messages: messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }))
        });

        // Create a readable stream for the response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const event of stream) {
                        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                            controller.enqueue(encoder.encode(event.delta.text));
                        }
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            }
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked'
            }
        });
    } catch (error) {
        console.error('Error in onboarding chat:', error);
        return new Response(JSON.stringify({ error: 'Failed to process onboarding' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
