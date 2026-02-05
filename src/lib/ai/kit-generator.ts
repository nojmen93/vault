import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import type { ThinkingProfile } from "./thinking-profile";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TechStack {
  framework: string;
  styling: string;
  database: string;
  auth: string;
  deployment: string;
  packageManager: string;
}

export interface ProjectKitInput {
  idea: string;
  analysis: {
    analysis: string;
    connections: string[];
    suggestions: string[];
    personalizedInsights?: string[];
  };
  techStack: TechStack;
  projectName: string;
  thinkingProfile?: ThinkingProfile | null;
}

export interface GeneratedFile {
  path: string;
  name: string;
  content: string;
}

export interface ProjectKit {
  projectName: string;
  projectSlug: string;
  files: GeneratedFile[];
  prompts: {
    claudeCode: string;
    lovable: string;
    bolt: string;
    cursor: string;
    v0: string;
    windsurf: string;
  };
}

// Load template files
function loadTemplate(templateName: string): string {
  try {
    const templatePath = join(process.cwd(), "src/lib/templates", `${templateName}-template.md`);
    return readFileSync(templatePath, "utf-8");
  } catch {
    // Return a minimal template if file not found
    return `# ${templateName.toUpperCase()}\n\n{content}`;
  }
}

const TEMPLATES = {
  architecture: loadTemplate("architecture"),
  roadmap: loadTemplate("roadmap"),
  sessionPrimer: loadTemplate("session-primer"),
  claude: loadTemplate("claude"),
  prd: loadTemplate("prd"),
  decisions: loadTemplate("decisions"),
  prompts: loadTemplate("prompts"),
  readme: loadTemplate("readme"),
};

async function generateFile(
  fileName: string,
  input: ProjectKitInput,
  template: string
): Promise<string> {
  const profileContext = input.thinkingProfile
    ? `
USER BACKGROUND:
- Expertise: ${input.thinkingProfile.domains.join(", ")}
- Skills: ${input.thinkingProfile.skills.join(", ")}
- Thinking Style: ${input.thinkingProfile.thinkingStyle}
- Goals: ${input.thinkingProfile.goals.join(", ")}
- Communication: ${input.thinkingProfile.communicationStyle}
`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are generating a ${fileName} for a new project.

STYLE REFERENCE (match this quality and structure):
${template}

PROJECT CONTEXT:
- Project Name: ${input.projectName}
- Idea: ${input.idea}
- Analysis: ${input.analysis.analysis}
- Connections Found: ${input.analysis.connections.join("; ")}
- Suggestions: ${input.analysis.suggestions.join("; ")}
- Recommended Tech Stack:
  - Framework: ${input.techStack.framework}
  - Styling: ${input.techStack.styling}
  - Database: ${input.techStack.database}
  - Auth: ${input.techStack.auth}
  - Deployment: ${input.techStack.deployment}
${profileContext}

INSTRUCTIONS:
- Follow the exact structure of the style reference
- Replace all placeholder content with project-specific details
- Keep the same level of detail and professionalism
- Include specific, actionable information (not generic placeholders)
- Tailor to the recommended tech stack
- Reference user's skills/experience where relevant
- Use markdown formatting

Generate the complete ${fileName} file. Output ONLY the file content, no explanations.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  return content.text;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function generateToolPrompts(input: ProjectKitInput): ProjectKit["prompts"] {
  const { projectName, idea, analysis, techStack } = input;
  const slug = generateSlug(projectName);

  // Extract key features from analysis
  const features = analysis.suggestions.slice(0, 5);

  // Claude Code prompt
  const claudeCode = `You are working on ${projectName} — ${idea.slice(0, 200)}

Tech Stack: ${techStack.framework}, ${techStack.styling}, ${techStack.database}, ${techStack.auth}

BEFORE STARTING:
1. Read CLAUDE.md for build commands and coding standards
2. Read ARCHITECTURE.md for system design
3. Check ROADMAP.md for current priorities

CODING RULES:
- TypeScript strict mode, explicit return types
- Server Components by default
- Tailwind for styling
- Result pattern for error handling
- Environment variables for secrets

KEY FEATURES TO BUILD:
${features.map((f, i) => `${i + 1}. ${f}`).join("\n")}

FILE STRUCTURE:
- src/app/ — routes
- src/components/ — React components
- src/lib/ — utilities
- src/actions/ — server actions

Ask clarifying questions if requirements are ambiguous.`;

  // Lovable prompt
  const lovable = `Build a ${techStack.framework} app called ${projectName}.

Tech: ${techStack.framework}, ${techStack.styling}, ${techStack.database}

Features:
${features.slice(0, 4).map((f) => `- ${f}`).join("\n")}

Style: Modern, clean design with ${techStack.styling}

Start with the main dashboard`;

  // Bolt prompt
  const bolt = `Create ${projectName}: ${idea.slice(0, 100)}

Stack: ${techStack.framework}, ${techStack.database}, ${techStack.auth}

Pages:
- Home/Landing
- Dashboard
- Settings

Components:
- Navigation
- Main feature component
- User profile

Data Models:
- User: id, email, preferences
- Main entity based on idea`;

  // Cursor prompt
  const cursor = `Project: ${projectName}
Description: ${idea.slice(0, 200)}

Stack: ${techStack.framework}, ${techStack.styling}, ${techStack.database}, ${techStack.auth}

Key Features:
${features.map((f, i) => `${i + 1}. ${f}`).join("\n")}

Project Structure:
src/
├── app/           # Routes
├── components/    # React components
├── lib/           # Utilities
└── types/         # TypeScript types

Coding Standards:
- TypeScript with strict mode
- Functional components with hooks
- ${techStack.styling} for styling
- Server actions for mutations

Current Focus: Set up project foundation`;

  // v0 prompt (UI-focused)
  const v0 = `Design a dashboard for ${projectName}.

Style: Modern, clean, ${techStack.styling === "Tailwind CSS" ? "Tailwind" : techStack.styling}

Include:
- Navigation sidebar
- Main content area
- User menu
- Action buttons

Functionality:
- Responsive layout
- Interactive elements
- Loading states

Color scheme: Professional with primary accent color`;

  // Windsurf prompt
  const windsurf = `Build ${projectName}: ${idea.slice(0, 150)}

Stack:
- Frontend: ${techStack.framework}
- Styling: ${techStack.styling}
- Database: ${techStack.database}
- Auth: ${techStack.auth}

Core Features:
${features.map((f) => `- ${f}`).join("\n")}

Development Approach:
- Start with project setup and auth
- Then add core feature
- Finally polish UI`;

  return {
    claudeCode,
    lovable,
    bolt,
    cursor,
    v0,
    windsurf,
  };
}

export async function generateProjectKit(input: ProjectKitInput): Promise<ProjectKit> {
  const projectSlug = generateSlug(input.projectName);

  // Generate files in parallel where possible
  const [readme, architecture, roadmap, prd, decisions, claude, sessionPrimer] = await Promise.all([
    generateFile("README.md", input, TEMPLATES.readme),
    generateFile("ARCHITECTURE.md", input, TEMPLATES.architecture),
    generateFile("ROADMAP.md", input, TEMPLATES.roadmap),
    generateFile("PRD.md", input, TEMPLATES.prd),
    generateFile("DECISIONS.md", input, TEMPLATES.decisions),
    generateFile("CLAUDE.md", input, TEMPLATES.claude),
    generateFile("SESSION_PRIMER.md", input, TEMPLATES.sessionPrimer),
  ]);

  // Generate tool-specific prompts
  const prompts = generateToolPrompts(input);

  // Create PROMPTS.md with all tool prompts
  const promptsFile = `# AI Coding Tool Prompts

Optimized prompts for different AI coding assistants. Copy and paste the appropriate prompt for your tool.

---

## Claude Code (Full Context)

\`\`\`
${prompts.claudeCode}
\`\`\`

---

## Lovable

\`\`\`
${prompts.lovable}
\`\`\`

---

## Bolt

\`\`\`
${prompts.bolt}
\`\`\`

---

## Cursor

\`\`\`
${prompts.cursor}
\`\`\`

---

## v0 (UI-Focused)

\`\`\`
${prompts.v0}
\`\`\`

---

## Windsurf

\`\`\`
${prompts.windsurf}
\`\`\`
`;

  const files: GeneratedFile[] = [
    { path: "", name: "README.md", content: readme },
    { path: "docs", name: "ARCHITECTURE.md", content: architecture },
    { path: "docs", name: "ROADMAP.md", content: roadmap },
    { path: "docs", name: "PRD.md", content: prd },
    { path: "docs", name: "DECISIONS.md", content: decisions },
    { path: "docs", name: "PROMPTS.md", content: promptsFile },
    { path: "", name: "CLAUDE.md", content: claude },
    { path: "", name: "SESSION_PRIMER.md", content: sessionPrimer },
  ];

  return {
    projectName: input.projectName,
    projectSlug,
    files,
    prompts,
  };
}

export function createZipContent(kit: ProjectKit): Record<string, string> {
  const result: Record<string, string> = {};

  for (const file of kit.files) {
    const fullPath = file.path ? `${file.path}/${file.name}` : file.name;
    result[fullPath] = file.content;
  }

  return result;
}
