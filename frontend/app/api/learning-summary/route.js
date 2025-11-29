import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

export async function POST(request) {
  try {
    console.log("📚 Learning Summary API called...");

    const body = await request.json();
    const { problemId, explanation, reflectionAnswers } = body;

    console.log("📝 Request:", { problemId, explanation, reflectionAnswers });

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude for summary...");

    const summaryPrompt = `You are an educational summarizer. Based on what the student learned, create a concise learning summary.

Solution Explanation:
${explanation}

Student's Reflection Answers:
${reflectionAnswers.map((ans, idx) => `Q${idx + 1}: ${ans}`).join("\n")}

Create a JSON response with this format (no markdown, pure JSON):
{
  "keyLessons": ["lesson 1", "lesson 2", "lesson 3"],
  "conceptsLearned": ["concept 1", "concept 2"],
  "nextSteps": "What the student should practice next",
  "progressScore": 75
}`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: summaryPrompt,
        },
      ],
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ Could not parse JSON from response");
      return new Response(
        JSON.stringify({ error: "Failed to parse summary response" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ Summary generated");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log("💾 Saving to Supabase...");

    const { data, error } = await supabase
      .from("learning_history")
      .insert([
        {
          problem_id: problemId,
          summary: JSON.stringify(parsedResponse),
          progress_score: parsedResponse.progressScore,
        },
      ])
      .select();

    if (error) {
      console.error("❌ Supabase error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save summary: " + error.message }),
        { status: 500 }
      );
    }

    console.log("✅ Summary saved");

    return new Response(
      JSON.stringify({
        success: true,
        summary: parsedResponse,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate summary: " + error.message }),
      { status: 500 }
    );
  }
}