"use client";

import { useState, useEffect } from "react";
import { BookOpen, Plus, User, Library } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getProfile, type StoredProfile } from "@/lib/storage";

export function Navbar() {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-border-light">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center">
            <BookOpen className="w-3.5 h-3.5 text-paper" strokeWidth={2} />
          </div>
          <span className="text-base font-semibold tracking-tight">Book Factory</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link
            href="/library"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isActive("/library")
                ? "bg-cream text-ink font-medium"
                : "text-muted hover:text-ink hover:bg-cream/50"
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            Library
          </Link>

          <Link
            href="/generate"
            className="flex items-center gap-1.5 ml-2 px-4 py-1.5 bg-ink text-paper rounded-lg text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Book
          </Link>

          <Link
            href="/profile"
            className={`flex items-center gap-1.5 ml-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              isActive("/profile")
                ? "bg-cream text-ink font-medium"
                : "text-muted hover:text-ink hover:bg-cream/50"
            }`}
          >
            {profile ? (
              <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center text-[10px] font-semibold text-accent">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <User className="w-3.5 h-3.5" />
            )}
            {profile ? profile.name.split(" ")[0] : "Profile"}
          </Link>
        </div>
      </div>
    </nav>
  );
}
