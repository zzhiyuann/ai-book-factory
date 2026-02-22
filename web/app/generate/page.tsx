"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowRight, ArrowLeft, Sparkles, Check, Loader2, Download, Eye, Search,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { getProfile, saveProfile, saveBook } from "@/lib/storage";
import { markdownToHtml } from "@/lib/markdown-to-html";
import { countWords } from "@/lib/count-words";

type Step = "about" | "topic" | "options" | "generating" | "done";

interface UserInfo {
  name: string;
  role: string;
  interests: string;
  about: string;
}

interface BookOptions {
  topic: string;
  template: "comprehensive" | "deep-dive" | "quick-read" | "practical-guide";
  language: "en" | "zh" | "es";
}

const templateInfo = {
  comprehensive: { label: "Comprehensive", words: "8–12K words", desc: "Balanced depth, great for most topics" },
  "deep-dive": { label: "Deep Dive", words: "15–25K words", desc: "Maximum depth, exhaustive coverage" },
  "quick-read": { label: "Quick Read", words: "3–5K words", desc: "Fast overview, key takeaways" },
  "practical-guide": { label: "Practical Guide", words: "10–15K words", desc: "Hands-on, heavy on exercises" },
};

// Persist pending job ID across page refreshes
function savePendingJob(bookId: string, topic: string, template: string) {
  localStorage.setItem("bookfactory_pending_job", JSON.stringify({ bookId, topic, template }));
}
function getPendingJob(): { bookId: string; topic: string; template: string } | null {
  try {
    const raw = localStorage.getItem("bookfactory_pending_job");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function clearPendingJob() {
  localStorage.removeItem("bookfactory_pending_job");
}

export default function GeneratePage() {
  const [step, setStep] = useState<Step>("about");
  const [user, setUser] = useState<UserInfo>({ name: "", role: "", interests: "", about: "" });
  const [options, setOptions] = useState<BookOptions>({ topic: "", template: "comprehensive", language: "en" });
  const [bookContent, setBookContent] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [error, setError] = useState("");
  const [resumedJobId, setResumedJobId] = useState<string | null>(null);

  // Load profile + check for pending jobs on mount
  useEffect(() => {
    const stored = getProfile();
    if (stored) {
      setUser({ name: stored.name, role: stored.role, interests: stored.interests, about: stored.about });
    }

    const params = new URLSearchParams(window.location.search);
    const urlTopic = params.get("topic");
    if (urlTopic) setOptions((o) => ({ ...o, topic: urlTopic }));

    // Resume pending job if exists
    const pending = getPendingJob();
    if (pending) {
      setOptions((o) => ({ ...o, topic: pending.topic, template: pending.template as BookOptions["template"] }));
      setResumedJobId(pending.bookId);
      setStep("generating");
    }
  }, []);

  function handleAboutNext() {
    saveProfile(user);
    setStep("topic");
  }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <ProgressBar step={step} />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {step === "about" && (
          <AboutStep user={user} onChange={setUser} onNext={handleAboutNext} />
        )}
        {step === "topic" && (
          <TopicStep options={options} user={user} onChange={setOptions}
            onBack={() => setStep("about")} onNext={() => setStep("options")} />
        )}
        {step === "options" && (
          <OptionsStep options={options} onChange={setOptions}
            onBack={() => setStep("topic")} onGenerate={() => setStep("generating")} />
        )}
        {step === "generating" && (
          <GeneratingStep
            user={user} options={options}
            resumeJobId={resumedJobId}
            onContent={setBookContent} onWordCount={setWordCount}
            onError={setError} onDone={() => { clearPendingJob(); setStep("done"); }}
          />
        )}
        {step === "done" && (
          <DoneStep user={user} options={options} content={bookContent} wordCount={wordCount} error={error} />
        )}
      </div>
    </div>
  );
}

// ─── Progress Bar ───
function ProgressBar({ step }: { step: Step }) {
  const stepOrder = ["about", "topic", "options", "generating", "done"];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8">
      <div className="flex items-center gap-2 mb-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors duration-500 ${
            i <= Math.min(currentIdx, 2) ? "bg-accent" : "bg-border-light"
          }`} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted px-1">
        <span className={currentIdx === 0 ? "text-ink font-medium" : ""}>About You</span>
        <span className={currentIdx === 1 ? "text-ink font-medium" : ""}>Topic</span>
        <span className={currentIdx >= 2 ? "text-ink font-medium" : ""}>
          {currentIdx >= 3 ? "Generating" : "Options"}
        </span>
      </div>
    </div>
  );
}

// ─── Step 1: About You ───
function AboutStep({
  user, onChange, onNext,
}: {
  user: UserInfo; onChange: (u: UserInfo) => void; onNext: () => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Tell us about yourself</h1>
      <p className="text-muted mb-8">The more we know, the more personalized your book. Only name is required.</p>
      <div className="space-y-5">
        <Field label="Name" required>
          <input type="text" value={user.name}
            onChange={(e) => onChange({ ...user, name: e.target.value })}
            placeholder="Your name" className="input" autoFocus />
        </Field>
        <Field label="Role">
          <input type="text" value={user.role}
            onChange={(e) => onChange({ ...user, role: e.target.value })}
            placeholder="e.g., Software Engineer, Student, Researcher" className="input" />
        </Field>
        <Field label="Interests">
          <input type="text" value={user.interests}
            onChange={(e) => onChange({ ...user, interests: e.target.value })}
            placeholder="e.g., machine learning, psychology, leadership" className="input" />
        </Field>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            About you <span className="text-muted font-normal">— optional but powerful</span>
          </label>
          <p className="text-xs text-muted mb-2">
            Background, current work, how you think, what challenges you face. Injected directly into every book prompt.
          </p>
          <textarea value={user.about}
            onChange={(e) => onChange({ ...user, about: e.target.value })}
            placeholder="I'm working on..."
            rows={4} className="input resize-y" />
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <button onClick={onNext} disabled={!user.name.trim()} className="btn-primary">
          Next: Pick a Topic <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Topic ───
function TopicStep({
  options, user, onChange, onBack, onNext,
}: {
  options: BookOptions; user: UserInfo; onChange: (o: BookOptions) => void;
  onBack: () => void; onNext: () => void;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([
    "Game Theory for Strategic Decisions",
    "Systems Thinking in Complex Organizations",
    "Cognitive Biases and How to Overcome Them",
    "First Principles Thinking",
    "Negotiation Frameworks",
    "Behavioral Economics in Product Design",
  ]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  async function loadRecommendations() {
    setLoadingRecs(true);
    try {
      const res = await fetch("/api/topics/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
      const data = await res.json();
      if (data.recommendations?.length) {
        setSuggestions(data.recommendations.map((r: any) => r.title));
      }
    } catch { /* keep defaults */ }
    setLoadingRecs(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">What do you want to learn?</h1>
      <p className="text-muted mb-8">Any topic. The AI will research it deeply and write a comprehensive book.</p>

      <Field label="Topic">
        <input type="text" value={options.topic}
          onChange={(e) => onChange({ ...options, topic: e.target.value })}
          placeholder="e.g., Game Theory for Product Decisions"
          className="input text-lg" autoFocus />
      </Field>

      <div className="mt-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-muted">Suggestions</span>
          <button onClick={loadRecommendations} disabled={loadingRecs}
            className="text-xs text-accent hover:underline flex items-center gap-1">
            {loadingRecs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
            {loadingRecs ? "Loading..." : "Get AI recommendations"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => onChange({ ...options, topic: s })}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                options.topic === s
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "bg-cream border-border-light text-muted hover:text-ink hover:border-border"
              }`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={onNext} disabled={!options.topic.trim()} className="btn-primary">
          Next: Options <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Options ───
function OptionsStep({
  options, onChange, onBack, onGenerate,
}: {
  options: BookOptions; onChange: (o: BookOptions) => void;
  onBack: () => void; onGenerate: () => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Customize your book</h1>
      <p className="text-muted mb-8">Choose depth and language.</p>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-3">Template</label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(templateInfo) as [keyof typeof templateInfo, (typeof templateInfo)[keyof typeof templateInfo]][]).map(
            ([key, info]) => (
              <button key={key} onClick={() => onChange({ ...options, template: key })}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  options.template === key ? "border-accent bg-accent/5" : "border-border-light hover:border-border"
                }`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{info.label}</span>
                  {options.template === key && <Check className="w-3.5 h-3.5 text-accent" />}
                </div>
                <div className="text-xs text-muted">{info.desc}</div>
                <div className="text-xs font-mono text-muted/60 mt-1">{info.words}</div>
              </button>
            )
          )}
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-3">Language</label>
        <div className="flex gap-3">
          {([
            { key: "en" as const, label: "English" },
            { key: "zh" as const, label: "中文" },
            { key: "es" as const, label: "Español" },
          ]).map(({ key, label }) => (
            <button key={key} onClick={() => onChange({ ...options, language: key })}
              className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                options.language === key ? "border-accent bg-accent/5 text-accent" : "border-border-light text-muted hover:border-border"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-cream rounded-xl p-5 border border-border-light mb-8">
        <div className="text-xs font-mono text-muted mb-2">PREVIEW</div>
        <div className="text-base font-semibold mb-1">{options.topic}</div>
        <div className="text-sm text-muted">
          {templateInfo[options.template].label} · {templateInfo[options.template].words} ·{" "}
          {{ en: "English", zh: "中文", es: "Español" }[options.language]}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost"><ArrowLeft className="w-4 h-4" /> Back</button>
        <button onClick={onGenerate}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-paper rounded-xl text-base font-medium hover:bg-ink/90 transition-all">
          <Sparkles className="w-4 h-4" /> Generate My Book
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Generating (background + polling) ───
function GeneratingStep({
  user, options, resumeJobId, onContent, onWordCount, onError, onDone,
}: {
  user: UserInfo; options: BookOptions;
  resumeJobId: string | null;
  onContent: (c: string) => void;
  onWordCount: (n: number) => void;
  onError: (e: string) => void;
  onDone: () => void;
}) {
  const [status, setStatus] = useState<"researching" | "writing" | "done" | "error">("researching");
  const [phaseDetail, setPhaseDetail] = useState("Starting generation...");
  const [preview, setPreview] = useState("");
  const [wc, setWc] = useState(0);
  const [bookId, setBookId] = useState<string | null>(resumeJobId);
  const started = useRef(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll for status
  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/generate/status?id=${id}`);
      if (!res.ok) return;
      const data = await res.json();

      setStatus(data.status);
      setWc(data.wordCount || 0);
      onWordCount(data.wordCount || 0);

      if (data.preview) setPreview(data.preview);

      // Update phase detail based on status
      if (data.status === "researching") {
        setPhaseDetail("Deep researching your topic — theories, researchers, frameworks...");
      } else if (data.status === "writing") {
        const w = data.wordCount || 0;
        if (w < 500) setPhaseDetail("Writing introduction...");
        else if (w < 2000) setPhaseDetail("Developing core chapters...");
        else if (w < 5000) setPhaseDetail("Deep into the content...");
        else if (w < 8000) setPhaseDetail("Writing advanced chapters...");
        else setPhaseDetail("Wrapping up synthesis...");
      }

      if (data.status === "done") {
        if (pollRef.current) clearInterval(pollRef.current);
        onContent(data.content || "");
        onWordCount(data.wordCount || countWords(data.content || ""));

        // Save to localStorage
        saveBook({
          title: options.topic,
          topic: options.topic,
          template: options.template,
          language: options.language,
          content: data.content || "",
          wordCount: data.wordCount || 0,
        });
        onDone();
      } else if (data.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);
        onError(data.error || "Generation failed");
        if (data.content) onContent(data.content);
        onDone();
      }
    } catch {
      // Network error during poll — keep trying
    }
  }, [options, onContent, onWordCount, onError, onDone]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function startOrResume() {
      let id = resumeJobId;

      if (!id) {
        // Start new generation
        try {
          setPhaseDetail("Sending your profile and topic...");
          const res = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user,
              topic: options.topic,
              template: options.template,
              language: options.language,
            }),
          });

          if (!res.ok) {
            const err = await res.json();
            onError(err.error || "Generation failed");
            onDone();
            return;
          }

          const data = await res.json();
          id = data.bookId;
          setBookId(id);
          setStatus(data.status);

          // Persist job ID so we can resume after page refresh
          savePendingJob(id!, options.topic, options.template);

          if (data.status === "researching") {
            setPhaseDetail("Deep researching your topic — theories, researchers, frameworks...");
          } else {
            setPhaseDetail("Writing your book...");
          }
        } catch (err: any) {
          onError(err.message || "Network error");
          onDone();
          return;
        }
      } else {
        setPhaseDetail("Reconnecting to your book generation...");
      }

      // Start polling every 3 seconds
      pollRef.current = setInterval(() => pollStatus(id!), 3000);
      // Also poll immediately
      pollStatus(id!);
    }

    startOrResume();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const isResearching = status === "researching";
  const isWriting = status === "writing";

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 mb-6">
        {isResearching ? (
          <Search className="w-8 h-8 text-accent animate-pulse" />
        ) : (
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        )}
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">
        {isResearching ? "Researching your topic" : "Writing your book"}
      </h1>
      <p className="text-muted mb-2">{phaseDetail}</p>
      {isWriting && <p className="text-sm font-mono text-accent">{wc.toLocaleString()} words</p>}

      {/* Phase indicator */}
      <div className="flex items-center justify-center gap-3 mt-6 mb-2">
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
          isWriting ? "bg-green-50 text-green-700" : isResearching ? "bg-accent/10 text-accent" : "bg-cream text-muted"
        }`}>
          {isWriting ? <Check className="w-3 h-3" /> : isResearching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Research
        </div>
        <div className="w-6 h-px bg-border-light" />
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
          isWriting ? "bg-accent/10 text-accent" : "bg-cream text-muted"
        }`}>
          {isWriting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Writing
        </div>
      </div>

      {/* Safe to leave message */}
      <p className="text-xs text-muted/60 mt-4">
        You can close this page — your book will keep generating in the background.
        <br />Come back anytime to check progress.
      </p>

      {/* Live preview */}
      {preview && (
        <div className="mt-6 text-left bg-cream rounded-xl p-5 border border-border-light max-h-48 overflow-hidden relative">
          <div className="text-xs font-mono text-muted mb-2">LIVE PREVIEW</div>
          <div className="text-sm text-muted/80 leading-relaxed whitespace-pre-wrap font-serif">
            {preview.slice(-300)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-cream to-transparent" />
        </div>
      )}
    </div>
  );
}

// ─── Step 5: Done ───
function DoneStep({
  user, options, content, wordCount, error,
}: {
  user: UserInfo; options: BookOptions; content: string; wordCount: number; error: string;
}) {
  const [showReader, setShowReader] = useState(false);
  const filename = options.topic.replace(/\s+/g, "_");

  function download(format: "html" | "md" | "pdf") {
    if (format === "md") {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${filename}.md`; a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const css = `body{font-family:Georgia,serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1a1a1a}h1{font-size:2em;color:#0a3d62;border-bottom:1px solid #ccc;padding-bottom:.3em}h2{font-size:1.5em;color:#1e5f8a;border-bottom:1px solid #eee;padding-bottom:.2em}h3{font-size:1.2em;color:#2c3e50}blockquote{border-left:3px solid #0a3d62;padding-left:1em;color:#555;font-style:italic}code{background:#f4f4f4;padding:.1em .3em;border-radius:2px;font-size:.9em}pre{background:#f4f4f4;padding:1em;border-radius:4px;overflow:auto}strong{color:#0a3d62}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5em}th{background:#f0f4f8}@media print{body{max-width:100%;margin:0;padding:1cm}}`;
    const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${options.topic}</title><style>${css}</style></head><body>${markdownToHtml(content)}</body></html>`;

    if (format === "pdf") {
      const win = window.open("", "_blank");
      if (win) { win.document.write(htmlContent); win.document.close(); setTimeout(() => win.print(), 500); }
      return;
    }

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.html`; a.click();
    URL.revokeObjectURL(url);
  }

  if (error && !content) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4">⚠</div>
        <h1 className="text-2xl font-bold mb-3">Generation Error</h1>
        <p className="text-muted mb-6">{error}</p>
        <p className="text-sm text-muted mb-6">
          Make sure <code className="bg-cream px-2 py-0.5 rounded text-xs">ANTHROPIC_API_KEY</code> is set in your environment.
        </p>
        <Link href="/generate" className="btn-primary">
          Try Again <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  if (showReader) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setShowReader(false)} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => download("html")} className="btn-ghost text-xs">HTML</button>
            <button onClick={() => download("md")} className="btn-ghost text-xs">Markdown</button>
            <button onClick={() => download("pdf")} className="btn-ghost text-xs">PDF</button>
          </div>
        </div>
        <article className="prose prose-lg font-serif"
          dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
      </div>
    );
  }

  return (
    <div className="text-center py-12">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-6">
        <Check className="w-8 h-8 text-green-600" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-2">Your book is ready!</h1>
      <p className="text-muted mb-2">
        <span className="font-medium text-ink">{options.topic}</span>
      </p>
      <p className="text-sm font-mono text-muted mb-8">
        {wordCount.toLocaleString()} words · {templateInfo[options.template]?.label || options.template}
      </p>

      <button onClick={() => setShowReader(true)} className="btn-primary mb-6">
        <Eye className="w-4 h-4" /> Read Now
      </button>

      <div className="mb-10">
        <p className="text-xs text-muted mb-3">Download as</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => download("html")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-ink hover:border-ink/30 transition-colors">
            <Download className="w-4 h-4" /> HTML
          </button>
          <button onClick={() => download("md")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-ink hover:border-ink/30 transition-colors">
            <Download className="w-4 h-4" /> Markdown
          </button>
          <button onClick={() => download("pdf")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-ink hover:border-ink/30 transition-colors">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>
      </div>

      <div className="border-t border-border-light pt-8 mt-4 flex items-center justify-center gap-6">
        <Link href="/generate" className="text-sm text-accent font-medium hover:underline flex items-center gap-1">
          Generate another <ArrowRight className="w-3 h-3" />
        </Link>
        <Link href="/library" className="text-sm text-muted hover:text-ink transition-colors">
          View Library
        </Link>
      </div>
    </div>
  );
}

// ─── Shared ───
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      {children}
    </div>
  );
}
