export interface ChapterSection {
  name: string;
  description: string;
  target_words: number;
}

export interface BookTemplate {
  name: string;
  display_name: string;
  description: string;
  target_words: { min: number; max: number };
  chapters: { min: number; max: number };
  structure: {
    preface: { target_words: number; description: string };
    chapter_sections: ChapterSection[];
    synthesis: { target_words: number; description: string };
    appendix: { sections: string[]; description: string };
  };
  quality_checklist: string[];
  writing_instructions: string;
  research_instructions: string;
}
