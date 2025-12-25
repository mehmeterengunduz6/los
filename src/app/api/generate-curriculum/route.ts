import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { anthropic, MODEL, MAX_TOKENS } from '@/lib/anthropic';
import { getCurriculumGenerationPrompt } from '@/lib/prompts';
import { parseCurriculumResponse } from '@/lib/curriculum-parser';
import { GenerateCurriculumRequest, GenerateCurriculumResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateCurriculumRequest = await request.json();
    const { personalization } = body;

    if (!personalization || !personalization.topic) {
      return NextResponse.json(
        { error: 'Missing personalization data or topic' },
        { status: 400 }
      );
    }

    // Generate curriculum using Claude
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: getCurriculumGenerationPrompt(personalization)
        }
      ]
    });

    // Extract text content from response
    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Parse the curriculum
    const curriculum = parseCurriculumResponse(responseText);

    // Generate session ID
    const sessionId = uuidv4();

    const response: GenerateCurriculumResponse = {
      sessionId,
      curriculum
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating curriculum:', error);
    return NextResponse.json(
      { error: 'Failed to generate curriculum' },
      { status: 500 }
    );
  }
}

