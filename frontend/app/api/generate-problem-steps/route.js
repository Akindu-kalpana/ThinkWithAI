import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(request) {
  try {
    console.log("📋 Generate Problem Steps API called...");

    const body = await request.json();
    const { question, mode } = body;

    console.log("📝 Request:", { question, mode });

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude to generate steps...");

    let prompt;

    if (mode === "SOLVE") {
      prompt = `Break down this problem into 4-6 clear, actionable steps that a beginner can follow.

Problem: "${question}"

For each step, provide:
1. Step number and title
2. What to do (clear instruction)
3. Why we're doing this (conceptual explanation)
4. Example of what output should look like

Make it practical - user will actually DO these steps.

Respond ONLY in JSON format (no markdown):
{
  "steps": [
    {
      "id": 1,
      "title": "Step title",
      "instruction": "What to do",
      "why": "Why this matters",
      "example": "What success looks like"
    }
  ]
}`;
    } else {
      // LEARN mode - WITH PROGRESSIVE DIFFICULTY
      prompt = `Create a structured learning path for someone learning "${question}" from scratch.

Break it into 4-5 key concepts they need to understand in order.

IMPORTANT: Start with the EASIEST concept and progress to harder ones. Build confidence first!

For each concept, provide:
1. Concept name
2. Simple explanation (2-3 sentences, beginner-friendly, use everyday analogies)
3. Why it matters (real-world relevance)
4. A recall question that is APPROPRIATE FOR THE DIFFICULTY LEVEL:
   - Concept 1-2: VERY EASY (just checking they remember what you said, not deep thinking)
   - Concept 3: MEDIUM (requires some thinking)
   - Concept 4-5: HARDER (requires understanding and application)
5. An easy micro-exercise to practice (appropriate difficulty)

RECALL QUESTION EXAMPLES:
- Easy: "In your own words, what did we just learn about variables?"
- Medium: "Can you think of why we need variables in programming?"
- Hard: "How would you explain the difference between 'let' and 'const'?"

Write questions conversationally - NO QUOTES AROUND QUESTIONS, just natural language.

Start with the EASIEST concept first to build confidence.

Respond ONLY in JSON format (no markdown):
{
  "concepts": [
    {
      "id": 1,
      "name": "Concept name",
      "explanation": "Simple explanation",
      "why": "Why it matters",
      "recallQuestion": "Natural question without quotes",
      "difficulty": "EASY",
      "exercise": "Easy practice task"
    }
  ]
}`;
    }

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

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ Could not parse JSON");
      return new Response(
        JSON.stringify({ error: "Failed to generate steps" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ Steps generated:", parsedResponse.steps?.length || parsedResponse.concepts?.length);

    return new Response(
      JSON.stringify({
        success: true,
        data: mode === "SOLVE" ? parsedResponse.steps : parsedResponse.concepts,
        mode: mode,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate steps: " + error.message }),
      { status: 500 }
    );
  }
}