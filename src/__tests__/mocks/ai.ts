/**
 * Mock AI responses for testing
 * These mocks prevent real API calls to OpenAI and Anthropic
 */

// Mock embedding - 1536 dimensions filled with predictable values
export const mockEmbedding = Array(1536)
  .fill(0)
  .map((_, i) => Math.sin(i / 100) * 0.1);

// Mock similar embedding (slightly different for similarity testing)
export const mockSimilarEmbedding = Array(1536)
  .fill(0)
  .map((_, i) => Math.sin(i / 100) * 0.1 + 0.01);

// Mock dissimilar embedding
export const mockDissimilarEmbedding = Array(1536)
  .fill(0)
  .map((_, i) => Math.cos(i / 50) * 0.5);

// Mock incubator analysis response
export const mockIncubatorResponse = {
  analysis:
    "This idea combines AI-powered note organization with semantic search capabilities. The core value proposition is helping users discover connections between their scattered thoughts.",
  connections: [
    "Semantic search connects to knowledge management trends",
    "AI analysis relates to productivity tools market",
    "Privacy-first approach connects to growing security concerns",
  ],
  suggestions: [
    "Add collaborative features for team ideation",
    "Implement voice-to-text for quick capture",
    "Build mobile app for on-the-go note taking",
    "Add integrations with popular tools (Notion, Obsidian)",
  ],
  personalizedInsights: [
    "Given your background in SaaS, focus on B2B positioning",
    "Your technical skills align well with building the AI features yourself",
    "Watch for scope creep - start with core features first",
  ],
};

// Mock thinking profile
export const mockThinkingProfile = {
  userId: "test-user-123",
  domains: ["SaaS", "AI/ML", "Developer Tools"],
  skills: ["TypeScript", "Product Strategy", "System Design"],
  experiences: ["Led engineering team", "Built 2 startups", "YC alum"],
  thinkingStyle: "analytical" as const,
  decisionPattern: "data_driven" as const,
  blindSpots: ["Timeline estimation", "Marketing execution"],
  strengths: ["Technical architecture", "User empathy", "Rapid prototyping"],
  recurringThemes: ["AI automation", "Developer experience", "Privacy"],
  values: ["User privacy", "Code quality", "Fast iteration"],
  goals: ["Launch MVP in 3 months", "Get first 100 users", "Raise seed round"],
  communicationStyle: "direct_and_concise" as const,
  preferredFeedback: "blunt" as const,
  lastUpdated: new Date().toISOString(),
  noteCount: 25,
};

// Mock kit generation response
export const mockProjectKit = {
  projectName: "test-project",
  projectSlug: "test-project",
  files: [
    { name: "README.md", content: "# Test Project\n\nA test project description." },
    { name: "ARCHITECTURE.md", content: "# Architecture\n\nSystem design here." },
    { name: "ROADMAP.md", content: "# Roadmap\n\nProject milestones." },
    { name: "CLAUDE.md", content: "# Claude Code Guidelines\n\nCoding standards." },
    { name: "SESSION_PRIMER.md", content: "# Session Primer\n\nSession initialization." },
    { name: "PRD.md", content: "# Product Requirements\n\nFeature specifications." },
    { name: "DECISIONS.md", content: "# Decisions\n\nArchitectural decisions." },
    { name: "PROMPTS.md", content: "# Prompts\n\nTool-specific prompts." },
  ],
  prompts: {
    claudeCode: "You are working on test-project...",
    lovable: "Build a modern web app with...",
    bolt: "Create a full-stack application...",
    cursor: "Help me build test-project using...",
    v0: "Design a UI component for...",
    windsurf: "Build test-project with...",
  },
};

// Mock Claude API response structure
export function createMockClaudeResponse(text: string): {
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    content: [{ type: "text", text }],
  };
}

// Mock OpenAI embeddings response structure
export function createMockEmbeddingResponse(embedding: number[] = mockEmbedding): {
  data: Array<{ embedding: number[] }>;
} {
  return {
    data: [{ embedding }],
  };
}
