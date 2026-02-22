"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, Search, Clock, ArrowRight, Trash2, Download, Eye, ArrowLeft, X } from "lucide-react";
import Link from "next/link";
import { getBooks, deleteBook, type StoredBook } from "@/lib/storage";
import { markdownToHtml } from "@/lib/markdown-to-html";

export default function LibraryPage() {
  const [books, setBooks] = useState<StoredBook[]>([]);
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [readingBook, setReadingBook] = useState<StoredBook | null>(null);

  useEffect(() => {
    setBooks(getBooks());
    setLoaded(true);
  }, []);

  const filtered = books.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.topic.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(id: string) {
    deleteBook(id);
    setBooks(getBooks());
  }

  function downloadHtml(book: StoredBook) {
    const css = `body{font-family:Georgia,serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#1a1a1a}h1{font-size:2em;color:#0a3d62;border-bottom:1px solid #ccc;padding-bottom:.3em}h2{font-size:1.5em;color:#1e5f8a;border-bottom:1px solid #eee;padding-bottom:.2em}h3{font-size:1.2em;color:#2c3e50}blockquote{border-left:3px solid #0a3d62;padding-left:1em;color:#555;font-style:italic}code{background:#f4f4f4;padding:.1em .3em;border-radius:2px;font-size:.9em}pre{background:#f4f4f4;padding:1em;border-radius:4px;overflow:auto}strong{color:#0a3d62}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:.5em}th{background:#f0f4f8}`;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${book.title}</title><style>${css}</style></head><body>${markdownToHtml(book.content)}</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${book.title.replace(/\s+/g, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Book reader view
  if (readingBook) {
    return (
      <div className="min-h-screen bg-paper">
        <header className="border-b border-border-light sticky top-0 bg-paper/95 backdrop-blur-sm z-10">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <button onClick={() => setReadingBook(null)} className="btn-ghost">
              <ArrowLeft className="w-4 h-4" /> Back to Library
            </button>
            <span className="text-sm font-medium truncate max-w-xs">{readingBook.title}</span>
            <button onClick={() => downloadHtml(readingBook)} className="btn-ghost">
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <article
            className="prose font-serif"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(readingBook.content) }}
          />
        </div>
      </div>
    );
  }

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
            <p className="text-muted text-sm mt-1">
              {loaded ? `${filtered.length} book${filtered.length !== 1 ? "s" : ""}` : "Loading..."}
            </p>
          </div>

          {books.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search books..."
                className="pl-9 pr-4 py-2 rounded-lg border border-border-light bg-paper text-sm placeholder:text-muted/40 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent w-64 transition-all"
              />
            </div>
          )}
        </div>

        {/* Book grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((book) => (
              <div
                key={book.id}
                className="group bg-surface rounded-2xl border border-border-light p-6 hover:border-border hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-cream text-xs font-medium text-muted capitalize">
                      {book.template.replace("-", " ")}
                    </span>
                    <span className="text-xs text-muted font-mono">
                      {book.wordCount.toLocaleString()} words
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="w-3 h-3" />
                    {new Date(book.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <h3 className="text-base font-semibold mb-4 group-hover:text-accent transition-colors">
                  {book.title}
                </h3>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReadingBook(book)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                  >
                    <Eye className="w-3 h-3" /> Read
                  </button>
                  <button
                    onClick={() => downloadHtml(book)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cream text-xs font-medium text-muted hover:text-ink transition-colors"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                  <button
                    onClick={() => handleDelete(book.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted/50 hover:text-red-500 hover:bg-red-50 transition-colors ml-auto"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : loaded ? (
          <div className="text-center py-16 border-2 border-dashed border-border-light rounded-2xl">
            {books.length > 0 ? (
              <>
                <p className="text-muted text-sm mb-3">No books match &ldquo;{search}&rdquo;</p>
                <button onClick={() => setSearch("")} className="text-sm text-accent font-medium hover:underline">
                  Clear search
                </button>
              </>
            ) : (
              <>
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
                <p className="text-muted text-sm mb-6">Generate your first book — it takes about 2 minutes to start.</p>
                <Link
                  href="/generate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-paper rounded-xl text-sm font-medium hover:bg-ink/90 transition-colors"
                >
                  Generate your first book
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
