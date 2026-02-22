"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { use } from "react";
import {
  ArrowRight, ArrowLeft, Check, Loader2, Download, Eye, Search, Copy, BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { saveBook, getBooks } from "@/lib/storage";
import { markdownToHtml } from "@/lib/markdown-to-html";
import { countWords } from "@/lib/count-words";

const templateInfo: Record<string, { label: string }> = {
  comprehensive: { label: "Comprehensive" },
  "deep-dive": { label: "Deep Dive" },
  "quick-read": { label: "Quick Read" },
  "practical-guide": { label: "Practical Guide" },
};

interface BookStatus {
  id: string;
  status: "researching" | "writing" | "done" | "error";
  topic: string;
  template: string;
  language: string;
  wordCount: number;
  content?: string;
  preview?: string;
  error?: string;
}

export default function BookPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  const [book, setBook] = useState<BookStatus | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showReader, setShowReader] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(false);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/generate/status?id=${bookId}`);
      if (res.status === 404) {
        // Check localStorage as fallback (job expired from KV but book was saved)
        const local = getBooks().find((b) => b.id === bookId);
        if (local) {
          setBook({
            id: local.id,
            status: "done",
            topic: local.topic,
            template: local.template,
            language: local.language,
            wordCount: local.wordCount,
            content: local.content,
          });
        } else {
          setNotFound(true);
        }
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }
      const data: BookStatus = await res.json();
      setBook(data);

      if (data.status === "done" || data.status === "error") {
        if (pollRef.current) clearInterval(pollRef.current);

        // Save to localStorage once
        if (data.status === "done" && data.content && !savedRef.current) {
          savedRef.current = true;
          saveBook({
            id: bookId,
            title: data.topic,
            topic: data.topic,
            template: data.template,
            language: data.language,
            content: data.content,
            wordCount: data.wordCount || countWords(data.content),
          });
        }
      }
    } catch {
      // network error, keep polling
    }
  }, [bookId]);

  useEffect(() => {
    // Check localStorage first for instant load
    const local = getBooks().find((b) => b.id === bookId);
    if (local) {
      setBook({
        id: local.id,
        status: "done",
        topic: local.topic,
        template: local.template,
        language: local.language,
        wordCount: local.wordCount,
        content: local.content,
      });
      savedRef.current = true;
      // Still poll once in case KV has a newer version
      poll();
      return;
    }

    // Poll server
    poll();
    pollRef.current = setInterval(poll, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [bookId, poll]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="text-4xl mb-4">?</div>
          <h1 className="text-2xl font-bold mb-3">Book not found</h1>
          <p className="text-muted mb-2 text-sm font-mono break-all">{bookId}</p>
          <p className="text-muted mb-6">This book may have expired or the ID is incorrect.</p>
          <Link href="/generate" className="btn-primary">
            Generate a New Book <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading book status...</p>
          <p className="text-xs text-muted/50 font-mono mt-2">{bookId}</p>
        </div>
      </div>
    );
  }

  // ─── Reader View ───
  if (showReader && book.content) {
    return (
      <div className="min-h-screen bg-paper">
        <header className="border-b border-border-light sticky top-0 bg-paper/95 backdrop-blur-sm z-10">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <button onClick={() => setShowReader(false)} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span className="text-sm font-medium truncate max-w-xs">{book.topic}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => download(book, "html")} className="btn-ghost text-xs">HTML</button>
              <button onClick={() => download(book, "md")} className="btn-ghost text-xs">MD</button>
              <button onClick={() => download(book, "pdf")} className="btn-ghost text-xs">PDF</button>
            </div>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <article className="prose font-serif"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(book.content) }} />
        </div>
      </div>
    );
  }

  // ─── Generating View ───
  if (book.status === "researching" || book.status === "writing") {
    const isResearching = book.status === "researching";
    const wc = book.wordCount || 0;

    let phaseDetail = "Starting...";
    if (isResearching) {
      phaseDetail = "Deep researching your topic — theories, researchers, frameworks...";
    } else {
      if (wc < 500) phaseDetail = "Writing introduction...";
      else if (wc < 2000) phaseDetail = "Developing core chapters...";
      else if (wc < 5000) phaseDetail = "Deep into the content...";
      else if (wc < 8000) phaseDetail = "Writing advanced chapters...";
      else phaseDetail = "Wrapping up synthesis...";
    }

    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-16 text-center">
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
          <p className="text-muted mb-1">{book.topic}</p>
          <p className="text-sm text-muted/70 mb-2">{phaseDetail}</p>
          {!isResearching && <p className="text-sm font-mono text-accent">{wc.toLocaleString()} words</p>}

          {/* Phase indicator */}
          <div className="flex items-center justify-center gap-3 mt-6 mb-4">
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
              !isResearching ? "bg-green-50 text-green-700" : "bg-accent/10 text-accent"
            }`}>
              {!isResearching ? <Check className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
              Research
            </div>
            <div className="w-6 h-px bg-border-light" />
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
              !isResearching ? "bg-accent/10 text-accent" : "bg-cream text-muted"
            }`}>
              {!isResearching ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Writing
            </div>
          </div>

          {/* Book ID + copy link */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs font-mono text-muted/50">{bookId}</span>
            <button onClick={copyLink} className="text-xs text-muted/50 hover:text-accent transition-colors">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <p className="text-xs text-muted/60">
            You can close this page. Bookmark or copy the URL to come back later.
          </p>

          {/* Live preview */}
          {book.preview && (
            <div className="mt-6 text-left bg-cream rounded-xl p-5 border border-border-light max-h-48 overflow-hidden relative">
              <div className="text-xs font-mono text-muted mb-2">LIVE PREVIEW</div>
              <div className="text-sm text-muted/80 leading-relaxed whitespace-pre-wrap font-serif">
                {book.preview.slice(-300)}
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-cream to-transparent" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Error View ───
  if (book.status === "error") {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="text-4xl mb-4">⚠</div>
          <h1 className="text-2xl font-bold mb-3">Generation Error</h1>
          <p className="text-muted mb-2">{book.topic}</p>
          <p className="text-sm text-red-600 mb-6">{book.error}</p>
          {book.content && (
            <div className="mb-6">
              <p className="text-sm text-muted mb-2">Partial content was saved ({book.wordCount.toLocaleString()} words)</p>
              <button onClick={() => setShowReader(true)} className="btn-ghost text-sm">
                <Eye className="w-4 h-4" /> View Partial Content
              </button>
            </div>
          )}
          <Link href="/generate" className="btn-primary">
            Try Again <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ─── Done View ───
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 mb-6">
          <Check className="w-8 h-8 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-2">Your book is ready!</h1>
        <p className="text-muted mb-2">
          <span className="font-medium text-ink">{book.topic}</span>
        </p>
        <p className="text-sm font-mono text-muted mb-2">
          {book.wordCount.toLocaleString()} words · {templateInfo[book.template]?.label || book.template}
        </p>

        {/* Book ID + copy link */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <span className="text-xs font-mono text-muted/50">{bookId}</span>
          <button onClick={copyLink} className="text-xs text-muted/50 hover:text-accent transition-colors flex items-center gap-1">
            {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy link</>}
          </button>
        </div>

        <button onClick={() => setShowReader(true)} className="btn-primary mb-6">
          <Eye className="w-4 h-4" /> Read Now
        </button>

        <div className="mb-10">
          <p className="text-xs text-muted mb-3">Download as</p>
          <div className="flex items-center justify-center gap-3">
            {(["html", "md", "pdf"] as const).map((fmt) => (
              <button key={fmt} onClick={() => download(book, fmt)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium text-ink hover:border-ink/30 transition-colors">
                <Download className="w-4 h-4" /> {fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border-light pt-8 mt-4 flex items-center justify-center gap-6">
          <Link href="/generate" className="text-sm text-accent font-medium hover:underline flex items-center gap-1">
            Generate another <ArrowRight className="w-3 h-3" />
          </Link>
          <Link href="/library" className="text-sm text-muted hover:text-ink transition-colors flex items-center gap-1">
            <BookOpen className="w-3 h-3" /> Library
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Download helper ───
function download(book: BookStatus, format: "html" | "md" | "pdf") {
  if (!book.content) return;
  const filename = book.topic.replace(/\s+/g, "_");

  if (format === "md") {
    const blob = new Blob([book.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${filename}.md`; a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const css = `body{font-family:Georgia,serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1a1a1a}h1{font-size:2em;color:#0a3d62;border-bottom:1px solid #ccc;padding-bottom:.3em}h2{font-size:1.5em;color:#1e5f8a;border-bottom:1px solid #eee;padding-bottom:.2em}h3{font-size:1.2em;color:#2c3e50}blockquote{border-left:3px solid #0a3d62;padding-left:1em;color:#555;font-style:italic}code{background:#f4f4f4;padding:.1em .3em;border-radius:2px;font-size:.9em}pre{background:#f4f4f4;padding:1em;border-radius:4px;overflow:auto}strong{color:#0a3d62}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5em}th{background:#f0f4f8}@media print{body{max-width:100%;margin:0;padding:1cm}}`;
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${book.topic}</title><style>${css}</style></head><body>${markdownToHtml(book.content)}</body></html>`;

  if (format === "pdf") {
    const win = window.open("", "_blank");
    if (win) { win.document.write(htmlContent); win.document.close(); setTimeout(() => win.print(), 500); }
    return;
  }

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `${filename}.html`; a.click();
  URL.revokeObjectURL(url);
}
