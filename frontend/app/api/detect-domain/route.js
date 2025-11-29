import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(request) {
  try {
    console.log("🏷️ Domain Detection API called...");

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

    console.log("🤖 Calling Claude for domain detection...");

    const prompt = `Analyze this question and determine which domain it belongs to.

Question: "${question}"

Domain options: coding, writing, research, problem-solving

Respond ONLY with the domain name, nothing else. Just one word.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 10,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const detectedDomain = message.content[0].text.trim().toLowerCase();
    console.log("✅ Domain detected:", detectedDomain);

    // Validate domain
    const validDomains = ["coding", "writing", "research", "problem-solving"];
    const domain = validDomains.includes(detectedDomain)
      ? detectedDomain
      : "problem-solving";

    return new Response(
      JSON.stringify({
        success: true,
        domain: domain,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to detect domain: " + error.message }),
      { status: 500 }
    );
  }
}