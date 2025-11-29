import { Anthropic } from "@anthropic-ai/sdk";

export async function POST(request) {
  try {
    console.log("✅ Validate Step API called...");

    const body = await request.json();
    const { stepTitle, instruction, userAttempt, mode } = body;

    console.log("📝 Request:", { stepTitle, mode });

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log("🤖 Calling Claude to validate...");

    let prompt;

    if (mode === "SOLVE") {
      prompt = `A user is following steps to solve a problem. Validate their attempt.

Step: "${stepTitle}"
Instruction: "${instruction}"
User's Attempt: "${userAttempt}"

Check if their attempt is correct/on the right track. Provide:
1. isCorrect: true/false (are they on the right track?)
2. feedback: Encouraging feedback (2-3 sentences)
3. suggestion: What to do next (if wrong) or next step (if correct)
4. conceptNote: A brief note about WHY this works (to build understanding)

Be supportive! Even if wrong, encourage them.

Respond ONLY in JSON format (no markdown):
{
  "isCorrect": true,
  "feedback": "Great! You did X correctly because...",
  "suggestion": "Next, try...",
  "conceptNote": "This works because..."
}`;
    } else {
      // LEARN mode
      prompt = `A user is learning and answered a recall question. Check their understanding.

Question: "${instruction}"
User's Answer: "${userAttempt}"

Evaluate their answer. Provide:
1. isCorrect: true/false (did they understand?)
2. feedback: Encouraging feedback (2-3 sentences)
3. clarification: What they understood well and what to clarify
4. nextStep: What to practice next

Be supportive! Learning is a process.

Respond ONLY in JSON format (no markdown):
{
  "isCorrect": true,
  "feedback": "Good thinking! You understood...",
  "clarification": "You got X right. For Y, think about...",
  "nextStep": "Now try this exercise..."
}`;
    }

    const message = await anthropic.messages.create({
      model: "claude-opus-4-1",
      max_tokens: 500,
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
        JSON.stringify({ error: "Failed to validate" }),
        { status: 500 }
      );
    }

    const parsedResponse = JSON.parse(jsonMatch[0]);
    console.log("✅ Validation complete:", parsedResponse.isCorrect);

    return new Response(
      JSON.stringify({
        success: true,
        isCorrect: parsedResponse.isCorrect,
        feedback: parsedResponse.feedback,
        suggestion: parsedResponse.suggestion || parsedResponse.clarification,
        conceptNote: parsedResponse.conceptNote || parsedResponse.nextStep,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API Error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to validate: " + error.message }),
      { status: 500 }
    );
  }
}