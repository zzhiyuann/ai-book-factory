import type { UserProfile } from "../profile/schema.js";
import type { AppConfig } from "../profile/config-schema.js";
import type { BookTemplate } from "../templates/types.js";

export interface PromptContext {
  profile: UserProfile;
  config: AppConfig;
  template: BookTemplate;
  topic: string;
  topicContext?: string;
  outputPath: string;
  conversionCommand?: string;
  deliveryCommand?: string;
}

/**
 * Assembles the full generation prompt from 8 components.
 * This is the core magic — ported from the original CLAUDE_CODE_BRIEF.md system.
 */
export function buildPrompt(ctx: PromptContext): string {
  const sections = [
    buildSystemIdentity(ctx),
    buildUserProfile(ctx),
    buildLanguagePolicy(ctx),
    buildBookDefinition(ctx),
    buildContentStructure(ctx),
    buildTopicAndContext(ctx),
    buildQualityChecklist(ctx),
    buildOperationalInstructions(ctx),
  ];

  return sections.filter(Boolean).join("\n\n---\n\n");
}

// Component 1: System Identity
function buildSystemIdentity(ctx: PromptContext): string {
  return `# System Identity — Book Generation Mode

You are generating a comprehensive, personalized book. Follow these instructions precisely.

**CRITICAL — What "Book" Means:**
A book is NOT an outline. A book is NOT a list of bullet points. A book is NOT 5 pages of headers with 2 sentences under each.

A real book means:
- ${ctx.template.target_words.min.toLocaleString()}–${ctx.template.target_words.max.toLocaleString()} words of substantive, well-researched prose
- ${ctx.template.chapters.min}–${ctx.template.chapters.max} substantive chapters, each with real depth
- Narrative exposition, concrete examples, case studies, frameworks
- Chapters flow like a textbook written by an expert who is also a brilliant strategist
- Real research findings, named theories, named researchers, specific studies
- Counterarguments and limitations — not just cheerleading
- Decision procedures: "when you face X, do Y because Z"`;
}

// Component 2: User Profile
function buildUserProfile(ctx: PromptContext): string {
  const { profile } = ctx;
  let section = `# Who This Book Is For\n\n`;

  if (profile.name) section += `- **Name:** ${profile.name}\n`;
  if (profile.role) section += `- **Role:** ${profile.role}\n`;
  if (profile.organization) section += `- **Organization:** ${profile.organization}\n`;

  if (profile.interests.primary.length > 0) {
    section += `- **Primary Interests:** ${profile.interests.primary.join(", ")}\n`;
  }
  if (profile.interests.secondary.length > 0) {
    section += `- **Secondary Interests:** ${profile.interests.secondary.join(", ")}\n`;
  }
  if (profile.interests.curiosity.length > 0) {
    section += `- **Curiosity Areas:** ${profile.interests.curiosity.join(", ")}\n`;
  }

  if (profile.goals.style) {
    const styleDesc: Record<string, string> = {
      "deep-expertise":
        "Deep expertise — wants thorough, expert-level understanding of topics",
      "broad-exploration":
        "Broad exploration — wants to survey many topics and find connections",
      "practical-skills":
        "Practical skills — wants actionable, immediately applicable knowledge",
    };
    section += `- **Learning Style:** ${styleDesc[profile.goals.style] || profile.goals.style}\n`;
  }
  if (profile.goals.description) {
    section += `- **Goals:** ${profile.goals.description}\n`;
  }

  // The killer feature: open_profile injected verbatim
  if (profile.open_profile) {
    section += `\n### About the Reader (in their own words)\n\n${profile.open_profile}\n`;
  }

  section += `\nThis book must be **highly personalized** to this reader. It is not a generic textbook — it is a private knowledge upgrade tailored to their exact situation, role, and challenges.`;

  return section;
}

// Component 3: Language Policy
function buildLanguagePolicy(ctx: PromptContext): string {
  const lang = ctx.config.generation.language;

  const policies: Record<string, string> = {
    zh: `# Language Policy
- **主体语言：中文**。整本书用中文撰写。
- **重要术语/概念用英文附注**，格式示例：构念效度（construct validity）、因果推断（causal inference）
- 关键理论名称、人名、论文标题保留英文原文
- 章节标题可以中英双语`,
    en: `# Language Policy
- Write entirely in English.
- Use standard academic/professional English.
- Include original-language terms for concepts where translation loses nuance.`,
    es: `# Language Policy
- Escribe completamente en español.
- Los términos técnicos clave pueden incluir el original en inglés entre paréntesis.`,
  };

  return (
    policies[lang] ||
    `# Language Policy\n- Write in ${lang}. Include English terms in parentheses for key technical concepts.`
  );
}

// Component 4: Book Definition
function buildBookDefinition(ctx: PromptContext): string {
  const { template } = ctx;
  return `# Book Specifications

- **Template:** ${template.display_name}
- **Target Length:** ${template.target_words.min.toLocaleString()}–${template.target_words.max.toLocaleString()} words
- **Chapters:** ${template.chapters.min}–${template.chapters.max}
- **Before writing:** Output an outline with estimated word counts per chapter, then execute the plan

${template.writing_instructions}`;
}

// Component 5: Content Structure
function buildContentStructure(ctx: PromptContext): string {
  const { template, profile } = ctx;
  const { structure } = template;

  let section = `# Content Structure\n\n`;
  section += "```\n";

  // Title block
  section += `# [Book Title]\n`;
  section += `**Date:** [generation date]\n`;
  if (profile.name) {
    section += `**For:** ${profile.name}`;
    if (profile.role) section += `, ${profile.role}`;
    if (profile.organization) section += ` @ ${profile.organization}`;
    section += "\n";
  }
  section += "\n";

  // Preface
  section += `## Preface (~${structure.preface.target_words} words)\n`;
  section += `${structure.preface.description}\n\n`;

  // Chapters
  const chapterWords = structure.chapter_sections.reduce((sum, s) => sum + s.target_words, 0);
  section += `## Chapters 1–N (~${chapterWords} words each)\n`;
  section += `Each chapter includes:\n`;
  for (const s of structure.chapter_sections) {
    section += `\n### ${s.name} (~${s.target_words} words)\n`;
    section += `${s.description}\n`;
  }

  // Synthesis
  section += `\n## Synthesis Chapter (~${structure.synthesis.target_words} words)\n`;
  section += `${structure.synthesis.description}\n\n`;

  // Appendix
  section += `## Appendix\n`;
  for (const s of structure.appendix.sections) {
    section += `- ${s}\n`;
  }

  section += "```";

  // Preferences
  const { preferences } = profile;
  if (preferences) {
    section += "\n\n### Reader Preferences\n";
    section += `- **Exercises:** ${preferences.include_exercises ? "Include practice exercises" : "Skip exercises"}\n`;
    section += `- **Formality:** ${preferences.formality}\n`;
    if (preferences.depth_philosophy) {
      section += `- **Depth Philosophy:** ${preferences.depth_philosophy}\n`;
    }
  }

  return section;
}

// Component 6: Topic + Context
function buildTopicAndContext(ctx: PromptContext): string {
  let section = `# Topic\n\n**Generate a book on:** ${ctx.topic}\n`;

  if (ctx.topicContext) {
    section += `\n### Context from Previous Books\n${ctx.topicContext}\n`;
  }

  return section;
}

// Component 7: Quality Checklist
function buildQualityChecklist(ctx: PromptContext): string {
  const { template, profile } = ctx;
  let section = `# Quality Checklist (self-audit before saving)\n\n`;

  for (const item of template.quality_checklist) {
    section += `- [ ] ${item}\n`;
  }

  return section;
}

// Component 8: Operational Instructions
function buildOperationalInstructions(ctx: PromptContext): string {
  const { template, config } = ctx;

  let section = `# Operational Instructions\n\n`;

  // Research
  section += `## Research Phase\n${template.research_instructions}\n\n`;

  // Output
  section += `## Output\n`;
  section += `1. Write the book to: \`${ctx.outputPath}\`\n`;

  if (ctx.conversionCommand) {
    section += `2. Convert formats by running: \`${ctx.conversionCommand}\`\n`;
  }

  if (ctx.deliveryCommand) {
    section += `3. Deliver by running: \`${ctx.deliveryCommand}\`\n`;
  }

  // Token policy
  section += `\n## Token Usage Policy
USE TOKENS GENEROUSLY. Generate comprehensive, detailed content. Do not summarize when you can explain in full. Do not abbreviate when you can elaborate. Quality and coverage are the #1 priority. It is BETTER to write too much than too little.`;

  return section;
}
