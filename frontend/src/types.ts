export type GradeLevel =
  | "rising freshman"
  | "rising sophomore"
  | "rising junior"
  | "rising senior";

export type Format =
  | "residential"
  | "virtual"
  | "hybrid"
  | "commuter"
  | "no preference";

export type CostPreference =
  | "free_or_aid_only"
  | "prefer_low_cost"
  | "open_to_tuition"
  | "no_preference";

export type GoalTag =
  | "explore_major"
  | "strengthen_application"
  | "research_experience"
  | "earn_credit"
  | "campus_experience";

export interface StudentProfile {
  name: string;
  grade_level: GradeLevel;
  interests: string[];
  gpa?: number | null;
  location_flexibility: Format;
  cost_preference: CostPreference;
  goal_tags: GoalTag[];
  budget_note?: string | null;
  goals?: string | null;
  prior_experience?: string | null;
}

export interface StoredStudent extends StudentProfile {
  id: string;
}

export interface Program {
  slug: string;
  name: string;
  host: string;
  subjects: string[];
  format: string;
  grade_levels: string[];
  duration_weeks: number;
  cost_model: string;
  selectivity: string;
  application_window: string | null;
  eligibility_note: string | null;
  url: string | null;
  description: string;
}

export interface ProgramMatch {
  slug: string;
  fit_score: number;
  why_it_fits: string;
  considerations?: string | null;
}

export interface MatchResponse {
  matches: ProgramMatch[];
  summary: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface SavedEntry {
  program_slug: string;
  note: string | null;
  created_at: string;
  programs: Program;
}
