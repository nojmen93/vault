"use server";

import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db";
import { analyzeIdeas, type IncubatorResponse } from "@/lib/ai/incubator";
import { generateProfileContext, type ThinkingProfile } from "@/lib/ai/thinking-profile";
import type { Result, ActionError } from "@/types";

export async function analyzeSelectedIdeas(
  noteIds: string[]
): Promise<Result<IncubatorResponse, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  if (noteIds.length === 0) {
    return { success: false, error: { message: "No ideas selected", code: "INVALID_INPUT" } };
  }

  if (noteIds.length > 10) {
    return { success: false, error: { message: "Maximum 10 ideas allowed", code: "INVALID_INPUT" } };
  }

  try {
    // Fetch the selected notes
    const { data: notes, error: fetchError } = await supabaseAdmin
      .from("notes")
      .select("id, title, encrypted_content")
      .eq("user_id", userId)
      .in("id", noteIds);

    if (fetchError) {
      return { success: false, error: { message: fetchError.message, code: "DB_ERROR" } };
    }

    if (!notes || notes.length === 0) {
      return { success: false, error: { message: "No notes found", code: "NOT_FOUND" } };
    }

    // Extract idea content for analysis
    const ideas = notes.map(note => {
      const content = note.encrypted_content || "";
      const title = note.title || "";
      return title ? `${title}: ${content}` : content;
    });

    // Fetch user's thinking profile for personalization
    let profileContext: string | undefined;
    const { data: profileData } = await supabaseAdmin
      .from("user_profiles")
      .select("profile")
      .eq("user_id", userId)
      .single();

    if (profileData?.profile) {
      profileContext = generateProfileContext(profileData.profile as ThinkingProfile);
    }

    // Analyze with Claude (with profile context if available)
    const analysis = await analyzeIdeas(ideas, profileContext);

    return { success: true, data: analysis };
  } catch (err) {
    console.error("analyzeSelectedIdeas error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Analysis failed", code: "AI_ERROR" },
    };
  }
}
