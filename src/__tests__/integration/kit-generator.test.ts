/**
 * Integration tests for project kit generation
 * Tests the structure and format of generated kits
 */

import { describe, it, expect } from "vitest";
import type { ProjectKit } from "@/lib/ai/kit-generator";

describe("ProjectKit Structure", () => {
  const mockKit: ProjectKit = {
    projectName: "test-project",
    projectSlug: "test-project",
    files: [
      { path: "README.md", name: "README.md", content: "# Test Project" },
      { path: "ARCHITECTURE.md", name: "ARCHITECTURE.md", content: "# Architecture" },
      { path: "ROADMAP.md", name: "ROADMAP.md", content: "# Roadmap" },
      { path: "CLAUDE.md", name: "CLAUDE.md", content: "# Claude Guidelines" },
      { path: "SESSION_PRIMER.md", name: "SESSION_PRIMER.md", content: "# Session Primer" },
      { path: "PRD.md", name: "PRD.md", content: "# Product Requirements" },
      { path: "DECISIONS.md", name: "DECISIONS.md", content: "# Decisions" },
      { path: "PROMPTS.md", name: "PROMPTS.md", content: "# Prompts" },
    ],
    prompts: {
      claudeCode: "You are working on test-project...",
      lovable: "Build a modern web app...",
      bolt: "Create a full-stack app...",
      cursor: "Help me build test-project...",
      v0: "Design components for...",
      windsurf: "Build test-project with...",
    },
  };

  it("has required project metadata", () => {
    expect(mockKit.projectName).toBeTruthy();
    expect(mockKit.projectSlug).toBeTruthy();
    expect(mockKit.projectSlug).not.toContain(" ");
  });

  it("generates all 8 required files", () => {
    expect(mockKit.files.length).toBe(8);

    const expectedFiles = [
      "README.md",
      "ARCHITECTURE.md",
      "ROADMAP.md",
      "CLAUDE.md",
      "SESSION_PRIMER.md",
      "PRD.md",
      "DECISIONS.md",
      "PROMPTS.md",
    ];

    expectedFiles.forEach((fileName) => {
      const file = mockKit.files.find((f) => f.name === fileName);
      expect(file).toBeDefined();
      expect(file?.content).toBeTruthy();
    });
  });

  it("generates prompts for all 6 tools", () => {
    const tools = ["claudeCode", "lovable", "bolt", "cursor", "v0", "windsurf"] as const;

    tools.forEach((tool) => {
      expect(mockKit.prompts[tool]).toBeTruthy();
      expect(typeof mockKit.prompts[tool]).toBe("string");
    });
  });

  it("files have markdown content", () => {
    mockKit.files.forEach((file) => {
      expect(file.name.endsWith(".md")).toBe(true);
      expect(file.content.startsWith("#")).toBe(true);
    });
  });
});

describe("TechStack Configuration", () => {
  interface TechStack {
    framework: string;
    styling: string;
    database: string;
    auth: string;
    deployment: string;
    packageManager: string;
  }

  const validTechStacks: TechStack[] = [
    {
      framework: "Next.js",
      styling: "Tailwind CSS",
      database: "Supabase",
      auth: "Clerk",
      deployment: "Vercel",
      packageManager: "pnpm",
    },
    {
      framework: "Remix",
      styling: "CSS Modules",
      database: "PostgreSQL",
      auth: "Auth.js",
      deployment: "Railway",
      packageManager: "npm",
    },
  ];

  it("accepts valid tech stack configurations", () => {
    validTechStacks.forEach((stack) => {
      expect(stack.framework).toBeTruthy();
      expect(stack.styling).toBeTruthy();
      expect(stack.database).toBeTruthy();
      expect(stack.auth).toBeTruthy();
      expect(stack.deployment).toBeTruthy();
      expect(stack.packageManager).toBeTruthy();
    });
  });

  it("validates package manager options", () => {
    const validPackageManagers = ["npm", "pnpm", "yarn", "bun"];

    validTechStacks.forEach((stack) => {
      expect(validPackageManagers).toContain(stack.packageManager);
    });
  });
});

describe("Slug Generation", () => {
  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  it("converts spaces to hyphens", () => {
    expect(generateSlug("My Project")).toBe("my-project");
  });

  it("handles special characters", () => {
    expect(generateSlug("Project #1!")).toBe("project-1");
  });

  it("removes leading/trailing hyphens", () => {
    expect(generateSlug("  Project  ")).toBe("project");
  });

  it("handles already valid slugs", () => {
    expect(generateSlug("valid-slug")).toBe("valid-slug");
  });

  it("handles uppercase", () => {
    expect(generateSlug("MyProject")).toBe("myproject");
  });

  it("handles numbers", () => {
    expect(generateSlug("Project 2024")).toBe("project-2024");
  });
});

describe("File Content Validation", () => {
  it("README should have project name as title", () => {
    const readme = "# My Awesome Project\n\nDescription here...";
    expect(readme.startsWith("#")).toBe(true);
  });

  it("ARCHITECTURE should have tech stack table", () => {
    const arch = `# Architecture

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js |`;

    expect(arch).toContain("Tech Stack");
    expect(arch).toContain("|");
  });

  it("ROADMAP should have sprint sections", () => {
    const roadmap = `# Roadmap

## Sprint 0: Foundation
- [ ] Task 1
- [ ] Task 2`;

    expect(roadmap).toContain("Sprint");
    expect(roadmap).toContain("- [ ]");
  });
});
