import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface IncubatorResponse {
  analysis: string;
  connections: string[];
  suggestions: string[];
  personalizedInsights?: string[];
}

export async function analyzeIdeas(
  ideas: string[],
  profileContext?: string
): Promise<IncubatorResponse> {
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

Respond in JSON format with:
- analysis: Overall analysis of the ideas
- connections: Array of connections found between ideas
- suggestions: Array of actionable suggestions${profileContext ? "\n- personalizedInsights: Array of insights specific to this user based on their profile (e.g., how ideas relate to their goals, blind spots to watch for)" : ""}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  return JSON.parse(content.text) as IncubatorResponse;
}
