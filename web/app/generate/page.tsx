"use client";

import { useState, useEffect } from "react";
import {
  ArrowRight, ArrowLeft, Sparkles, Check, Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getProfile, saveProfile } from "@/lib/storage";

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

export default function GeneratePage() {
  const router = useRouter();
  const [step, setStep] = useState<"about" | "topic" | "options">("about");
  const [user, setUser] = useState<UserInfo>({ name: "", role: "", interests: "", about: "" });
  const [options, setOptions] = useState<BookOptions>({ topic: "", template: "comprehensive", language: "en" });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const stored = getProfile();
    if (stored) {
      setUser({ name: stored.name, role: stored.role, interests: stored.interests, about: stored.about });
    }
    const params = new URLSearchParams(window.location.search);
    const urlTopic = params.get("topic");
    if (urlTopic) setOptions((o) => ({ ...o, topic: urlTopic }));
  }, []);

  function handleAboutNext() {
    saveProfile(user);
    setStep("topic");
  }

  async function handleGenerate() {
    setSubmitting(true);
    setSubmitError("");
    try {
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
        setSubmitError(err.error || "Failed to start generation");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      // Navigate to the book's dedicated page
      router.push(`/generate/${data.bookId}`);
    } catch (err: any) {
      setSubmitError(err.message || "Network error");
      setSubmitting(false);
    }
  }

  const stepIdx = ["about", "topic", "options"].indexOf(step);

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-colors duration-500 ${
              i <= stepIdx ? "bg-accent" : "bg-border-light"
            }`} />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted px-1">
          <span className={stepIdx === 0 ? "text-ink font-medium" : ""}>About You</span>
          <span className={stepIdx === 1 ? "text-ink font-medium" : ""}>Topic</span>
          <span className={stepIdx === 2 ? "text-ink font-medium" : ""}>Options</span>
        </div>
      </div>

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
            onBack={() => setStep("topic")}
            onGenerate={handleGenerate}
            submitting={submitting}
            error={submitError} />
        )}
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
  options, onChange, onBack, onGenerate, submitting, error,
}: {
  options: BookOptions; onChange: (o: BookOptions) => void;
  onBack: () => void; onGenerate: () => void;
  submitting: boolean; error: string;
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

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost" disabled={submitting}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={onGenerate} disabled={submitting}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-paper rounded-xl text-base font-medium hover:bg-ink/90 transition-all disabled:opacity-50">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {submitting ? "Starting..." : "Generate My Book"}
        </button>
      </div>
    </div>
  );
}

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
