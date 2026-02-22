export interface UserProfile {
  name: string;
  role: string;
  organization: string;
  interests: {
    primary: string[];
    secondary: string[];
    curiosity: string[];
  };
  goals: {
    style: "deep-expertise" | "broad-exploration" | "practical-skills";
    description: string;
  };
  /** Free-form text block — the killer feature. Injected verbatim into every prompt. */
  open_profile: string;
  preferences: {
    include_exercises: boolean;
    formality: "casual" | "balanced" | "academic";
    depth_philosophy: string;
  };
}

export function defaultProfile(): UserProfile {
  return {
    name: "",
    role: "",
    organization: "",
    interests: {
      primary: [],
      secondary: [],
      curiosity: [],
    },
    goals: {
      style: "deep-expertise",
      description: "",
    },
    open_profile: "",
    preferences: {
      include_exercises: true,
      formality: "balanced",
      depth_philosophy:
        "Prioritize deep understanding and cognitive frameworks over surface-level information.",
    },
  };
}
