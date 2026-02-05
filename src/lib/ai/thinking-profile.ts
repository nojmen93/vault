import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ThinkingStyle = "analytical" | "intuitive" | "systematic" | "creative";
export type DecisionPattern = "fast_mover" | "deliberate" | "data_driven";
export type CommunicationStyle = "direct_and_concise" | "detailed" | "casual";
export type FeedbackPreference = "blunt" | "encouraging" | "balanced";

export interface ThinkingProfile {
  userId: string;

  // What they know
  domains: string[];
  skills: string[];
  experiences: string[];

  // How they think
  thinkingStyle: ThinkingStyle;
  decisionPattern: DecisionPattern;
  blindSpots: string[];
  strengths: string[];

  // What they care about
  recurringThemes: string[];
  values: string[];
  goals: string[];

  // Their style
  communicationStyle: CommunicationStyle;
  preferredFeedback: FeedbackPreference;

  // Meta
  lastUpdated: string;
  noteCount: number;
}

const PROFILE_ANALYSIS_PROMPT = `Analyze these notes from a single user. Your goal is to build a comprehensive thinking profile that will help personalize AI responses for them.

<notes>
{NOTES}
</notes>

Analyze carefully and extract:

1. **Domains & Expertise**: What topics/industries do they think about? (e.g., "fintech", "AI", "B2B SaaS")
2. **Skills**: What capabilities do they mention or demonstrate? (e.g., "Python", "product strategy", "UX design")
3. **Experiences**: Key life/work experiences mentioned (e.g., "failed startup", "YC alum", "10 years in banking")
4. **Thinking Style**: Are they more analytical (data/logic), intuitive (gut/patterns), systematic (process/frameworks), or creative (novel/unconventional)?
5. **Decision Pattern**: Do they seem like a fast_mover (bias to action), deliberate (careful consideration), or data_driven (needs evidence)?
6. **Strengths**: What do they do well based on their notes? Be specific.
7. **Blind Spots**: What do they seem to overlook or underestimate? Look for patterns in what they DON'T mention.
8. **Recurring Themes**: What topics come up repeatedly across different notes?
9. **Values**: What principles seem important to them? (e.g., "speed over perfection", "user privacy")
10. **Goals**: What are they trying to achieve? Short and long term.
11. **Communication Style**: Are their notes direct_and_concise, detailed, or casual?
12. **Feedback Preference**: Based on how they write, would they prefer blunt, encouraging, or balanced feedback?

Respond in this exact JSON format:
{
  "domains": ["domain1", "domain2"],
  "skills": ["skill1", "skill2"],
  "experiences": ["experience1", "experience2"],
  "thinkingStyle": "analytical|intuitive|systematic|creative",
  "decisionPattern": "fast_mover|deliberate|data_driven",
  "blindSpots": ["blindspot1", "blindspot2"],
  "strengths": ["strength1", "strength2"],
  "recurringThemes": ["theme1", "theme2"],
  "values": ["value1", "value2"],
  "goals": ["goal1", "goal2"],
  "communicationStyle": "direct_and_concise|detailed|casual",
  "preferredFeedback": "blunt|encouraging|balanced"
}

Be specific and evidence-based. Only include what you can infer from the notes. If you can't determine something, use reasonable defaults.`;

export async function generateThinkingProfile(
  userId: string,
  notes: { title: string | null; content: string; createdAt: string }[]
): Promise<ThinkingProfile> {
  if (notes.length === 0) {
    return getDefaultProfile(userId);
  }

  // Prepare notes for analysis (limit to prevent token overflow)
  const notesText = notes
    .slice(0, 50) // Max 50 notes
    .map((n, i) => {
      const title = n.title ? `Title: ${n.title}\n` : "";
      const content = n.content.substring(0, 500); // Truncate long notes
      return `--- Note ${i + 1} (${new Date(n.createdAt).toLocaleDateString()}) ---\n${title}${content}`;
    })
    .join("\n\n");

  const prompt = PROFILE_ANALYSIS_PROMPT.replace("{NOTES}", notesText);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse profile JSON");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      userId,
      domains: parsed.domains || [],
      skills: parsed.skills || [],
      experiences: parsed.experiences || [],
      thinkingStyle: validateThinkingStyle(parsed.thinkingStyle),
      decisionPattern: validateDecisionPattern(parsed.decisionPattern),
      blindSpots: parsed.blindSpots || [],
      strengths: parsed.strengths || [],
      recurringThemes: parsed.recurringThemes || [],
      values: parsed.values || [],
      goals: parsed.goals || [],
      communicationStyle: validateCommunicationStyle(parsed.communicationStyle),
      preferredFeedback: validateFeedbackPreference(parsed.preferredFeedback),
      lastUpdated: new Date().toISOString(),
      noteCount: notes.length,
    };
  } catch (error) {
    console.error("Failed to generate thinking profile:", error);
    return getDefaultProfile(userId);
  }
}

function getDefaultProfile(userId: string): ThinkingProfile {
  return {
    userId,
    domains: [],
    skills: [],
    experiences: [],
    thinkingStyle: "analytical",
    decisionPattern: "deliberate",
    blindSpots: [],
    strengths: [],
    recurringThemes: [],
    values: [],
    goals: [],
    communicationStyle: "direct_and_concise",
    preferredFeedback: "balanced",
    lastUpdated: new Date().toISOString(),
    noteCount: 0,
  };
}

function validateThinkingStyle(value: string): ThinkingStyle {
  const valid: ThinkingStyle[] = ["analytical", "intuitive", "systematic", "creative"];
  return valid.includes(value as ThinkingStyle) ? (value as ThinkingStyle) : "analytical";
}

function validateDecisionPattern(value: string): DecisionPattern {
  const valid: DecisionPattern[] = ["fast_mover", "deliberate", "data_driven"];
  return valid.includes(value as DecisionPattern) ? (value as DecisionPattern) : "deliberate";
}

function validateCommunicationStyle(value: string): CommunicationStyle {
  const valid: CommunicationStyle[] = ["direct_and_concise", "detailed", "casual"];
  return valid.includes(value as CommunicationStyle) ? (value as CommunicationStyle) : "direct_and_concise";
}

function validateFeedbackPreference(value: string): FeedbackPreference {
  const valid: FeedbackPreference[] = ["blunt", "encouraging", "balanced"];
  return valid.includes(value as FeedbackPreference) ? (value as FeedbackPreference) : "balanced";
}

// Generate a context prompt for AI calls based on the profile
export function generateProfileContext(profile: ThinkingProfile): string {
  if (profile.noteCount === 0) {
    return "Note: This user is new. No thinking profile available yet.";
  }

  const sections: string[] = [];

  // Background
  if (profile.domains.length > 0 || profile.skills.length > 0) {
    sections.push(`THEIR BACKGROUND:
- Expert in: ${profile.domains.join(", ") || "Not yet determined"}
- Skills: ${profile.skills.join(", ") || "Not yet determined"}
- Past experiences: ${profile.experiences.join(", ") || "Not mentioned"}`);
  }

  // How they think
  sections.push(`HOW THEY THINK:
- Style: ${formatEnumValue(profile.thinkingStyle)} (${profile.decisionPattern.replace("_", " ")})
- Strengths: ${profile.strengths.join(", ") || "Not yet identified"}
- Watch for blind spots: ${profile.blindSpots.join(", ") || "None identified yet"}`);

  // What they care about
  if (profile.recurringThemes.length > 0 || profile.goals.length > 0) {
    sections.push(`WHAT THEY CARE ABOUT:
- Recurring interests: ${profile.recurringThemes.join(", ") || "Various"}
- Values: ${profile.values.join(", ") || "Not specified"}
- Goals: ${profile.goals.join(", ") || "Not explicitly stated"}`);
  }

  // Preferences
  sections.push(`THEIR PREFERENCES:
- Communication style: ${formatEnumValue(profile.communicationStyle)}
- They prefer feedback that is: ${profile.preferredFeedback}`);

  return sections.join("\n\n");
}

function formatEnumValue(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Check if profile needs regeneration
export function shouldRegenerateProfile(
  profile: ThinkingProfile | null,
  currentNoteCount: number
): boolean {
  if (!profile) return true;

  // Regenerate if note count increased by 20% or more
  const threshold = profile.noteCount * 1.2;
  if (currentNoteCount >= threshold) return true;

  // Regenerate if older than 7 days
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  if (new Date(profile.lastUpdated).getTime() < weekAgo) return true;

  return false;
}
