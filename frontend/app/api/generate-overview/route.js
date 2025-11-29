import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(request) {
  try {
    console.log("📖 Generate Overview API called...");

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

    console.log("🤖 Calling Claude for overview...");

    let prompt;

    if (mode === "LEARN") {
      prompt = `Create a simple, comprehensive overview that EVERYONE can understand about: "${topic}"

Write it for a complete beginner with NO prior knowledge. Avoid jargon. Use everyday analogies.

Structure it as:
1. What it is (1 paragraph - simple explanation using everyday words)
2. Why it matters (1 paragraph - real-world relevance)
3. What you'll learn (1 paragraph - brief outline of key concepts)

Make it inspiring, not intimidating. The person should feel "I can learn this!"

Respond ONLY in JSON format (no markdown):
{
  "whatItIs": "Paragraph explaining what it is",
  "whyItMatters": "Paragraph explaining why it matters",
  "whatYouWillLearn": "Paragraph outlining key concepts",
  "encouragement": "One inspiring sentence"
}`;
    } else {
      // SOLVE mode
      prompt = `Create a simple overview of how to solve this problem: "${topic}"

Write for someone who is learning to do this for the first time. Keep it encouraging and non-technical.

Structure it as:
1. What you'll do (1 paragraph - simple explanation of the task)
2. Why this approach works (1 paragraph - the logic/reasoning)
3. What to expect (1 paragraph - rough steps/timeline)

Make it feel achievable and empowering.

Respond ONLY in JSON format (no markdown):
{
  "whatYouWillDo": "Paragraph explaining the task",
  "whyThisApproach": "Paragraph explaining the approach",
  "whatToExpect": "Paragraph about the process",
  "encouragement": "One empowering sentence"
}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 800,
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
        JSON.stringify({ error: "Failed to generate overview" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ Overview generated");

    return new Response(
      JSON.stringify({
        success: true,
        overview: parsedResponse,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate overview: " + error.message }),
      { status: 500 }
    );
  }
}