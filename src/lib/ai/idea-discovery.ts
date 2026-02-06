import Anthropic from '@anthropic-ai/sdk';
import type {
  DiscoveryAnswers,
  IdeaSuggestion,
  PersonaType,
} from '@/types/discovery';
import type { ThinkingProfile } from './thinking-profile';
import type { Note } from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Classify user into a persona based on their answers
 */
export function classifyPersona(answers: DiscoveryAnswers): PersonaType {
  const { selfDescription, timeAvailability, priorities } = answers;

  // Tech Builder
  if (
    selfDescription === 'tech_builder' &&
    (timeAvailability === 'all_in' || timeAvailability === 'daily')
  ) {
    return 'tech_builder';
  }

  // Creative Maker
  if (selfDescription === 'creative') {
    return 'creative_maker';
  }

  // Connector / People Person
  if (selfDescription === 'people_person') {
    return 'connector';
  }

  // Domain Expert
  if (selfDescription === 'domain_expert') {
    return 'domain_expert';
  }

  // Simplicity Seeker
  if (
    selfDescription === 'simplicity' ||
    (timeAvailability === 'weekends' || timeAvailability === 'passive')
  ) {
    return 'simplicity_seeker';
  }

  // Fresh Starter (default)
  return 'fresh_starter';
}

/**
 * Build the prompt for Claude based on user answers
 */
function buildPrompt(
  answers: DiscoveryAnswers,
  persona: PersonaType,
  thinkingProfile?: ThinkingProfile | null,
  relevantNotes?: Note[],
  customRequest?: string
): string {
  const answerDescriptions: Record<string, string> = {
    // Self-description
    tech_builder: 'loves technology and building things',
    creative: 'is creative and likes making things look good',
    people_person: 'is good with people and communication',
    simplicity: 'wants something simple that works',
    domain_expert: 'has expertise in a specific field',
    not_sure: 'is not sure yet and open to exploring',
    // Time
    weekends: 'can invest a few hours on weekends',
    daily: 'can invest an hour or two daily',
    all_in: 'is going all in on this',
    passive: 'wants to set it up once and mostly forget it',
    // Budget
    zero: 'has zero budget - just their time',
    little: 'has a small budget ($50-200)',
    some: 'has some savings to invest ($500-2000)',
    unlimited: 'money is not an issue',
    // Priorities
    money_fast: 'making money quickly',
    fulfillment: 'building something they\'re proud of',
    flexibility: 'flexibility and freedom',
    helping_others: 'helping others',
    learning: 'learning new things',
  };

  const selfDesc = answers.selfDescription
    ? answerDescriptions[answers.selfDescription]
    : 'did not specify their background';

  const timeDesc = answers.timeAvailability
    ? answerDescriptions[answers.timeAvailability]
    : 'did not specify time availability';

  const budgetDesc = answers.budget
    ? answerDescriptions[answers.budget]
    : 'did not specify budget';

  const prioritiesDesc = answers.priorities?.length
    ? answers.priorities.map((p) => answerDescriptions[p]).join(' and ')
    : 'did not specify priorities';

  const skillsDesc = answers.skills || 'did not mention specific skills';

  const expertiseDesc = answers.expertiseField
    ? `Their expertise is in: ${answers.expertiseField}`
    : '';

  const notesContext = relevantNotes?.length
    ? `\n\nTheir existing ideas/interests:\n${relevantNotes
        .map((n) => `- ${n.title}: ${n.content.slice(0, 200)}`)
        .join('\n')}`
    : '';

  const profileContext = thinkingProfile
    ? `\n\nTheir thinking profile shows they are ${thinkingProfile.thinkingStyle} and value ${thinkingProfile.values?.join(', ') || 'not specified'}.`
    : '';

  const customContext = customRequest
    ? `\n\nThey specifically requested: "${customRequest}"`
    : '';

  return `Generate 7 personalized income/project ideas for this user.

USER PROFILE:
- Self-description: ${selfDesc}
- Time available: ${timeDesc}
- Budget: ${budgetDesc}
- Priorities: ${prioritiesDesc}
- Skills/background: ${skillsDesc}
${expertiseDesc}
${notesContext}
${profileContext}
${customContext}

CLASSIFIED PERSONA: ${persona}

STRICT RULES:

1. Match their technical comfort level EXACTLY:
   - If they said 'something simple' or didn't mention tech → NO coding projects, NO SaaS, NO APIs, NO technical ideas
   - Only suggest technical ideas if they explicitly said they love technology/building

2. Match their time budget:
   - 'A few hours on weekends' → max 5 hrs/week ongoing
   - 'Set it up once' → must be truly passive after setup

3. Match their money budget:
   - 'Zero' → only free-to-start ideas
   - Include startup cost for each idea

4. Match their priorities:
   - 'Making money quickly' → proven, fast-to-start ideas
   - 'Helping others' → service/teaching oriented
   - 'Flexibility' → location-independent, async

5. Use PLAIN LANGUAGE:
   - No jargon
   - Explain like they've never heard of this before
   - If idea needs explanation, include it

6. Be REALISTIC:
   - Income ranges should be honest (not hype)
   - Time estimates should be accurate
   - Don't overpromise

7. Make it PERSONAL:
   - Reference their skills if mentioned
   - Reference their field if mentioned
   - 'Why this fits you' must be specific to their answers

Return ONLY valid JSON array (no markdown, no code blocks):
[
  {
    "id": "unique-id-1",
    "name": "Idea Name",
    "description": "2-3 sentences explaining what this is and how it makes money",
    "timeUpfront": "X hours/days",
    "timeOngoing": "X hours/week",
    "incomeMin": 500,
    "incomeMax": 2000,
    "whyFitsYou": "Specific reason based on their answers",
    "skillsNeeded": "Plain language or None - anyone can start",
    "startupCost": "Free / $X-Y",
    "technicalLevel": "none",
    "category": "passive"
  }
]

technicalLevel must be one of: "none", "low", "medium", "high"
category must be one of: "passive", "service", "product", "content", "technical"

Generate exactly 7 diverse ideas that match this user's profile.`;
}

/**
 * Generate personalized idea suggestions using Claude
 */
export async function generateIdeaSuggestions(
  answers: DiscoveryAnswers,
  thinkingProfile?: ThinkingProfile | null,
  relevantNotes?: Note[],
  customRequest?: string
): Promise<IdeaSuggestion[]> {
  const persona = classifyPersona(answers);
  const prompt = buildPrompt(
    answers,
    persona,
    thinkingProfile,
    relevantNotes,
    customRequest
  );

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse the JSON response
    const suggestions = JSON.parse(content.text) as IdeaSuggestion[];

    // Ensure all suggestions have unique IDs
    return suggestions.map((s, i) => ({
      ...s,
      id: s.id || `suggestion-${Date.now()}-${i}`,
    }));
  } catch (error) {
    console.error('Failed to generate idea suggestions:', error);
    throw error;
  }
}

/**
 * Detect if a note content suggests the user is exploring ideas
 */
export function detectIdeaExploration(content: string): boolean {
  const triggers = [
    'passive income',
    'side project',
    'side hustle',
    'want to build',
    'what to build',
    'need ideas',
    'brainstorm',
    'not sure what',
    'looking for ideas',
    'extra money',
    'make money',
    'retirement project',
    'from home',
    'business idea',
    'startup idea',
    'help me find',
    'bored and want',
    'want to create',
  ];

  const lowerContent = content.toLowerCase();
  return triggers.some((trigger) => lowerContent.includes(trigger));
}

/**
 * Get more suggestions (different from existing ones)
 */
export async function getMoreSuggestions(
  answers: DiscoveryAnswers,
  existingSuggestions: IdeaSuggestion[],
  thinkingProfile?: ThinkingProfile | null,
  relevantNotes?: Note[]
): Promise<IdeaSuggestion[]> {
  const existingNames = existingSuggestions.map((s) => s.name.toLowerCase());

  // Add context about what to avoid
  const customRequest = `Generate 5 NEW ideas different from: ${existingNames.join(', ')}. Do not repeat any of these concepts.`;

  const suggestions = await generateIdeaSuggestions(
    answers,
    thinkingProfile,
    relevantNotes,
    customRequest
  );

  // Filter out any that somehow match existing names
  return suggestions.filter(
    (s) => !existingNames.includes(s.name.toLowerCase())
  );
}
