import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    console.log("🎯 Challenge Mode API called...");

    const body = await request.json();
    const { solutionId, originalCode, userAttempt } = body;

    console.log("📝 Request:", { solutionId, originalCode, userAttempt });

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude for comparison...");

    const comparisonPrompt = `You are a code reviewer comparing a student's independent attempt with the original solution.

Original Solution:
\`\`\`
${originalCode}
\`\`\`

Student's Attempt:
\`\`\`
${userAttempt}
\`\`\`

Provide feedback in this JSON format (no markdown, pure JSON):
{
  "successScore": 75,
  "strengths": ["what they did well"],
  "improvements": ["what could be better"],
  "comparison": "brief comparison to original",
  "encouragement": "motivational message"
}`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: comparisonPrompt,
        },
      ],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ Could not parse JSON from response");
      return new Response(
        JSON.stringify({ error: "Failed to parse comparison response" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ Comparison generated");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log("💾 Saving to Supabase...");

    const { data, error } = await supabase
      .from("solutions")
      .update({ trade_offs: userAttempt })
      .eq("id", solutionId)
      .select();

    if (error) {
      console.error("❌ Supabase error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save attempt: " + error.message }),
        { status: 500 }
      );
    }

    console.log("✅ Challenge attempt saved");

    return new Response(
      JSON.stringify({
        success: true,
        feedback: parsedResponse,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process challenge: " + error.message }),
      { status: 500 }
    );
  }
}