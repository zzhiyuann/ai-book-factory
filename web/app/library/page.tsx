"use client";

import { BookOpen, Plus, Search, Filter, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

// Demo data — in real app, fetched from API/database
const demoBooks = [
  {
    id: 1,
    title: "Game Theory for Strategic Product Decisions",
    template: "Deep Dive",
    words: "18,432",
    date: "2026-02-22",
    topics: ["game theory", "product strategy", "decision making"],
  },
  {
    id: 2,
    title: "Systems Thinking in Software Architecture",
    template: "Comprehensive",
    words: "11,205",
    date: "2026-02-21",
    topics: ["systems thinking", "architecture", "complexity"],
  },
  {
    id: 3,
    title: "Cognitive Biases in User Research",
    template: "Practical Guide",
    words: "13,890",
    date: "2026-02-20",
    topics: ["cognitive biases", "UX research", "psychology"],
  },
  {
    id: 4,
    title: "First Principles Thinking",
    template: "Quick Read",
    words: "4,521",
    date: "2026-02-19",
    topics: ["first principles", "reasoning", "problem solving"],
  },
];

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="border-b border-border-light">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-paper" />
            </div>
            <span className="text-base font-semibold">Book Factory</span>
          </Link>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Book
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Library</h1>
            <p className="text-muted text-sm mt-1">{demoBooks.length} books generated</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search books..."
              className="pl-9 pr-4 py-2 rounded-lg border border-border-light bg-paper text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-64 transition-all"
            />
          </div>
        </div>

        {/* Book grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {demoBooks.map((book) => (
            <div
              key={book.id}
              className="group bg-surface rounded-2xl border border-border-light p-6 hover:border-border hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-cream text-xs font-medium text-muted">
                    {book.template}
                  </span>
                  <span className="text-xs text-muted font-mono">{book.words} words</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="w-3 h-3" />
                  {book.date}
                </div>
              </div>

              <h3 className="text-base font-semibold mb-3 group-hover:text-accent transition-colors">
                {book.title}
              </h3>

              <div className="flex flex-wrap gap-1.5">
                {book.topics.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-accent-glow text-xs text-accent"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state hint */}
        <div className="mt-12 text-center py-8 border-2 border-dashed border-border-light rounded-2xl">
          <p className="text-muted text-sm mb-3">Your books will appear here after generation</p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:underline"
          >
            Generate your first book
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
