import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import type { BookJob } from "../route";

/**
 * GET /api/generate/status?id=book_xxx — poll for generation progress.
 */
export async function GET(request: NextRequest) {
  const bookId = request.nextUrl.searchParams.get("id");
  if (!bookId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const raw = await kv.get<string>(`job:${bookId}`);
  if (!raw) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const job: BookJob = typeof raw === "string" ? JSON.parse(raw) : raw;

  return NextResponse.json({
    id: job.id,
    status: job.status,
    topic: job.topic,
    template: job.template,
    language: job.language,
    wordCount: job.wordCount,
    error: job.error,
    // Only send full content when done (avoid large payloads during polling)
    content: job.status === "done" || job.status === "error" ? job.content : undefined,
    // Send a preview snippet during writing
    preview: job.status === "writing" ? job.content.slice(-400) : undefined,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  });
}
