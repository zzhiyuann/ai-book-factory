"use client";

import { useState, useEffect } from "react";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { getProfile, saveProfile, getBooks, type StoredProfile } from "@/lib/storage";

export default function ProfilePage() {
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", interests: "", about: "" });
  const [saved, setSaved] = useState(false);
  const [bookCount, setBookCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    if (p) {
      setForm({ name: p.name, role: p.role, interests: p.interests, about: p.about });
    } else {
      setEditing(true); // No profile yet — start in edit mode
    }
    setBookCount(getBooks().length);
    setLoaded(true);
  }, []);

  function handleSave() {
    const stored = saveProfile(form);
    setProfile(stored);
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!loaded) return null;

  // No profile — onboarding mode
  if (!profile && editing) {
    return (
      <div className="min-h-screen bg-paper">
        <Navbar />
        <div className="max-w-xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <div className="text-4xl mb-4">👋</div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Welcome to Book Factory</h1>
            <p className="text-muted">
              Tell us a bit about yourself so we can personalize your books.
              Only your name is required — everything else makes it better.
            </p>
          </div>

          <div className="space-y-5">
            <Field label="Your name" required>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="How should we address you?" className="input" autoFocus />
            </Field>
            <Field label="What do you do?">
              <input type="text" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g., Software Engineer, Student, Product Manager" className="input" />
            </Field>
            <Field label="What are you interested in?">
              <input type="text" value={form.interests}
                onChange={(e) => setForm({ ...form, interests: e.target.value })}
                placeholder="e.g., machine learning, psychology, leadership" className="input" />
            </Field>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Anything else about you?
                <span className="text-muted font-normal ml-1">— optional but powerful</span>
              </label>
              <p className="text-xs text-muted mb-2">
                Your background, what you&apos;re working on, how you think. This gets woven into every book we generate for you.
              </p>
              <textarea value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                placeholder="I'm a frontend engineer interested in..."
                rows={4} className="input resize-y" />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button onClick={handleSave} disabled={!form.name.trim()}
              className="btn-primary">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Has profile — view/edit mode
  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
            <p className="text-muted text-sm mt-1">
              This shapes every book we generate for you
            </p>
          </div>
          {!editing && (
            <button onClick={() => setEditing(true)} className="btn-ghost">
              Edit
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-8 py-3 px-5 bg-cream rounded-xl text-sm">
          <div>
            <span className="font-semibold text-ink">{bookCount}</span>
            <span className="text-muted ml-1">book{bookCount !== 1 ? "s" : ""} generated</span>
          </div>
          {profile?.createdAt && (
            <div className="text-muted">
              Member since {new Date(profile.createdAt).toLocaleDateString()}
            </div>
          )}
        </div>

        {saved && (
          <div className="mb-6 flex items-center gap-2 text-sm text-success bg-green-50 px-4 py-2.5 rounded-xl">
            <Check className="w-4 h-4" /> Profile saved. Your next book will reflect these changes.
          </div>
        )}

        {editing ? (
          <div className="space-y-5">
            <Field label="Name" required>
              <input type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input" />
            </Field>
            <Field label="Role">
              <input type="text" value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g., Software Engineer" className="input" />
            </Field>
            <Field label="Interests">
              <input type="text" value={form.interests}
                onChange={(e) => setForm({ ...form, interests: e.target.value })}
                placeholder="e.g., machine learning, psychology" className="input" />
            </Field>
            <div>
              <label className="block text-sm font-medium mb-1.5">About you</label>
              <textarea value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
                rows={5} className="input resize-y" />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={!form.name.trim()} className="btn-primary">
                Save Profile
              </button>
              <button onClick={() => {
                if (profile) {
                  setForm({ name: profile.name, role: profile.role, interests: profile.interests, about: profile.about });
                }
                setEditing(false);
              }} className="btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <ProfileField label="Name" value={profile?.name} />
            <ProfileField label="Role" value={profile?.role} />
            <ProfileField label="Interests" value={profile?.interests} />
            <ProfileField label="About" value={profile?.about} multiline />

            {!profile?.about && (
              <div className="bg-accent-glow rounded-xl p-4 text-sm">
                <p className="font-medium text-accent mb-1">Tip: Add an &ldquo;About&rdquo; section</p>
                <p className="text-muted">
                  The more you tell us about your background, goals, and thinking style, the more
                  personalized your books become. This text gets injected directly into the AI prompt.
                </p>
              </div>
            )}
          </div>
        )}
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

function ProfileField({ label, value, multiline }: { label: string; value?: string; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted font-medium uppercase tracking-wide mb-1">{label}</div>
      {value ? (
        multiline ? (
          <p className="text-ink leading-relaxed whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-ink">{value}</p>
        )
      ) : (
        <p className="text-muted/50 italic">Not set</p>
      )}
    </div>
  );
}
