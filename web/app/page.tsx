"use client";

import { useState } from "react";
import { BookOpen, Sparkles, Zap, Library, ArrowRight, ChevronDown, User, Brain, Send } from "lucide-react";
import Link from "next/link";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-border-light">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
            <BookOpen className="w-4.5 h-4.5 text-paper" strokeWidth={2} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Book Factory</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#how" className="text-sm text-muted hover:text-ink transition-colors">How It Works</a>
          <a href="#templates" className="text-sm text-muted hover:text-ink transition-colors">Templates</a>
          <a href="#demo" className="text-sm text-muted hover:text-ink transition-colors">Try It</a>
          <Link
            href="/generate"
            className="text-sm font-medium bg-ink text-paper px-4 py-2 rounded-lg hover:bg-ink/90 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-glow border border-accent/20 mb-8">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-medium text-accent">Powered by Claude AI</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
          Your personal AI writes
          <br />
          <span className="text-accent">books just for you</span>
        </h1>

        <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Tell us who you are and what you want to learn. We generate comprehensive,
          deeply personalized books — 8,000 to 25,000 words — tailored to your
          background, role, and thinking style.
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-paper rounded-xl text-base font-medium hover:bg-ink/90 transition-all hover:gap-3"
          >
            Generate Your First Book
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-xl text-base font-medium text-ink hover:border-ink/30 transition-colors"
          >
            See a Demo
          </a>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-12 text-sm text-muted">
          <div>
            <span className="block text-2xl font-semibold text-ink">15,000+</span>
            words per book
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <span className="block text-2xl font-semibold text-ink">4</span>
            book templates
          </div>
          <div className="w-px h-10 bg-border" />
          <div>
            <span className="block text-2xl font-semibold text-ink">100%</span>
            personalized
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: User,
      title: "Tell us about you",
      description:
        "Your role, interests, and what you're working on. The more you share, the more personalized your books become.",
      detail: "Takes 2 minutes. Or 30 seconds — your choice.",
    },
    {
      icon: Brain,
      title: "Pick a topic",
      description:
        "Choose any topic or let AI recommend ones tailored to your interests and knowledge gaps.",
      detail: "AI learns what you've read to avoid repetition.",
    },
    {
      icon: Sparkles,
      title: "AI researches & writes",
      description:
        "Claude does deep web research, then generates a full book with real citations, frameworks, and exercises.",
      detail: "Not summaries. Real, substantive books.",
    },
    {
      icon: Send,
      title: "Read anywhere",
      description:
        "Get your book as a beautifully styled HTML file. Read on any device, print it, or share it.",
      detail: "Delivered to email, Telegram, or just downloaded.",
    },
  ];

  return (
    <section id="how" className="py-24 px-6 bg-cream">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">How it works</h2>
          <p className="text-muted text-lg">Four steps. Two minutes to start. One incredible book.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className="bg-surface rounded-2xl p-8 border border-border-light hover:border-border hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-glow flex items-center justify-center shrink-0">
                  <step.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-xs font-mono text-muted mb-1">Step {i + 1}</div>
                  <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted text-sm leading-relaxed mb-2">
                    {step.description}
                  </p>
                  <p className="text-xs text-muted/60 font-mono">{step.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Templates() {
  const templates = [
    {
      name: "Deep Dive",
      words: "15–25K",
      chapters: "8–12",
      description: "Maximum depth. Full section set with cognitive frameworks, tacit knowledge, case studies, and exercises.",
      best: "Topics you want to truly master",
      color: "from-blue-500 to-indigo-600",
    },
    {
      name: "Comprehensive",
      words: "8–12K",
      chapters: "6–10",
      description: "Balanced depth and breadth. Core concepts, frameworks, and practical applications.",
      best: "Most topics — the sweet spot",
      color: "from-emerald-500 to-teal-600",
      popular: true,
    },
    {
      name: "Quick Read",
      words: "3–5K",
      chapters: "4–6",
      description: "Focused overview. Gets to the point fast with key concepts and actionable takeaways.",
      best: "Surveying new areas quickly",
      color: "from-amber-500 to-orange-600",
    },
    {
      name: "Practical Guide",
      words: "10–15K",
      chapters: "6–10",
      description: "Hands-on with step-by-step methods, worked examples, and exercises with solutions.",
      best: "Skills where doing > knowing",
      color: "from-purple-500 to-pink-600",
    },
  ];

  return (
    <section id="templates" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Choose your depth</h2>
          <p className="text-muted text-lg">Four templates, from a focused read to a comprehensive deep-dive.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {templates.map((t) => (
            <div
              key={t.name}
              className="group relative bg-surface rounded-2xl p-7 border border-border-light hover:border-border hover:shadow-md transition-all"
            >
              {t.popular && (
                <div className="absolute -top-3 left-7 px-2.5 py-0.5 bg-accent text-white text-xs font-medium rounded-full">
                  Most Popular
                </div>
              )}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${t.color}`} />
                <h3 className="font-semibold text-lg">{t.name}</h3>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-4">{t.description}</p>
              <div className="flex items-center gap-4 text-xs font-mono text-muted">
                <span>{t.words} words</span>
                <span className="text-border">|</span>
                <span>{t.chapters} chapters</span>
              </div>
              <div className="mt-3 text-xs text-accent font-medium">Best for: {t.best}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  const [topic, setTopic] = useState("");

  const sampleTopics = [
    "Game Theory for Product Decisions",
    "Systems Thinking in Software Architecture",
    "Cognitive Biases in User Research",
    "Negotiation Frameworks for Engineers",
  ];

  return (
    <section id="demo" className="py-24 px-6 bg-cream">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-4">Try it now</h2>
        <p className="text-muted text-lg mb-10">Enter any topic and see what your book would look like.</p>

        <div className="bg-surface rounded-2xl border border-border-light p-8 text-left">
          <label className="block text-sm font-medium mb-2">What do you want to learn about?</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Game Theory for Product Decisions"
              className="flex-1 px-4 py-3 rounded-xl border border-border bg-paper text-base placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            />
            <Link
              href={`/generate${topic ? `?topic=${encodeURIComponent(topic)}` : ""}`}
              className="inline-flex items-center gap-2 px-5 py-3 bg-ink text-paper rounded-xl text-sm font-medium hover:bg-ink/90 transition-colors shrink-0"
            >
              Generate
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-5">
            <div className="text-xs text-muted mb-2">Or try one of these:</div>
            <div className="flex flex-wrap gap-2">
              {sampleTopics.map((t) => (
                <button
                  key={t}
                  onClick={() => setTopic(t)}
                  className="px-3 py-1.5 rounded-lg bg-cream border border-border-light text-xs text-muted hover:text-ink hover:border-border transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function WhatMakesItDifferent() {
  const features = [
    {
      title: "Not summaries — real books",
      description: "15,000+ words of substantive prose. Named researchers, real citations, detailed case studies. Every chapter teaches something substantial."
    },
    {
      title: "Deeply personalized",
      description: "Your open profile is injected into every prompt. The AI knows your role, your challenges, your thinking style. No two readers get the same book."
    },
    {
      title: "Gets smarter over time",
      description: "A knowledge graph tracks what you've learned. Each new book builds on previous ones — no repetition, deeper connections."
    },
    {
      title: "Honest, not cheerful",
      description: "Counterarguments, limitations, what most people get wrong. Your AI author is a rigorous research partner, not a yes-machine."
    },
  ];

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Not another AI gimmick</h2>
          <p className="text-muted text-lg">This is a serious learning tool that happens to be powered by AI.</p>
        </div>

        <div className="space-y-6">
          {features.map((f, i) => (
            <div key={i} className="flex gap-6 items-start">
              <div className="w-8 h-8 rounded-lg bg-ink text-paper flex items-center justify-center shrink-0 mt-0.5 font-mono text-sm font-bold">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-muted leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-border-light">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-ink flex items-center justify-center">
            <BookOpen className="w-3 h-3 text-paper" />
          </div>
          <span className="text-sm font-medium">Book Factory</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted">
          <a href="https://github.com/zzhiyuann/ai-book-factory" className="hover:text-ink transition-colors">
            GitHub
          </a>
          <span>MIT License</span>
          <span className="font-mono text-xs">npm i ai-book-factory</span>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Templates />
      <WhatMakesItDifferent />
      <DemoSection />
      <Footer />
    </main>
  );
}
