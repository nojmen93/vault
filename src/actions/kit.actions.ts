"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db";
import {
  generateProjectKit,
  type ProjectKitInput,
  type ProjectKit,
  type TechStack,
} from "@/lib/ai/kit-generator";
import { generateProfileContext, type ThinkingProfile } from "@/lib/ai/thinking-profile";
import type { IncubatorResponse } from "@/lib/ai/incubator";
import type { Result, ActionError } from "@/types";

export interface SavedProjectKit {
  id: string;
  userId: string;
  ideaNoteIds: string[];
  projectName: string;
  projectSlug: string;
  files: ProjectKit["files"];
  analysis: IncubatorResponse;
  techStack: TechStack;
  githubRepoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function generateKit(
  idea: string,
  analysis: IncubatorResponse,
  techStack: TechStack,
  projectName: string,
  noteIds?: string[]
): Promise<Result<ProjectKit, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  if (!idea || !projectName) {
    return { success: false, error: { message: "Idea and project name are required", code: "INVALID_INPUT" } };
  }

  try {
    // Fetch user's thinking profile for personalization
    let thinkingProfile: ThinkingProfile | null = null;
    const { data: profileData } = await supabaseAdmin
      .from("user_profiles")
      .select("profile")
      .eq("user_id", userId)
      .single();

    if (profileData?.profile) {
      thinkingProfile = profileData.profile as ThinkingProfile;
    }

    const input: ProjectKitInput = {
      idea,
      analysis,
      techStack,
      projectName,
      thinkingProfile,
    };

    const kit = await generateProjectKit(input);

    // Save to database
    const { data: savedKit, error: saveError } = await supabaseAdmin
      .from("project_kits")
      .insert({
        user_id: userId,
        idea_note_ids: noteIds || [],
        project_name: kit.projectName,
        project_slug: kit.projectSlug,
        files: kit.files,
        analysis,
        tech_stack: techStack,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save kit:", saveError);
      // Still return the generated kit even if save failed
    }

    return { success: true, data: kit };
  } catch (err) {
    console.error("generateKit error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Kit generation failed", code: "AI_ERROR" },
    };
  }
}

export async function getProjectKits(): Promise<Result<SavedProjectKit[], ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("project_kits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    const kits: SavedProjectKit[] = (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      ideaNoteIds: row.idea_note_ids || [],
      projectName: row.project_name,
      projectSlug: row.project_slug,
      files: row.files,
      analysis: row.analysis,
      techStack: row.tech_stack,
      githubRepoUrl: row.github_repo_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return { success: true, data: kits };
  } catch (err) {
    console.error("getProjectKits error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Failed to fetch kits", code: "DB_ERROR" },
    };
  }
}

export async function getProjectKit(kitId: string): Promise<Result<SavedProjectKit, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("project_kits")
      .select("*")
      .eq("id", kitId)
      .eq("user_id", userId)
      .single();

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    if (!data) {
      return { success: false, error: { message: "Kit not found", code: "NOT_FOUND" } };
    }

    const kit: SavedProjectKit = {
      id: data.id,
      userId: data.user_id,
      ideaNoteIds: data.idea_note_ids || [],
      projectName: data.project_name,
      projectSlug: data.project_slug,
      files: data.files,
      analysis: data.analysis,
      techStack: data.tech_stack,
      githubRepoUrl: data.github_repo_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return { success: true, data: kit };
  } catch (err) {
    console.error("getProjectKit error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Failed to fetch kit", code: "DB_ERROR" },
    };
  }
}

export async function updateKitFile(
  kitId: string,
  fileIndex: number,
  newContent: string
): Promise<Result<SavedProjectKit, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    // First fetch the kit
    const { data: kit, error: fetchError } = await supabaseAdmin
      .from("project_kits")
      .select("*")
      .eq("id", kitId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !kit) {
      return { success: false, error: { message: "Kit not found", code: "NOT_FOUND" } };
    }

    // Update the file
    const files = [...kit.files];
    if (fileIndex < 0 || fileIndex >= files.length) {
      return { success: false, error: { message: "Invalid file index", code: "INVALID_INPUT" } };
    }

    files[fileIndex] = { ...files[fileIndex], content: newContent };

    // Save updated kit
    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from("project_kits")
      .update({ files, updated_at: new Date().toISOString() })
      .eq("id", kitId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: { message: updateError.message, code: "DB_ERROR" } };
    }

    const updatedKit: SavedProjectKit = {
      id: updatedData.id,
      userId: updatedData.user_id,
      ideaNoteIds: updatedData.idea_note_ids || [],
      projectName: updatedData.project_name,
      projectSlug: updatedData.project_slug,
      files: updatedData.files,
      analysis: updatedData.analysis,
      techStack: updatedData.tech_stack,
      githubRepoUrl: updatedData.github_repo_url,
      createdAt: updatedData.created_at,
      updatedAt: updatedData.updated_at,
    };

    return { success: true, data: updatedKit };
  } catch (err) {
    console.error("updateKitFile error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Failed to update file", code: "DB_ERROR" },
    };
  }
}

export async function deleteProjectKit(kitId: string): Promise<Result<void, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { error } = await supabaseAdmin
      .from("project_kits")
      .delete()
      .eq("id", kitId)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("deleteProjectKit error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Failed to delete kit", code: "DB_ERROR" },
    };
  }
}

export async function updateKitGithubUrl(
  kitId: string,
  githubUrl: string
): Promise<Result<void, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { error } = await supabaseAdmin
      .from("project_kits")
      .update({ github_repo_url: githubUrl, updated_at: new Date().toISOString() })
      .eq("id", kitId)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("updateKitGithubUrl error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Failed to update GitHub URL", code: "DB_ERROR" },
    };
  }
}
