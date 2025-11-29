import { Anthropic } from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    console.log("🔥 API called - Starting...");

    const body = await request.json();
    console.log("📝 Request body:", body);

    const { question, domain } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("❌ ANTHROPIC_API_KEY is missing");
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    console.log("✅ API Key found");

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude API...");

    const prompt = `You are an expert teacher helping a beginner learn. 
    
Problem: ${question}
Domain: ${domain}

Provide a response in this exact JSON format (no markdown, pure JSON):
{
  "code": "provide working code/solution here",
  "explanation": "step-by-step explanation of what each part does",
  "assumptions": "what you assume the user already knows",
  "tradeOffs": "alternatives and trade-offs to consider",
  "reflectionPrompts": ["question 1", "question 2", "question 3"]
}`;

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("✅ Claude response received");

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ Could not parse JSON from response");
      return new Response(
        JSON.stringify({ error: "Failed to parse Claude response" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ JSON parsed successfully");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    console.log("💾 Creating problem in Supabase...");

    const { data: problemData, error: problemError } = await supabase
      .from("problems")
      .insert([
        {
      title: question,
      description: question,
      domain: domain,
      },
      ])
      .select();

    if (problemError) {
      console.error("❌ Problem creation error:", problemError);
      return new Response(
        JSON.stringify({
          error: "Failed to create problem: " + problemError.message,
        }),
        { status: 500 }
      );
    }

    const problemId = problemData[0].id;
    console.log("✅ Problem created:", problemId);

    console.log("💾 Saving solution to Supabase...");

    const { data: solutionData, error: solutionError } = await supabase
      .from("solutions")
      .insert([
        {
          problem_id: problemId,
          ai_code: parsedResponse.code,
          explanation: parsedResponse.explanation,
          assumptions: parsedResponse.assumptions,
          trade_offs: parsedResponse.tradeOffs,
        },
      ])
      .select();

    if (solutionError) {
      console.error("❌ Solution creation error:", solutionError);
      return new Response(
        JSON.stringify({
          error: "Failed to save solution: " + solutionError.message,
        }),
        { status: 500 }
      );
    }

    console.log("✅ Solution saved to Supabase");

    return new Response(
      JSON.stringify({
        success: true,
        solution: {
          id: solutionData[0].id,
          problemId: problemId,
          code: parsedResponse.code,
          explanation: parsedResponse.explanation,
          assumptions: parsedResponse.assumptions,
          tradeOffs: parsedResponse.tradeOffs,
          reflectionPrompts: parsedResponse.reflectionPrompts,
        },
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    console.error("Error message:", error.message);

    return new Response(
      JSON.stringify({ error: "Failed to generate solution: " + error.message }),
      { status: 500 }
    );
  }
}