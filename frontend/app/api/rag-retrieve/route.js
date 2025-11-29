import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    console.log("🔍 RAG Retrieve API called...");

    const body = await request.json();
    const { description, domain } = body;

    console.log("📝 Request:", { description, domain });

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY is not set" }),
        { status: 500 }
      );
    }

    console.log("🔄 Creating embedding for description...");

    // Create embedding for the current problem
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: description,
      encoding_format: "float",
    });

    const embedding = embeddingResponse.data[0].embedding;
    console.log("✅ Embedding created");

    console.log("🔎 Searching similar solutions in Supabase...");

    // Search similar solutions using vector similarity
    const { data: similarSolutions, error } = await supabase.rpc(
      "match_solutions",
      {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 3,
      }
    );

    if (error) {
      console.error("❌ Supabase error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to retrieve similar solutions: " + error.message }),
        { status: 500 }
      );
    }

    console.log("✅ Found similar solutions:", similarSolutions?.length || 0);

    // Format similar solutions for context
    const contextText = similarSolutions
      ?.map(
        (sol, idx) =>
          `Example ${idx + 1}:\nCode:\n${sol.ai_code}\n\nExplanation:\n${sol.explanation}`
      )
      .join("\n\n---\n\n") || "No similar solutions found";

    return new Response(
      JSON.stringify({
        success: true,
        context: contextText,
        similarCount: similarSolutions?.length || 0,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to retrieve context: " + error.message }),
      { status: 500 }
    );
  }
}