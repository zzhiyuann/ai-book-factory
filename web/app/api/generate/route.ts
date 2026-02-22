import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { kv } from "@vercel/kv";
import {
  buildResearchPrompt,
  buildWritePrompt,
  type GenerateRequest,
} from "@/lib/prompt-builder";
import { countWords } from "@/lib/count-words";

export const maxDuration = 300;

export interface BookJob {
  id: string;
  status: "researching" | "writing" | "done" | "error";
  topic: string;
  template: string;
  language: string;
  content: string;
  wordCount: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

function generateId() {
  return `book_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * POST /api/generate — starts background generation, returns bookId immediately.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user, topic, template, language } = body;

    if (!topic || !user?.name) {
      return NextResponse.json(
        { error: "Topic and user name are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const bookId = generateId();
    const req: GenerateRequest = {
      user,
      topic,
      template: template || "comprehensive",
      language: language || "en",
    };

    // Save initial job state
    const job: BookJob = {
      id: bookId,
      status: "researching",
      topic,
      template: req.template,
      language: req.language,
      content: "",
      wordCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Skip research for quick-read
    if (req.template === "quick-read") {
      job.status = "writing";
    }

    await kv.set(`job:${bookId}`, JSON.stringify(job), { ex: 3600 }); // expire in 1 hour

    // Run generation in the background (continues after response is sent)
    after(async () => {
      await runGeneration(bookId, req, apiKey);
    });

    return NextResponse.json({ bookId, status: job.status });
  } catch (err) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/**
 * Background generation: research → write → save to KV.
 */
async function runGeneration(
  bookId: string,
  req: GenerateRequest,
  apiKey: string
) {
  const client = new Anthropic({ apiKey });

  try {
    let writePrompt: string;
    const skipResearch = req.template === "quick-read";

    if (skipResearch) {
      writePrompt = buildWritePrompt(
        req,
        "No separate research phase. Research as you write."
      );
    } else {
      // Phase 1: Research
      const researchPrompt = buildResearchPrompt(req);
      const researchResponse = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{ role: "user", content: researchPrompt }],
      });

      const researchBrief =
        researchResponse.content[0].type === "text"
          ? researchResponse.content[0].text
          : "";

      // Update status to writing
      await updateJob(bookId, { status: "writing", updatedAt: Date.now() });

      writePrompt = buildWritePrompt(req, researchBrief);
    }

    // Phase 2: Stream the book
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      stream: true,
      messages: [{ role: "user", content: writePrompt }],
    });

    let fullText = "";
    let lastSave = Date.now();

    for await (const event of response) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullText += event.delta.text;

        // Save progress every 5 seconds (avoid hammering KV)
        const now = Date.now();
        if (now - lastSave > 5000) {
          await updateJob(bookId, {
            content: fullText,
            wordCount: countWords(fullText),
            updatedAt: now,
          });
          lastSave = now;
        }
      }
    }

    // Final save
    await updateJob(bookId, {
      status: "done",
      content: fullText,
      wordCount: countWords(fullText),
      updatedAt: Date.now(),
    });
  } catch (err: any) {
    await updateJob(bookId, {
      status: "error",
      error: err.message || "Generation failed",
      updatedAt: Date.now(),
    });
  }
}

async function updateJob(bookId: string, updates: Partial<BookJob>) {
  const raw = await kv.get<string>(`job:${bookId}`);
  if (!raw) return;
  const job: BookJob = typeof raw === "string" ? JSON.parse(raw) : raw;
  Object.assign(job, updates);
  await kv.set(`job:${bookId}`, JSON.stringify(job), { ex: 3600 });
}
