import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    console.log("🔥 Reflection API called...");

    const body = await request.json();
    const { solutionId, prompt, userAnswer } = body;

    console.log("📝 Request:", { solutionId, prompt, userAnswer });

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude for feedback...");

    const feedbackPrompt = `You are a teacher providing constructive feedback to a student learning to code.

The reflection prompt was: "${prompt}"

The student's answer was: "${userAnswer}"

Provide brief, encouraging feedback (2-3 sentences) that:
1. Validates what they got right
2. Suggests one improvement or clarification
3. Encourages them to think deeper

Be supportive and specific.`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: feedbackPrompt,
        },
      ],
    });

    const feedback = message.content[0].text;
    console.log("✅ Feedback generated");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log("💾 Saving reflection to Supabase...");

    const { data, error } = await supabase
      .from("reflections")
      .insert([
        {
          solution_id: solutionId,
          prompt: prompt,
          user_answer: userAnswer,
          ai_feedback: feedback,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Supabase error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save reflection: " + error.message }),
        { status: 500 }
      );
    }

    console.log("✅ Reflection saved");

    return new Response(
      JSON.stringify({
        success: true,
        feedback: feedback,
        reflectionId: data[0].id,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process reflection: " + error.message }),
      { status: 500 }
    );
  }
}