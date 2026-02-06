import Anthropic from '@anthropic-ai/sdk';
import type {
  DiscoveryAnswers,
  IdeaSuggestion,
  PersonaType,
} from '@/types/discovery';
import type { Note } from '@/types';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY is not set');
}

const anthropic = new Anthropic({
  apiKey: apiKey || '',
});

/**
 * Strip markdown code blocks from a string
 */
function stripMarkdownCodeBlocks(text: string): string {
  let cleaned = text.trim();

  // Match ```json or ``` at start and ``` at end
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  return cleaned;
}

/**
 * Classify user into a persona based on their answers
 */
export function classifyPersona(answers: DiscoveryAnswers): PersonaType {
  const { selfDescription, timeAvailability } = answers;

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
 * Get region-specific context for the AI prompt
 */
function getRegionContext(region?: string): string {
  switch (region) {
    case 'europe':
      return `
USER IS BASED IN EUROPE:
- Suggest EU-friendly platforms: Stripe, Lemonsqueezy, Ko-fi, Gumroad, Paddle
- Consider VAT/MOSS implications for digital products
- Reference European marketplaces where relevant
- GDPR-compliant solutions are a selling point
- B2B opportunities: European SMBs are often underserved
- Use EUR (€) for all pricing`;

    case 'scandinavia':
      return `
USER IS BASED IN SCANDINAVIA (Sweden/Norway/Denmark/Finland):
- Strong emphasis on EU-friendly platforms: Stripe, Lemonsqueezy, Ko-fi, Gumroad
- Mention regional marketplaces: Tradera (Sweden), Finn.no (Norway), DBA (Denmark)
- Content in Swedish/Norwegian/Danish has MUCH less competition than English
- Mention Nordic funding/grants if relevant: Innovasjon Norge, Vinnova, Business Finland
- B2B focus: Nordic companies pay well but expect quality
- Consider the high-trust society: reputation matters, quality over quantity
- Use EUR (€) or local currencies (SEK, NOK, DKK) for pricing`;

    case 'us':
      return `
USER IS BASED IN THE UNITED STATES:
- Suggest US-specific platforms and marketplaces
- Consider US tax implications
- Reference American market sizes and opportunities
- Use USD ($) for all pricing`;

    case 'uk':
      return `
USER IS BASED IN THE UNITED KINGDOM:
- Mix of EU and US platform options
- Consider post-Brexit implications for EU sales
- Reference UK-specific marketplaces and opportunities
- Use GBP (£) for pricing`;

    default:
      return `
USER LOCATION NOT SPECIFIED:
- Suggest globally accessible options
- Mention both US and EU platforms where relevant
- Default to USD ($) for pricing but mention global accessibility`;
  }
}

/**
 * Build the prompt for Claude based on user answers
 */
function buildPrompt(
  answers: DiscoveryAnswers,
  persona: PersonaType,
  profileContext?: string | null,
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
    little: 'has a small budget (€50-200)',
    some: 'has some savings to invest (€500-2000)',
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

  const regionContext = getRegionContext(answers.region);

  const notesContext = relevantNotes?.length
    ? `\n\nTheir existing ideas/interests:\n${relevantNotes
        .map((n) => `- ${n.title}: ${n.content.slice(0, 200)}`)
        .join('\n')}`
    : '';

  const thinkingProfileSection = profileContext
    ? `\n\n<user_thinking_profile>\n${profileContext}\n</user_thinking_profile>\n\nUse this thinking profile to personalize suggestions. Reference their strengths, challenge their blind spots, and tailor ideas to their communication and feedback preferences.`
    : '';

  const customContext = customRequest
    ? `\n\nThey specifically requested: "${customRequest}"`
    : '';

  return `Generate 7 highly specific, actionable income ideas for this user.

USER PROFILE:
- Self-description: ${selfDesc}
- Time available: ${timeDesc}
- Budget: ${budgetDesc}
- Priorities: ${prioritiesDesc}
- Skills/background: ${skillsDesc}
${expertiseDesc}
${regionContext}
${notesContext}
${thinkingProfileSection}
${customContext}

CLASSIFIED PERSONA: ${persona}

═══════════════════════════════════════════════════════════════
QUALITY RULES - FOLLOW THESE EXACTLY:
═══════════════════════════════════════════════════════════════

1. BE HYPER-SPECIFIC, NOT GENERIC:
   ❌ BAD: "Start a newsletter"
   ✅ GOOD: "Weekly curated AI tools newsletter for non-technical marketing managers — monetize via sponsored tool features at €200-500/placement after 2,000 subscribers"

   ❌ BAD: "Sell digital templates"
   ✅ GOOD: "Notion dashboard templates for freelance consultants tracking clients, invoices, and projects — sell on Gumroad and Lemonsqueezy at €29-49, target 20 sales/month"

2. MAKE IT ACTIONABLE:
   - Name SPECIFIC platforms (not just "online")
   - Name SPECIFIC niches (not just "people")
   - Include first 3 steps to start
   - Mention specific tools needed

3. REALISTIC INCOME ESTIMATES:
   - Based on actual market rates, not hype
   - Provide range: conservative to optimistic
   - Include timeline: "Month 1-3: €0-200, Month 6+: €500-1500"
   - Be honest about ramp-up time

4. MATCH THEIR EXACT SITUATION:
   "Few hours on weekends" + "Zero budget" + "Simple":
   → Ideas must be startable THIS weekend with €0
   → No "build an app" or "create a course" (too much upfront work)
   → Focus: micro-services, quick digital products, local gigs

   "Going all in" + "Has budget" + "Technical":
   → Can suggest SaaS, more complex builds
   → Can suggest paid tools, ads budget
   → Longer timelines acceptable

5. UNIQUE & NON-OBVIOUS:
   AVOID these overused suggestions:
   - Generic dropshipping
   - "Start a podcast"
   - "Become an influencer"
   - "Amazon FBA" (oversaturated)
   - Vague "consulting"

   Instead find angles:
   - Niche intersections (their skills + underserved market)
   - Regional gaps (what works in US but doesn't exist in their region)
   - Emerging platforms (less competition)
   - B2B over B2C (higher value, less competition)

6. TECHNICAL LEVEL MUST MATCH:
   - If they said "something simple" → NO coding, NO SaaS, NO APIs
   - Only suggest technical ideas if they explicitly love technology

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT - RETURN ONLY VALID JSON:
═══════════════════════════════════════════════════════════════

Return ONLY a valid JSON array (no markdown, no code blocks, no explanation):

[
  {
    "id": "unique-id-1",
    "name": "Specific, Descriptive Name",
    "oneLiner": "One sentence pitch of what this is",
    "description": "3-4 sentences: what it is, who pays, why it works, what makes it unique",
    "whyFitsYou": "Specific reference to their answers — not generic",
    "region": "global",
    "platforms": ["Specific platform 1", "Platform 2"],
    "tools": ["Tool 1", "Tool 2"],
    "firstSteps": [
      "Today: [specific action they can do right now]",
      "Week 1: [specific action for first week]",
      "Month 1: [specific action for first month]"
    ],
    "timeUpfront": "X hours/days with specifics",
    "timeOngoing": "X hours/week with what they actually do",
    "incomeMin": 500,
    "incomeMax": 2000,
    "incomeTimeline": {
      "month1to3": "€0-200",
      "month6": "€500-1500",
      "month12": "€1000-3000"
    },
    "incomeModel": "How exactly money comes in (per sale, retainer, subscription, etc.)",
    "competition": "low",
    "skillsNeeded": "Specific skills or 'None — anyone can start'",
    "startupCost": "€0 / €50-100 for X / €500+ for Y",
    "technicalLevel": "none",
    "category": "product",
    "risks": ["Risk 1", "Risk 2"],
    "edgeForYou": "What specific advantage they have based on their profile"
  }
]

FIELD CONSTRAINTS:
- technicalLevel: "none" | "low" | "medium" | "high"
- category: "passive" | "service" | "product" | "content" | "technical"
- competition: "low" | "medium" | "high"
- region: "global" | "europe" | "scandinavia" | "us" | "uk"

Generate exactly 7 diverse, high-quality ideas that match this user's profile.`;
}

/**
 * Generate personalized idea suggestions using Claude
 */
export async function generateIdeaSuggestions(
  answers: DiscoveryAnswers,
  profileContext?: string | null,
  relevantNotes?: Note[],
  customRequest?: string
): Promise<IdeaSuggestion[]> {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your .env.local file.');
  }

  const persona = classifyPersona(answers);
  const prompt = buildPrompt(
    answers,
    persona,
    profileContext,
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

    // Strip any markdown code blocks and parse the JSON response
    const cleanedText = stripMarkdownCodeBlocks(content.text);

    let suggestions: IdeaSuggestion[];
    try {
      suggestions = JSON.parse(cleanedText) as IdeaSuggestion[];
    } catch {
      console.error('Failed to parse idea suggestions:', content.text);
      throw new Error('Failed to parse AI response as JSON');
    }

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
  profileContext?: string | null,
  relevantNotes?: Note[]
): Promise<IdeaSuggestion[]> {
  const existingNames = existingSuggestions.map((s) => s.name.toLowerCase());

  // Add context about what to avoid
  const customRequest = `Generate 5 NEW ideas different from: ${existingNames.join(', ')}. Do not repeat any of these concepts.`;

  const suggestions = await generateIdeaSuggestions(
    answers,
    profileContext,
    relevantNotes,
    customRequest
  );

  // Filter out any that somehow match existing names
  return suggestions.filter(
    (s) => !existingNames.includes(s.name.toLowerCase())
  );
}
