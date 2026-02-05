"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db";
import { createProjectRepo, getGithubUser } from "@/lib/github/create-repo";
import type { Result, ActionError } from "@/types";

export interface GithubStatus {
  connected: boolean;
  username: string | null;
}

export async function getGithubStatus(): Promise<Result<GithubStatus, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("github_access_token, github_username")
      .eq("id", userId)
      .single();

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    const connected = !!data?.github_access_token;
    const username = data?.github_username || null;

    return {
      success: true,
      data: { connected, username },
    };
  } catch (err) {
    console.error("getGithubStatus error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Failed to get status", code: "DB_ERROR" },
    };
  }
}

export async function disconnectGithub(): Promise<Result<void, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { error } = await supabaseAdmin
      .from("users")
      .update({
        github_access_token: null,
        github_username: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("disconnectGithub error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Failed to disconnect", code: "DB_ERROR" },
    };
  }
}

export async function pushToGithub(
  repoName: string,
  description: string,
  files: Record<string, string>,
  isPrivate: boolean
): Promise<Result<{ url: string }, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    // Get user's GitHub token
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("github_access_token")
      .eq("id", userId)
      .single();

    if (userError || !userData?.github_access_token) {
      return {
        success: false,
        error: { message: "GitHub not connected. Please connect your GitHub account first.", code: "NOT_CONNECTED" },
      };
    }

    const accessToken = userData.github_access_token;

    // Validate the token is still valid
    const user = await getGithubUser(accessToken);
    if (!user) {
      // Token is invalid, clear it
      await supabaseAdmin
        .from("users")
        .update({ github_access_token: null, github_username: null })
        .eq("id", userId);

      return {
        success: false,
        error: { message: "GitHub token expired. Please reconnect your GitHub account.", code: "TOKEN_EXPIRED" },
      };
    }

    // Create the repository
    const result = await createProjectRepo({
      name: repoName,
      description,
      isPrivate,
      files,
      accessToken,
    });

    if (!result.success) {
      return {
        success: false,
        error: { message: result.error || "Failed to create repository", code: "GITHUB_ERROR" },
      };
    }

    return { success: true, data: { url: result.url! } };
  } catch (err) {
    console.error("pushToGithub error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Failed to push to GitHub", code: "GITHUB_ERROR" },
    };
  }
}
