import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, previousTopics } = body;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    let prompt = `Generate exactly 8 personalized book topic recommendations as JSON.

Reader profile:
- Name: ${user?.name || "Reader"}
- Role: ${user?.role || "Not specified"}
- Interests: ${user?.interests || "General"}
${user?.about ? `\nAbout them: ${user.about}` : ""}
`;

    if (previousTopics?.length) {
      prompt += `\nAlready covered (don't repeat): ${previousTopics.join(", ")}`;
    }

    prompt += `\n
Category mix:
- 5 from their primary interests (specific, not generic)
- 2 adjacent/bridging topics
- 1 serendipity (surprising but justified)

Respond with ONLY valid JSON, no other text:
{
  "recommendations": [
    {
      "title": "Specific Topic Title",
      "description": "2-sentence description",
      "why_for_you": "Why this matters for this reader",
      "category": "primary"
    }
  ]
}

Be SPECIFIC. Not "Machine Learning" but "Gradient-Free Optimization for Black-Box Models".`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ recommendations: [] });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Recommendation failed" },
      { status: 500 }
    );
  }
}
