import type { BookTemplate } from "../types.js";

export const quickReadTemplate: BookTemplate = {
  name: "quick-read",
  display_name: "Quick Read",
  description:
    "Focused 3-5K word overview. Gets to the point fast with key concepts and actionable takeaways. Great for surveying new topics.",
  target_words: { min: 3000, max: 5000 },
  chapters: { min: 4, max: 6 },
  structure: {
    preface: {
      target_words: 200,
      description: "Why this matters. What you'll learn in 15 minutes.",
    },
    chapter_sections: [
      {
        name: "Key Ideas",
        description: "The essential concepts explained clearly and concisely.",
        target_words: 300,
      },
      {
        name: "So What?",
        description: "Why this matters in practice. How to use it.",
        target_words: 200,
      },
    ],
    synthesis: {
      target_words: 500,
      description: "The 5 things to remember. Immediate actions to take.",
    },
    appendix: {
      sections: ["Further reading (5 recommended sources)"],
      description: "Where to go deeper.",
    },
  },
  quality_checklist: [
    "Is this at least 3,000 words?",
    "Can someone learn the essentials of this topic from this book?",
    "Is every paragraph earning its place?",
    "Are there actionable takeaways?",
  ],
  writing_instructions: `Be concise but not shallow. Every sentence should earn its place. Focus on the 20% of the topic that gives 80% of the value. Include examples but keep them tight.`,
  research_instructions:
    "Do targeted research (3-5 searches) to ensure accuracy on key claims.",
};
