"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db";
import {
  generateThinkingProfile,
  generateProfileContext,
  shouldRegenerateProfile,
  type ThinkingProfile,
} from "@/lib/ai/thinking-profile";
import type { Result, ActionError } from "@/types";

export async function getThinkingProfile(): Promise<Result<ThinkingProfile | null, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("profile, note_count_at_generation")
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No profile exists yet
        return { success: true, data: null };
      }
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    const profile = data.profile as ThinkingProfile;
    profile.noteCount = data.note_count_at_generation;

    return { success: true, data: profile };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Unknown error", code: "UNKNOWN" },
    };
  }
}

export async function generateAndSaveProfile(): Promise<Result<ThinkingProfile, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    // Fetch all user notes
    const { data: notes, error: notesError } = await supabaseAdmin
      .from("notes")
      .select("title, encrypted_content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (notesError) {
      return { success: false, error: { message: notesError.message, code: "DB_ERROR" } };
    }

    // Generate profile from notes
    const profile = await generateThinkingProfile(
      userId,
      (notes || []).map((n) => ({
        title: n.title,
        content: n.encrypted_content, // TODO: decrypt when encryption is wired up
        createdAt: n.created_at,
      }))
    );

    // Save to database
    const { error: upsertError } = await supabaseAdmin.from("user_profiles").upsert(
      {
        user_id: userId,
        profile: profile,
        note_count_at_generation: notes?.length || 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (upsertError) {
      return { success: false, error: { message: upsertError.message, code: "DB_ERROR" } };
    }

    revalidatePath("/dashboard/profile");

    return { success: true, data: profile };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Generation failed", code: "AI_ERROR" },
    };
  }
}

export async function updateProfile(
  updates: Partial<ThinkingProfile>
): Promise<Result<ThinkingProfile, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    // Get current profile
    const { data: current, error: fetchError } = await supabaseAdmin
      .from("user_profiles")
      .select("profile")
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      return { success: false, error: { message: fetchError.message, code: "DB_ERROR" } };
    }

    // Merge updates
    const updatedProfile = {
      ...(current.profile as ThinkingProfile),
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    // Save
    const { error: updateError } = await supabaseAdmin
      .from("user_profiles")
      .update({
        profile: updatedProfile,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      return { success: false, error: { message: updateError.message, code: "DB_ERROR" } };
    }

    revalidatePath("/dashboard/profile");

    return { success: true, data: updatedProfile };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Update failed", code: "UNKNOWN" },
    };
  }
}

export async function deleteProfile(): Promise<Result<void, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { error } = await supabaseAdmin
      .from("user_profiles")
      .delete()
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    revalidatePath("/dashboard/profile");

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Delete failed", code: "UNKNOWN" },
    };
  }
}

export async function checkProfileStatus(): Promise<
  Result<{ hasProfile: boolean; needsRegeneration: boolean; noteCount: number }, ActionError>
> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    // Get current note count
    const { count, error: countError } = await supabaseAdmin
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    // Debug logging
    console.log("[checkProfileStatus] userId:", userId);
    console.log("[checkProfileStatus] count:", count, "error:", countError);

    if (countError) {
      console.error("[checkProfileStatus] Count error:", countError);
      return { success: false, error: { message: countError.message, code: "DB_ERROR" } };
    }

    const noteCount = count || 0;
    console.log("[checkProfileStatus] Final noteCount:", noteCount);

    // Get profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("profile, note_count_at_generation")
      .eq("user_id", userId)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      return { success: false, error: { message: profileError.message, code: "DB_ERROR" } };
    }

    const hasProfile = !!profileData;
    let needsRegeneration = false;

    if (profileData) {
      const profile = profileData.profile as ThinkingProfile;
      profile.noteCount = profileData.note_count_at_generation;
      needsRegeneration = shouldRegenerateProfile(profile, noteCount);
    } else if (noteCount >= 5) {
      // Can generate first profile after 5 notes
      needsRegeneration = true;
    }

    return {
      success: true,
      data: { hasProfile, needsRegeneration, noteCount },
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Check failed", code: "UNKNOWN" },
    };
  }
}

/**
 * Get the user's thinking profile context for AI prompts.
 * This is a helper function for use by other server actions.
 * Returns null if no profile exists or on error.
 */
export async function getProfileContextForAI(): Promise<string | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("user_profiles")
      .select("profile, note_count_at_generation")
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    const profile = data.profile as ThinkingProfile;
    profile.noteCount = data.note_count_at_generation;

    return generateProfileContext(profile);
  } catch {
    return null;
  }
}
