/**
 * CJK-aware word counter.
 * Chinese/Japanese/Korean text has no spaces between words,
 * so we count each CJK character as ~1 word, plus whitespace-split for non-CJK.
 */
export function countWords(text: string): number {
  if (!text) return 0;

  // CJK Unified Ideographs + CJK punctuation + Hangul + Katakana/Hiragana
  const cjkRegex =
    /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\ufe30-\ufe4f\uac00-\ud7af\u3040-\u309f\u30a0-\u30ff]/g;

  const cjkChars = text.match(cjkRegex);
  const cjkCount = cjkChars ? cjkChars.length : 0;

  // Remove CJK characters, then count remaining words by whitespace
  const nonCjk = text.replace(cjkRegex, " ").trim();
  const nonCjkWords = nonCjk ? nonCjk.split(/\s+/).filter(Boolean) : [];

  return cjkCount + nonCjkWords.length;
}
