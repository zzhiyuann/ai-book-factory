/**
 * Zero-auth persistence via localStorage.
 * Profile and books are stored locally in the browser.
 * No account needed. Simple as possible.
 */

export interface StoredProfile {
  name: string;
  role: string;
  interests: string;
  about: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBook {
  id: string;
  title: string;
  topic: string;
  template: string;
  language: string;
  content: string; // full markdown
  wordCount: number;
  createdAt: string;
}

const PROFILE_KEY = "bookfactory_profile";
const BOOKS_KEY = "bookfactory_books";

// --- Profile ---

export function getProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveProfile(profile: Omit<StoredProfile, "createdAt" | "updatedAt">): StoredProfile {
  const existing = getProfile();
  const stored: StoredProfile = {
    ...profile,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(stored));
  return stored;
}

export function hasProfile(): boolean {
  return getProfile() !== null;
}

// --- Books ---

export function getBooks(): StoredBook[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(BOOKS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveBook(book: Omit<StoredBook, "id" | "createdAt">): StoredBook {
  const stored: StoredBook = {
    ...book,
    id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const books = getBooks();
  books.unshift(stored); // newest first
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
  return stored;
}

export function getBook(id: string): StoredBook | null {
  return getBooks().find((b) => b.id === id) || null;
}

export function deleteBook(id: string): void {
  const books = getBooks().filter((b) => b.id !== id);
  localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
}

export function getBookTopics(): string[] {
  return getBooks().map((b) => b.topic);
}
