import { LumaAI } from 'lumaai';

// Get the API key from environment variables
const LUMAAI_API_KEY = process.env.LUMAAI_API_KEY || '';

if (!LUMAAI_API_KEY) {
  console.warn('LUMAAI_API_KEY is not set in environment variables');
}

// Create the Luma client
export const luma = new LumaAI({
  authToken: LUMAAI_API_KEY
}); 