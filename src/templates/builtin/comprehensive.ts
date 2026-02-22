import type { BookTemplate } from "../types.js";

export const comprehensiveTemplate: BookTemplate = {
  name: "comprehensive",
  display_name: "Comprehensive",
  description:
    "Well-rounded 8-12K word book. Covers core concepts, frameworks, and practical applications without the full deep-dive section set. Great default for most topics.",
  target_words: { min: 8000, max: 12000 },
  chapters: { min: 6, max: 10 },
  structure: {
    preface: {
      target_words: 400,
      description:
        "Why this topic matters for the reader. What they'll gain from reading. Brief roadmap.",
    },
    chapter_sections: [
      {
        name: "Core Concepts",
        description:
          "The key ideas, mechanisms, and theories. Include named researchers and real findings.",
        target_words: 350,
      },
      {
        name: "Frameworks & Mental Models",
        description:
          "Actionable mental models for thinking about and applying these concepts.",
        target_words: 250,
      },
      {
        name: "Practical Application",
        description:
          "How to apply this in real work. Concrete scenarios and decision procedures.",
        target_words: 300,
      },
      {
        name: "Common Pitfalls",
        description:
          "What people get wrong and how to avoid it. Include subtle mistakes experts make.",
        target_words: 200,
      },
    ],
    synthesis: {
      target_words: 1000,
      description:
        "Connecting themes across chapters. Key takeaways. Next steps for the reader.",
    },
    appendix: {
      sections: [
        "Key terms glossary",
        "Recommended reading (10+ annotated sources)",
      ],
      description: "Quick reference and further learning paths.",
    },
  },
  quality_checklist: [
    "Is this at least 8,000 words of substantive content?",
    "Does every chapter teach something the reader didn't know?",
    "Are there concrete examples, not just theory?",
    "Is it personalized to the reader's context?",
    "Are there named theories, researchers, and real citations?",
    "Does it include practical decision procedures?",
  ],
  writing_instructions: `Write substantive prose, not bullet-point outlines. Each chapter should be 800-1,200 words. Include real examples, named theories, and cited research. Balance depth with accessibility.

Focus on giving the reader usable mental models and decision frameworks. Every chapter should change how they think about at least one thing.`,
  research_instructions:
    "Do web research before writing (at least 5-8 searches covering key angles). Prioritize accuracy and practical relevance.",
};
