import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(request) {
  try {
    console.log("🎯 Detect Mode API called...");

    const body = await request.json();
    const { question } = body;

    console.log("📝 Question:", question);

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude to detect mode...");

    const prompt = `Analyze this user question and determine if they want to:
1. LEARN - Learn a new concept/skill from scratch (e.g., "Teach me JavaScript", "How does machine learning work?")
2. SOLVE - Solve a specific problem/task (e.g., "How to push code to GitHub?", "Write a thesis")

Question: "${question}"

Respond ONLY in JSON format (no markdown):
{
  "mode": "LEARN" or "SOLVE",
  "confidence": 0.9,
  "explanation": "brief reason why"
}`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ Could not parse JSON");
      return new Response(
        JSON.stringify({ error: "Failed to detect mode" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ Mode detected:", parsedResponse.mode);

    return new Response(
      JSON.stringify({
        success: true,
        mode: parsedResponse.mode,
        confidence: parsedResponse.confidence,
        explanation: parsedResponse.explanation,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to detect mode: " + error.message }),
      { status: 500 }
    );
  }
}