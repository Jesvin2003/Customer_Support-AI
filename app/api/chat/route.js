import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = `
You are the GlobeGuide AI Bot, designed to assist users in finding the best and cheapest flights to their desired destinations. Your primary role is to provide users with accurate, up-to-date flight information, compare prices, and offer travel-related assistance, including recommendations for airlines, airports, and travel dates. Your responses should be clear, concise, and friendly, ensuring users have a smooth experience in planning their travels.
`;

export async function POST(req) {
  try {
    // Log to ensure the API key is loaded correctly
    console.log('API Key:', process.env.OPENAI_API_KEY ? 'Loaded' : 'Not Loaded');

    // Create a new instance of the OpenAI client with the API key
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Parse the JSON body of the incoming request
    const data = await req.json();
    console.log('Received data:', data);

    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Ensure this is a valid model name
      messages: [{ role: 'system', content: systemPrompt }, ...data],
      stream: true, // Enable streaming responses
    });

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // Iterate over the streamed chunks of the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          console.error('Error while streaming response:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);

  } catch (error) {
    console.error('Error in POST route:', error);
    // Return a JSON response with a 500 status code in case of an error
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}