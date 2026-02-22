"use client";

import { useState, useEffect, useRef } from "react";
import { BookOpen, ArrowRight, Lock } from "lucide-react";

const PIN_STORAGE_KEY = "bookfactory_pin_verified";

export function PinGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"checking" | "locked" | "open">("checking");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if already verified in this browser
    const verified = localStorage.getItem(PIN_STORAGE_KEY);
    if (verified === "true") {
      setStatus("open");
      return;
    }

    // Check if PIN is even required (server will tell us)
    fetch("/api/verify-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: "__check__" }),
    }).then((res) => {
      if (res.ok) {
        // No PIN needed
        localStorage.setItem(PIN_STORAGE_KEY, "true");
        setStatus("open");
      } else {
        setStatus("locked");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }).catch(() => {
      // Network error — let them through, API routes will catch it
      setStatus("open");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      if (res.ok) {
        localStorage.setItem(PIN_STORAGE_KEY, "true");
        setStatus("open");
      } else {
        setError("Wrong PIN. Try again.");
        setPin("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Network error. Try again.");
    }

    setLoading(false);
  }

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === "open") {
    return <>{children}</>;
  }

  // Locked — show PIN entry
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-xs">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-ink mb-4">
            <BookOpen className="w-7 h-7 text-paper" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Book Factory</h1>
          <p className="text-sm text-muted">Enter PIN to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="relative mb-4">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN"
              className="input pl-10 text-center text-lg tracking-[0.3em] font-mono"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={!pin.trim() || loading}
            className="btn-primary w-full justify-center"
          >
            {loading ? "Checking..." : "Enter"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
