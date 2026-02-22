/**
 * Web version of the prompt builder.
 * Replicates the 8-component system from the CLI, adapted for SaaS.
 */

export interface WebUserProfile {
  name: string;
  role: string;
  interests: string;
  about: string; // open_profile equivalent
}

export interface GenerateRequest {
  user: WebUserProfile;
  topic: string;
  template: "comprehensive" | "deep-dive" | "quick-read" | "practical-guide";
  language: "en" | "zh" | "es";
}

const TEMPLATE_SPECS = {
  comprehensive: {
    display: "Comprehensive",
    words: { min: 8000, max: 12000 },
    chapters: { min: 6, max: 10 },
    sections: [
      "Core Concepts — key ideas, mechanisms, theories, named researchers",
      "Frameworks & Mental Models — actionable mental models for thinking and applying",
      "Practical Application — real work scenarios, decision procedures",
      "Common Pitfalls — what people get wrong, subtle expert mistakes",
    ],
    synthesis_words: 1000,
  },
  "deep-dive": {
    display: "Deep Dive",
    words: { min: 15000, max: 25000 },
    chapters: { min: 8, max: 12 },
    sections: [
      "Core Concepts — mechanisms, history, debate, named researchers, key papers",
      "The Cognitive Framework — mental models, changed thinking, decision making",
      "Application to Your Role — concrete work scenarios, domain-specific application",
      "What Most People Get Wrong — misconceptions, subtle errors, detection methods",
      "Underwater Knowledge — practitioner secrets, political dimensions, career implications",
      "Worked Examples / Case Studies — at least 2 detailed examples per chapter",
      "Practice Exercises — real problems with expected reasoning process",
    ],
    synthesis_words: 2000,
  },
  "quick-read": {
    display: "Quick Read",
    words: { min: 3000, max: 5000 },
    chapters: { min: 4, max: 6 },
    sections: [
      "Key Ideas — essential concepts explained clearly and concisely",
      "So What? — why it matters in practice, how to use it",
    ],
    synthesis_words: 500,
  },
  "practical-guide": {
    display: "Practical Guide",
    words: { min: 10000, max: 15000 },
    chapters: { min: 6, max: 10 },
    sections: [
      "Concept in Brief — just enough theory for the why",
      "Step-by-Step Method — detailed how-to with decision points",
      "Worked Example — complete real-world application walkthrough",
      "Practice Exercise — realistic exercise with hints and solution",
      "Common Mistakes & Troubleshooting — what goes wrong and how to fix it",
    ],
    synthesis_words: 1000,
  },
};

const LANGUAGE_POLICIES: Record<string, string> = {
  en: "Write entirely in English. Use standard academic/professional English.",
  zh: `主体语言：中文。整本书用中文撰写。重要术语/概念用英文附注，格式：构念效度（construct validity）。关键理论名称、人名保留英文。`,
  es: "Escribe completamente en español. Los términos técnicos clave pueden incluir el original en inglés entre paréntesis.",
};

export function buildWebPrompt(req: GenerateRequest): string {
  const spec = TEMPLATE_SPECS[req.template];
  const langPolicy = LANGUAGE_POLICIES[req.language] || LANGUAGE_POLICIES.en;

  const sections: string[] = [];

  // 1. System Identity
  sections.push(`# Book Generation Instructions

You are writing a comprehensive, personalized book. This is NOT an outline, NOT bullet points, NOT headers with 2 sentences each.

A real book means:
- ${spec.words.min.toLocaleString()}–${spec.words.max.toLocaleString()} words of substantive, well-researched prose
- ${spec.chapters.min}–${spec.chapters.max} chapters, each with real depth
- Narrative exposition, concrete examples, case studies, frameworks
- Real research findings, named theories, named researchers, specific studies
- Counterarguments and limitations — not cheerleading
- Decision procedures: "when you face X, do Y because Z"`);

  // 2. User Profile
  let profile = `# Who This Book Is For\n\n- **Name:** ${req.user.name}`;
  if (req.user.role) profile += `\n- **Role:** ${req.user.role}`;
  if (req.user.interests) profile += `\n- **Interests:** ${req.user.interests}`;
  if (req.user.about) {
    profile += `\n\n### About the Reader\n${req.user.about}`;
  }
  profile += `\n\nThis book must be deeply personalized to this reader.`;
  sections.push(profile);

  // 3. Language
  sections.push(`# Language\n${langPolicy}`);

  // 4. Book Definition
  sections.push(`# Specifications

- **Template:** ${spec.display}
- **Target:** ${spec.words.min.toLocaleString()}–${spec.words.max.toLocaleString()} words
- **Chapters:** ${spec.chapters.min}–${spec.chapters.max}
- Before writing: output an outline with estimated word counts, then execute`);

  // 5. Structure
  let structure = `# Chapter Structure\n\nEach chapter includes:\n`;
  for (const s of spec.sections) {
    structure += `- **${s}**\n`;
  }
  structure += `\nEnd with a Synthesis Chapter (~${spec.synthesis_words} words): how all chapters connect, meta-framework, decision tree.`;
  structure += `\nAppendix: glossary, recommended reading (10+ annotated sources).`;
  sections.push(structure);

  // 6. Topic
  sections.push(`# Topic\n\n**Write a book on:** ${req.topic}`);

  // 7. Quality
  sections.push(`# Quality Checklist
- Is this genuinely ${spec.words.min.toLocaleString()}+ words of substance?
- Would a smart reader learn something from every chapter?
- Are there real citations, named theories, researchers?
- Are there concrete examples, not just abstractions?
- Is it personalized to the reader's context?
- Does it include practical decision procedures?`);

  // 8. Output
  sections.push(`# Output Format
Write the complete book in Markdown format. Start with the title as an H1 heading.
Use H2 for chapters, H3 for sections within chapters.
USE TOKENS GENEROUSLY. Quality and depth are the #1 priority.`);

  return sections.join("\n\n---\n\n");
}
