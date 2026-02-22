import type { BookTemplate } from "../types.js";

export const deepDiveTemplate: BookTemplate = {
  name: "deep-dive",
  display_name: "Deep Dive",
  description:
    "Comprehensive 15,000+ word exploration. Full section set with cognitive frameworks, tacit knowledge, case studies, and exercises. Direct port of the original Book Factory system.",
  target_words: { min: 15000, max: 25000 },
  chapters: { min: 8, max: 12 },
  structure: {
    preface: {
      target_words: 500,
      description:
        "Why this topic matters for the reader specifically. What cognitive upgrade this book delivers. How to read this book.",
    },
    chapter_sections: [
      {
        name: "Core Concepts",
        description:
          "Not just definitions — explain the mechanism, the history, the debate. Name the researchers, cite the key papers/books. Explain what changed in the field when this idea emerged.",
        target_words: 400,
      },
      {
        name: "The Cognitive Framework",
        description:
          "What mental model does this give you? How does this change how you think about problems? What decisions does this framework help you make?",
        target_words: 300,
      },
      {
        name: "Application to Your Role",
        description:
          "Concrete scenarios in the reader's work context. How this applies to their specific domain and challenges.",
        target_words: 300,
      },
      {
        name: "What Most People Get Wrong",
        description:
          "Common misconceptions and why they persist. Subtle errors that even experienced people make. How to detect you're making this mistake.",
        target_words: 250,
      },
      {
        name: "Underwater Knowledge",
        description:
          "What's not in textbooks but practitioners know. Organizational/political dimensions. Career implications and strategic positioning.",
        target_words: 250,
      },
      {
        name: "Worked Examples / Case Studies",
        description:
          "At least 2 detailed examples per chapter. Walk through the reasoning step by step.",
        target_words: 300,
      },
      {
        name: "Practice Exercises",
        description:
          "Not toy exercises — real problems the reader might face. Include expected reasoning process, not just answers.",
        target_words: 200,
      },
    ],
    synthesis: {
      target_words: 2000,
      description:
        "How all chapters connect. The meta-cognitive framework this book gives you. Decision tree: given situation X, apply chapter Y.",
    },
    appendix: {
      sections: [
        "Glossary of key terms with precise definitions",
        "Annotated bibliography (20+ sources with 1-sentence commentary each)",
        "1-week action plan with daily specific tasks",
      ],
      description: "Reference material for continued learning and immediate action.",
    },
  },
  quality_checklist: [
    "Is this genuinely book-length (15,000+ words)?",
    "Would a smart reader learn something substantial from every chapter?",
    "Are there real citations, named theories, named researchers?",
    "Are there concrete examples and case studies, not just abstractions?",
    "Is there underwater/tacit knowledge that you can't find in a textbook?",
    "Are there genuine cognitive frameworks, not just information dumps?",
    "Is it personalized to the reader's role and context?",
    "Would the reader never need to revisit this topic for foundational understanding?",
  ],
  writing_instructions: `Write a REAL book. Not an outline. Not a list of bullet points. Not 5 pages of headers with 2 sentences under each.

Each chapter should be 1,500-2,500 words of substantive prose. Chapters should flow like a textbook written by an expert who also happens to be a brilliant strategist.

Include real research findings, named theories, named researchers, specific studies. Include counterarguments and limitations — not just cheerleading. Include decision procedures: "when you face X, do Y because Z."

Be a rigorous research partner, not a cheerleader. Depth over breadth. Cite real work — if unsure, say so. Challenge assumptions. Include contrarian views. Write for cognitive upgrade — every chapter should change how the reader thinks.`,
  research_instructions:
    "Do extensive web research before writing (at least 10-15 searches covering different angles: foundational theory, recent advances, applications, critiques, practitioner perspectives). Use tokens generously — quality and coverage are the #1 priority.",
};
