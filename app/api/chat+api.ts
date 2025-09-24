import { openai } from '@ai-sdk/openai';
import { generateText, convertToModelMessages } from 'ai';

// Fitness-specific system prompt for Ninety
const SYSTEM_PROMPT = `You are Ava, an expert AI fitness coach for the Ninety app - a 90-day fitness transformation program based on science-backed muscle building principles.

Your role is to guide users through their fitness journey with:
- Science-based workout recommendations (3-day cycles, progressive overload)
- Nutrition guidance (calorie targets, protein intake, core foods like beans, lentils, oatmeal)  
- Progress tracking and measurement advice
- Motivation and accountability

Key principles you follow:
- Workouts: 3 times per week, 8-10 reps, 3-4 sets, 2.5lbs progressive increases
- Nutrition: Calculate calorie needs, emphasize protein (0.6 x bodyweight in lbs = grams of protein powder needed)
- Measurement: Weekly arm measurements to track muscle growth
- Sleep: 7 hours essential for muscle recovery

Be encouraging, knowledgeable, and always refer back to the proven 90-day transformation principles. Keep responses concise but helpful.`;

export async function POST(req: Request) {
  console.log('🚀 API Route: POST /api/chat called');
  console.log('📊 Request method:', req.method);
  console.log('🔗 Request URL:', req.url);
  
  try {
    const body = await req.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    const { messages } = body;
    console.log('🤖 Setting up AI with', messages.length, 'messages');
    console.log('🔑 OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
    
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
    });

    console.log('✅ AI request successful');
    console.log('🤖 Generated response:', result.text.substring(0, 100) + '...');
    
    return new Response(JSON.stringify({ 
      message: result.text,
      usage: result.usage 
    }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('❌ Chat API error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}