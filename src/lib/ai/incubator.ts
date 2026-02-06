import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.warn('ANTHROPIC_API_KEY is not set');
}

const anthropic = new Anthropic({
  apiKey: apiKey || '',
});

export interface IncubatorResponse {
  analysis: string;
  connections: string[];
  suggestions: string[];
  personalizedInsights?: string[];
}

/**
 * Strip markdown code blocks from a string
 */
function stripMarkdownCodeBlocks(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` blocks
  let cleaned = text.trim();

  // Match ```json or ``` at start and ``` at end
  const codeBlockMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  return cleaned;
}

export async function analyzeIdeas(
  ideas: string[],
  profileContext?: string
): Promise<IncubatorResponse> {
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your .env.local file.');
  }

  const profileSection = profileContext
    ? `\n\n<user_profile>
${profileContext}
</user_profile>

Use this profile to personalize your analysis. Reference their expertise, call out potential blind spots, and tailor suggestions to their goals and thinking style.`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `Analyze these ideas and find connections between them. Provide insights and suggestions for development.${profileSection}

Ideas:
${ideas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")}

Return ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "analysis": "Overall analysis of the ideas",
  "connections": ["Connection 1", "Connection 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2"]${profileContext ? ',\n  "personalizedInsights": ["Insight based on user profile"]' : ""}
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  // Strip any markdown code blocks before parsing
  const cleanedText = stripMarkdownCodeBlocks(content.text);

  try {
    return JSON.parse(cleanedText) as IncubatorResponse;
  } catch {
    console.error("Failed to parse incubator response:", content.text);
    throw new Error("Failed to parse AI response as JSON");
  }
}
