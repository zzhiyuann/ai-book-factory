"use client";

import { useState } from "react";
import { BookOpen, ArrowRight, ArrowLeft, Sparkles, Check, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";

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

export default function GeneratePage() {
  const [step, setStep] = useState<Step>("about");
  const [user, setUser] = useState<UserInfo>({ name: "", role: "", interests: "", about: "" });
  const [options, setOptions] = useState<BookOptions>({ topic: "", template: "comprehensive", language: "en" });

  // Read topic from URL if present
  if (typeof window !== "undefined" && options.topic === "") {
    const params = new URLSearchParams(window.location.search);
    const urlTopic = params.get("topic");
    if (urlTopic) {
      setOptions((o) => ({ ...o, topic: urlTopic }));
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-border-light">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-ink flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-paper" />
            </div>
            <span className="text-sm font-medium">Book Factory</span>
          </div>
          <div className="w-16" /> {/* spacer */}
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-3xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-2 mb-2">
          {(["about", "topic", "options"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-1.5 rounded-full flex-1 transition-colors duration-500 ${
                  step === s
                    ? "bg-accent"
                    : ["topic", "options", "generating", "done"].indexOf(step) > i - 1 &&
                      i < ["about", "topic", "options"].indexOf(step) + 1
                    ? "bg-accent"
                    : "bg-border-light"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted px-1">
          <span className={step === "about" ? "text-ink font-medium" : ""}>About You</span>
          <span className={step === "topic" ? "text-ink font-medium" : ""}>Topic</span>
          <span className={step === "options" ? "text-ink font-medium" : ""}>Options</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-12">
        {step === "about" && (
          <AboutStep user={user} onChange={setUser} onNext={() => setStep("topic")} />
        )}
        {step === "topic" && (
          <TopicStep
            options={options}
            onChange={setOptions}
            onBack={() => setStep("about")}
            onNext={() => setStep("options")}
          />
        )}
        {step === "options" && (
          <OptionsStep
            options={options}
            onChange={setOptions}
            onBack={() => setStep("topic")}
            onGenerate={() => setStep("generating")}
          />
        )}
        {step === "generating" && (
          <GeneratingStep
            user={user}
            options={options}
            onDone={() => setStep("done")}
          />
        )}
        {step === "done" && <DoneStep user={user} options={options} />}
      </div>
    </div>
  );
}

function AboutStep({
  user,
  onChange,
  onNext,
}: {
  user: UserInfo;
  onChange: (u: UserInfo) => void;
  onNext: () => void;
}) {
  const canProceed = user.name.trim().length > 0;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Tell us about yourself</h1>
      <p className="text-muted mb-8">
        The more we know, the more personalized your book will be. Only your name is required.
      </p>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Name <span className="text-accent">*</span>
          </label>
          <input
            type="text"
            value={user.name}
            onChange={(e) => onChange({ ...user, name: e.target.value })}
            placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl border border-border bg-paper text-base placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Role</label>
          <input
            type="text"
            value={user.role}
            onChange={(e) => onChange({ ...user, role: e.target.value })}
            placeholder="e.g., Software Engineer, Product Manager, Student"
            className="w-full px-4 py-3 rounded-xl border border-border bg-paper text-base placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Interests</label>
          <input
            type="text"
            value={user.interests}
            onChange={(e) => onChange({ ...user, interests: e.target.value })}
            placeholder="e.g., machine learning, behavioral science, leadership"
            className="w-full px-4 py-3 rounded-xl border border-border bg-paper text-base placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">
            About you{" "}
            <span className="text-muted font-normal">— the secret sauce (optional)</span>
          </label>
          <p className="text-xs text-muted mb-2">
            Your background, what you're working on, how you think, what challenges you face.
            This gets injected directly into every book we generate for you.
          </p>
          <textarea
            value={user.about}
            onChange={(e) => onChange({ ...user, about: e.target.value })}
            placeholder="I'm a software engineer working on recommendation systems. I think in systems — how components interact, where bottlenecks emerge..."
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-border bg-paper text-base placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all resize-y"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper rounded-xl text-sm font-medium hover:bg-ink/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next: Pick a Topic
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TopicStep({
  options,
  onChange,
  onBack,
  onNext,
}: {
  options: BookOptions;
  onChange: (o: BookOptions) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const suggestions = [
    "Game Theory for Strategic Decisions",
    "Systems Thinking in Complex Organizations",
    "Cognitive Biases and How to Overcome Them",
    "First Principles Thinking",
    "Negotiation Frameworks",
    "Behavioral Economics in Product Design",
    "Causal Inference for Practitioners",
    "Writing for Influence",
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">What do you want to learn?</h1>
      <p className="text-muted mb-8">Any topic. The AI will research it deeply and write a comprehensive book.</p>

      <div>
        <label className="block text-sm font-medium mb-1.5">Topic</label>
        <input
          type="text"
          value={options.topic}
          onChange={(e) => onChange({ ...options, topic: e.target.value })}
          placeholder="e.g., Game Theory for Product Decisions"
          className="w-full px-4 py-3 rounded-xl border border-border bg-paper text-lg placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
          autoFocus
        />
      </div>

      <div className="mt-6">
        <div className="text-xs text-muted mb-3">Need inspiration?</div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onChange({ ...options, topic: s })}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                options.topic === s
                  ? "bg-accent-glow border-accent/30 text-accent"
                  : "bg-cream border-border-light text-muted hover:text-ink hover:border-border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!options.topic.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper rounded-xl text-sm font-medium hover:bg-ink/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next: Options
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function OptionsStep({
  options,
  onChange,
  onBack,
  onGenerate,
}: {
  options: BookOptions;
  onChange: (o: BookOptions) => void;
  onBack: () => void;
  onGenerate: () => void;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Customize your book</h1>
      <p className="text-muted mb-8">Choose a template and language. You can always change these later.</p>

      {/* Template selection */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-3">Template</label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(templateInfo) as [keyof typeof templateInfo, typeof templateInfo[keyof typeof templateInfo]][]).map(
            ([key, info]) => (
              <button
                key={key}
                onClick={() => onChange({ ...options, template: key })}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  options.template === key
                    ? "border-accent bg-accent-glow"
                    : "border-border-light hover:border-border"
                }`}
              >
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

      {/* Language */}
      <div className="mb-8">
        <label className="block text-sm font-medium mb-3">Language</label>
        <div className="flex gap-3">
          {([
            { key: "en", label: "English" },
            { key: "zh", label: "中文" },
            { key: "es", label: "Español" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onChange({ ...options, language: key })}
              className={`px-5 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                options.language === key
                  ? "border-accent bg-accent-glow text-accent"
                  : "border-border-light text-muted hover:border-border"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-cream rounded-xl p-5 border border-border-light mb-8">
        <div className="text-xs font-mono text-muted mb-2">PREVIEW</div>
        <div className="text-base font-semibold mb-1">{options.topic || "Your Topic"}</div>
        <div className="text-sm text-muted">
          {templateInfo[options.template].label} · {templateInfo[options.template].words} ·{" "}
          {options.language === "en" ? "English" : options.language === "zh" ? "Chinese" : "Spanish"}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onGenerate}
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-ink text-paper rounded-xl text-base font-medium hover:bg-ink/90 transition-all hover:gap-3"
        >
          <Sparkles className="w-4 h-4" />
          Generate My Book
        </button>
      </div>
    </div>
  );
}

function GeneratingStep({
  user,
  options,
  onDone,
}: {
  user: UserInfo;
  options: BookOptions;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState(0);

  const phases = [
    "Analyzing your profile...",
    "Researching the topic deeply...",
    "Organizing chapters...",
    "Writing your personalized book...",
    "Applying formatting...",
  ];

  // Simulate phases
  useState(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < phases.length) {
        setPhase(i);
      } else {
        clearInterval(interval);
        // In real SaaS, this would poll an API
        setTimeout(onDone, 2000);
      }
    }, 3000);
    return () => clearInterval(interval);
  });

  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent-glow mb-8">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-3">
        Writing your book...
      </h1>
      <p className="text-muted mb-10">
        Claude is researching and writing a comprehensive book on{" "}
        <span className="font-medium text-ink">{options.topic}</span>.
        This takes a few minutes.
      </p>

      <div className="max-w-sm mx-auto space-y-3">
        {phases.map((p, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 text-sm transition-all duration-500 ${
              i < phase ? "text-ink" : i === phase ? "text-accent" : "text-muted/40"
            }`}
          >
            {i < phase ? (
              <Check className="w-4 h-4 text-success shrink-0" />
            ) : i === phase ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-current shrink-0" />
            )}
            {p}
          </div>
        ))}
      </div>

      <div className="mt-12 p-4 bg-cream rounded-xl text-xs text-muted font-mono max-w-sm mx-auto">
        In the full version, this calls the Claude API to generate your book in real-time.
        The CLI version (<code>bookfactory generate</code>) is fully functional.
      </div>
    </div>
  );
}

function DoneStep({ user, options }: { user: UserInfo; options: BookOptions }) {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-8">
        <Check className="w-8 h-8 text-success" />
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-3">Your book is ready!</h1>
      <p className="text-muted mb-10">
        <span className="font-medium text-ink">{options.topic}</span>
        {" "}— a {templateInfo[options.template].words} personalized book just for {user.name || "you"}.
      </p>

      <div className="flex items-center justify-center gap-4 mb-10">
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper rounded-xl text-sm font-medium hover:bg-ink/90 transition-colors">
          <BookOpen className="w-4 h-4" />
          Read Now
        </button>
        <button className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-sm font-medium text-ink hover:border-ink/30 transition-colors">
          Download HTML
        </button>
      </div>

      <div className="border-t border-border-light pt-8 mt-8">
        <p className="text-sm text-muted mb-4">Want to generate more?</p>
        <Link
          href="/generate"
          className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:underline"
        >
          Generate another book
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-10 p-4 bg-cream rounded-xl text-xs text-muted max-w-md mx-auto">
        <strong>Want the full experience?</strong> Install the CLI for unlimited local generation:
        <code className="block mt-2 font-mono bg-paper px-3 py-2 rounded-lg">npm install -g ai-book-factory</code>
      </div>
    </div>
  );
}
