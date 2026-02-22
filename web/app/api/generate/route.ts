import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/generate
 *
 * Accepts user profile + topic + options, queues a book generation job.
 * In the MVP, this is a stub. In production, this would:
 * 1. Validate input
 * 2. Build the prompt (reusing core/prompt-builder from CLI package)
 * 3. Queue generation via Claude API (not CLI) for SaaS
 * 4. Return a job ID for polling
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

    // TODO: In production:
    // 1. Authenticate user
    // 2. Check rate limits / subscription
    // 3. Build prompt using prompt-builder
    // 4. Queue generation job (Bull/Redis or similar)
    // 5. Return job ID

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      jobId,
      status: "queued",
      message: "Book generation queued. Poll /api/generate/status?id=JOB_ID for progress.",
      meta: {
        topic,
        template: template || "comprehensive",
        language: language || "en",
        estimatedMinutes: template === "deep-dive" ? 15 : template === "quick-read" ? 5 : 10,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
