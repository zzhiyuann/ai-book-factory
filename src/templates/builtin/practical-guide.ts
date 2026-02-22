import type { BookTemplate } from "../types.js";

export const practicalGuideTemplate: BookTemplate = {
  name: "practical-guide",
  display_name: "Practical Guide",
  description:
    "Hands-on 10-15K word guide heavy on exercises, how-to steps, and real-world application. For topics where doing matters more than knowing.",
  target_words: { min: 10000, max: 15000 },
  chapters: { min: 6, max: 10 },
  structure: {
    preface: {
      target_words: 400,
      description:
        "What skill/capability this builds. Prerequisites. What you'll be able to do after reading.",
    },
    chapter_sections: [
      {
        name: "Concept in Brief",
        description: "Just enough theory to understand the why. Keep it tight.",
        target_words: 200,
      },
      {
        name: "Step-by-Step Method",
        description:
          "Detailed how-to with clear steps. Include decision points and alternatives.",
        target_words: 400,
      },
      {
        name: "Worked Example",
        description:
          "Walk through a complete real-world example applying the method. Show your reasoning at each step.",
        target_words: 350,
      },
      {
        name: "Practice Exercise",
        description:
          "A realistic exercise for the reader to try. Include hints and a solution walkthrough.",
        target_words: 250,
      },
      {
        name: "Common Mistakes & Troubleshooting",
        description: "What goes wrong and how to fix it. Debug checklist.",
        target_words: 150,
      },
    ],
    synthesis: {
      target_words: 1000,
      description:
        "Complete workflow from start to finish. Checklist format. When to use which technique.",
    },
    appendix: {
      sections: [
        "Quick reference / cheat sheet",
        "Tools and resources",
        "Practice problem set with solutions",
      ],
      description: "Practical reference material for daily use.",
    },
  },
  quality_checklist: [
    "Is this at least 10,000 words?",
    "Could someone actually DO the thing after reading this?",
    "Are the step-by-step instructions clear and complete?",
    "Is every exercise realistic, not just theoretical?",
    "Are common failure modes covered?",
    "Is there a usable reference/cheat sheet?",
  ],
  writing_instructions: `This is a practical guide — prioritize actionability over theory. For each concept, the reader should immediately see HOW to apply it. Include decision trees, checklists, and step-by-step procedures.

Exercises should be realistic scenarios the reader might actually encounter. Include solutions with detailed reasoning.`,
  research_instructions:
    "Research best practices, common patterns, and real-world case studies (5-8 searches). Focus on practical how-to over academic theory.",
};
