import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildWebPrompt, type GenerateRequest } from "@/lib/prompt-builder";

export const maxDuration = 300; // 5 minutes for Vercel Pro

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, topic, template, language } = body;

    if (!topic || !user?.name) {
      return new Response(
        JSON.stringify({ error: "Topic and user name are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const req: GenerateRequest = {
      user,
      topic,
      template: template || "comprehensive",
      language: language || "en",
    };

    const prompt = buildWebPrompt(req);

    const client = new Anthropic({ apiKey });

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "start", topic, template: req.template })}\n\n`)
          );

          const response = await client.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 16000,
            stream: true,
            messages: [{ role: "user", content: prompt }],
          });

          let fullText = "";

          for await (const event of response) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullText += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: "text", text })}\n\n`)
              );
            }
          }

          // Send completion event with full text
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "done", wordCount: fullText.split(/\s+/).length })}\n\n`
            )
          );
        } catch (err: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "error", error: err.message || "Generation failed" })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
}
