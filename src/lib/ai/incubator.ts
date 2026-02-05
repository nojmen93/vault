import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface IncubatorResponse {
  analysis: string;
  connections: string[];
  suggestions: string[];
}

export async function analyzeIdeas(
  ideas: string[]
): Promise<IncubatorResponse> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Analyze these ideas and find connections between them. Provide insights and suggestions for development.

Ideas:
${ideas.map((idea, i) => `${i + 1}. ${idea}`).join("\n")}

Respond in JSON format with:
- analysis: Overall analysis of the ideas
- connections: Array of connections found between ideas
- suggestions: Array of actionable suggestions`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  return JSON.parse(content.text) as IncubatorResponse;
}
