/**
 * Web version of the prompt builder.
 * Replicates the 8-component system from the CLI, adapted for SaaS.
 * Two-phase approach: research brief first, then full book generation.
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

/**
 * Phase 1: Build research prompt.
 * Asks Claude to produce a detailed research brief before writing the book.
 */
export function buildResearchPrompt(req: GenerateRequest): string {
  const spec = TEMPLATE_SPECS[req.template];
  const langPolicy = LANGUAGE_POLICIES[req.language] || LANGUAGE_POLICIES.en;

  let userCtx = `Reader: ${req.user.name}`;
  if (req.user.role) userCtx += `, ${req.user.role}`;
  if (req.user.interests) userCtx += `. Interests: ${req.user.interests}`;
  if (req.user.about) userCtx += `\n\nAbout the reader:\n${req.user.about}`;

  return `You are a research assistant preparing a deep research brief for a book on: **${req.topic}**

${userCtx}

Language: ${langPolicy}

Template: ${spec.display} (${spec.words.min.toLocaleString()}–${spec.words.max.toLocaleString()} words, ${spec.chapters.min}–${spec.chapters.max} chapters)

## Your Task

Produce a comprehensive RESEARCH BRIEF that will serve as the foundation for writing this book. Be rigorous, specific, and scholarly. This is NOT the book itself — this is the research groundwork.

Include the following:

### 1. Conceptual Landscape
- The 10–15 most important concepts, theories, and frameworks in this domain
- For each: the originator/researcher, year, key insight, and why it matters
- How these concepts relate to and build on each other

### 2. Key Researchers & Works
- The 10–20 most influential researchers, their institutions, and seminal papers/books
- Key debates and disagreements in the field
- Recent developments (last 5 years) that have shifted understanding

### 3. Practical Applications
- Real-world case studies and examples that illustrate key concepts
- Industry applications, organizational examples, or personal use cases
- Decision frameworks practitioners actually use

### 4. Common Misconceptions
- What most people get wrong about this topic
- Subtle errors even experts make
- Counterintuitive findings that challenge conventional wisdom

### 5. Connections to Reader's Context
- How this topic specifically applies to the reader's role and interests
- Unique angles that would be most valuable for THIS reader
- Bridging concepts that connect this topic to the reader's existing knowledge

### 6. Proposed Book Outline
- ${spec.chapters.min}–${spec.chapters.max} chapter titles with brief descriptions
- Key sections within each chapter
- Estimated word counts per chapter (total target: ${spec.words.min.toLocaleString()}–${spec.words.max.toLocaleString()})
- How chapters build on each other

Be specific. Name real researchers, real theories, real papers. If you're unsure about a citation, say so — do not fabricate.
USE TOKENS GENEROUSLY. This research brief should be thorough and detailed (3,000–5,000 words).`;
}

/**
 * Phase 2: Build the full book generation prompt, incorporating the research brief.
 */
export function buildWritePrompt(req: GenerateRequest, researchBrief: string): string {
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
- Decision procedures: "when you face X, do Y because Z"
- Be a rigorous research partner, not a cheerleader
- Include contrarian views — not just mainstream consensus`);

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

  // 4. Research Brief (the key differentiator)
  sections.push(`# Research Brief

The following research brief was prepared before writing. Use it as your foundation — incorporate the researchers, theories, frameworks, case studies, and outline described here. Expand on everything with full prose.

<research_brief>
${researchBrief}
</research_brief>`);

  // 5. Book Definition
  sections.push(`# Specifications

- **Template:** ${spec.display}
- **Target:** ${spec.words.min.toLocaleString()}–${spec.words.max.toLocaleString()} words
- **Chapters:** ${spec.chapters.min}–${spec.chapters.max}
- Follow the outline from the research brief, expanding each chapter to full depth`);

  // 6. Structure
  let structure = `# Chapter Structure\n\nEach chapter includes:\n`;
  for (const s of spec.sections) {
    structure += `- **${s}**\n`;
  }
  structure += `\nEnd with a Synthesis Chapter (~${spec.synthesis_words} words): how all chapters connect, meta-framework, decision tree.`;
  structure += `\nAppendix: glossary, recommended reading (10+ annotated sources).`;
  sections.push(structure);

  // 7. Quality
  sections.push(`# Quality Checklist
- Is this genuinely ${spec.words.min.toLocaleString()}+ words of substance?
- Would a smart reader learn something from every chapter?
- Are there real citations, named theories, researchers?
- Are there concrete examples, not just abstractions?
- Is it personalized to the reader's context?
- Does it include practical decision procedures?
- Does it challenge assumptions and include contrarian views?
- Does every chapter change how the reader thinks?`);

  // 8. Output
  sections.push(`# Output Format
Write the complete book in Markdown format. Start with the title as an H1 heading.
Use H2 for chapters, H3 for sections within chapters.
USE TOKENS GENEROUSLY. Quality and depth are the #1 priority.
Do not summarize when you can explain in full. Do not abbreviate when you can elaborate.
It is BETTER to write too much than too little.`);

  return sections.join("\n\n---\n\n");
}

/**
 * Legacy single-phase prompt (kept for quick-read template where research phase is overkill).
 */
export function buildWebPrompt(req: GenerateRequest): string {
  return buildWritePrompt(req, "No research brief available. Research thoroughly as you write.");
}
