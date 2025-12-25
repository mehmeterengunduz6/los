import { NextRequest } from 'next/server';
import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic';
import { getNodeChatSystemPrompt, findNodeById } from '@/lib/prompts';
import { ChatRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { nodeId, message, chatHistories, curriculum, personalization } = body;

    if (!nodeId || !message || !curriculum || !personalization) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Find the current node
    const currentNode = findNodeById(nodeId, curriculum);
    if (!currentNode) {
      return new Response(JSON.stringify({ error: 'Node not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Build the system prompt with context
    const systemPrompt = getNodeChatSystemPrompt(
      personalization,
      currentNode,
      curriculum,
      chatHistories
    );

    // Get existing chat history for this node
    const nodeHistory = chatHistories[nodeId];
    const previousMessages = nodeHistory?.messages || [];

    // Build messages array
    const messages = [
      ...previousMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    // Create streaming response
    const stream = await anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages
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
    console.error('Error in chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

