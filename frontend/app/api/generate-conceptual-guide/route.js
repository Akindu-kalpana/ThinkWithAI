import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(request) {
  try {
    console.log("💡 Generate Conceptual Guide API called...");

    const body = await request.json();
    const { stepOrConcept, explanation, mode } = body;

    console.log("📝 Request:", { stepOrConcept, mode });

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude for conceptual guide...");

    const prompt = `Explain the "WHY" and core concept behind this step/topic in a way that helps users think independently.

Step/Topic: "${stepOrConcept}"
Current Explanation: "${explanation}"

Provide:
1. coreIdea: The fundamental principle (1 sentence)
2. whyItMatters: Why this approach is used (2 sentences)
3. alternativeApproach: "You could also do it this way..." (show flexibility)
4. keyTakeaway: What to remember for future problems (1-2 sentences)
5. thinkAboutThis: A thought-provoking question to deepen understanding

Make it empowering - show that they can adapt and create their own approach once they understand the concept.

Respond ONLY in JSON format (no markdown):
{
  "coreIdea": "The fundamental principle",
  "whyItMatters": "Why this matters",
  "alternativeApproach": "Another way to think about it",
  "keyTakeaway": "What to remember",
  "thinkAboutThis": "A thought-provoking question"
}`;

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
        JSON.stringify({ error: "Failed to generate guide" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ Conceptual guide generated");

    return new Response(
      JSON.stringify({
        success: true,
        guide: parsedResponse,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate conceptual guide: " + error.message,
      }),
      { status: 500 }
    );
  }
}