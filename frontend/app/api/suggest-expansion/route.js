import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(request) {
  try {
    console.log("🚀 Suggest Expansion API called...");

    const body = await request.json();
    const { topic, mode } = body;

    console.log("📝 Request:", { topic, mode });

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude for expansion suggestions...");

    let prompt;

    if (mode === "SOLVE") {
      prompt = `User just completed: "${topic}"

Suggest 2-3 related topics they might want to learn to deepen their understanding.

For each suggestion, provide:
1. Topic name
2. Why it's useful (1 sentence)
3. difficulty: "EASY" or "INTERMEDIATE"

Start with EASY topics first to build confidence.

Respond ONLY in JSON format (no markdown):
{
  "suggestions": [
    {
      "topic": "Topic name",
      "why": "Why learn this",
      "difficulty": "EASY"
    }
  ],
  "encouragement": "Brief encouraging message"
}`;
    } else {
      // LEARN mode
      prompt = `User just learned: "${topic}"

Suggest 2-3 ways they can deepen their learning:
1. A micro-project to apply what they learned
2. A related advanced topic
3. A real-world use case to practice with

Provide:
1. suggestion name
2. Description (1 sentence)
3. difficulty: "EASY", "INTERMEDIATE", or "HARD"
4. timeEstimate: "5 mins", "15 mins", etc.

Start with EASY options.

Respond ONLY in JSON format (no markdown):
{
  "suggestions": [
    {
      "name": "Suggestion name",
      "description": "What they'll do",
      "difficulty": "EASY",
      "timeEstimate": "5 mins"
    }
  ],
  "encouragement": "Brief encouraging message"
}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 600,
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
        JSON.stringify({ error: "Failed to suggest expansion" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ Suggestions generated:", parsedResponse.suggestions.length);

    return new Response(
      JSON.stringify({
        success: true,
        suggestions: parsedResponse.suggestions,
        encouragement: parsedResponse.encouragement,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to suggest expansion: " + error.message }),
      { status: 500 }
    );
  }
}