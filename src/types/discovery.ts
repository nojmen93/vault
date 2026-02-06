/**
 * Types for Idea Discovery feature
 */

// Question 1: Self-description
export type SelfDescription =
  | "tech_builder"
  | "creative"
  | "people_person"
  | "simplicity"
  | "domain_expert"
  | "not_sure";

// Question 2: Time availability
export type TimeAvailability =
  | "weekends"
  | "daily"
  | "all_in"
  | "passive";

// Question 3: Budget
export type BudgetLevel =
  | "zero"
  | "little"
  | "some"
  | "unlimited";

// Question 4: Priorities (can select up to 2)
export type Priority =
  | "money_fast"
  | "fulfillment"
  | "flexibility"
  | "helping_others"
  | "learning";

// Question answers
export interface DiscoveryAnswers {
  selfDescription?: SelfDescription;
  expertiseField?: string; // If domain_expert selected
  timeAvailability?: TimeAvailability;
  budget?: BudgetLevel;
  priorities?: Priority[];
  skills?: string;
}

// Persona classification (internal)
export type PersonaType =
  | "tech_builder"
  | "creative_maker"
  | "connector"
  | "simplicity_seeker"
  | "domain_expert"
  | "fresh_starter";

// Technical level for ideas
export type TechnicalLevel = "none" | "low" | "medium" | "high";

// Idea category
export type IdeaCategory = "passive" | "service" | "product" | "content" | "technical";

// Generated idea suggestion
export interface IdeaSuggestion {
  id: string;
  name: string;
  description: string;
  timeUpfront: string;
  timeOngoing: string;
  incomeMin: number;
  incomeMax: number;
  whyFitsYou: string;
  skillsNeeded: string;
  startupCost: string;
  technicalLevel: TechnicalLevel;
  category: IdeaCategory;
}

// Discovery session (stored in DB)
export interface DiscoverySession {
  id: string;
  userId: string;
  answers: DiscoveryAnswers;
  persona?: PersonaType;
  suggestions: IdeaSuggestion[];
  createdAt: string;
}

// Saved suggestion status
export type SavedSuggestionStatus = "saved" | "incubated" | "dismissed";

// Saved suggestion (stored in DB)
export interface SavedSuggestion {
  id: string;
  userId: string;
  discoverySessionId?: string;
  suggestion: IdeaSuggestion;
  status: SavedSuggestionStatus;
  noteId?: string; // If converted to note
  createdAt: string;
}

// Question option for UI
export interface QuestionOption<T> {
  value: T;
  label: string;
  icon: string;
  description?: string;
}

// Question configuration
export interface QuestionConfig {
  id: string;
  question: string;
  subtitle?: string;
  type: "single" | "multi" | "text";
  options?: QuestionOption<string>[];
  maxSelections?: number; // For multi-select
  placeholder?: string; // For text input
  skipLabel?: string;
  showIf?: (answers: DiscoveryAnswers) => boolean;
}

// Filter option for results
export type ResultFilter = "all" | "lowest_effort" | "highest_income" | "no_skills";
