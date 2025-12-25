import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic client
// The API key is read from ANTHROPIC_API_KEY environment variable
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Model to use for all interactions
export const MODEL = 'claude-sonnet-4-20250514';

// Maximum tokens for responses
export const MAX_TOKENS = 4096;

