"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/embeddings";
import type { Result, ActionError, EncryptedNote } from "@/types";

// Ensure user exists in Supabase (sync from Clerk)
async function ensureUserExists(userId: string): Promise<void> {
  const user = await currentUser();
  if (!user) {
    console.warn("[ensureUserExists] No current user found");
    return;
  }

  const email = user.emailAddresses[0]?.emailAddress || "";

  console.log("[ensureUserExists] Syncing user:", userId, email);

  const { error } = await supabaseAdmin
    .from("users")
    .upsert(
      { id: userId, email },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[ensureUserExists] Failed to upsert user:", error);
  } else {
    console.log("[ensureUserExists] User synced successfully");
  }
}

export async function createNote(
  formData: FormData
): Promise<Result<EncryptedNote, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  const title = formData.get("title") as string | null;
  const encryptedContent = formData.get("encryptedContent") as string;
  const iv = formData.get("iv") as string;
  const plainTextForEmbedding = formData.get("plainText") as string;

  if (!encryptedContent || !iv) {
    return { success: false, error: { message: "Missing required fields", code: "INVALID_INPUT" } };
  }

  try {
    // Ensure user exists in Supabase (sync from Clerk)
    await ensureUserExists(userId);

    const embedding = plainTextForEmbedding
      ? await generateEmbedding(plainTextForEmbedding)
      : null;

    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert({
        user_id: userId,
        title,
        encrypted_content: encryptedContent,
        iv,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error("[createNote] Supabase insert error:", error);
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    console.log("[createNote] Note created successfully, id:", data.id);

    revalidatePath("/notes");
    revalidatePath("/dashboard/notes");
    revalidatePath("/dashboard/profile");

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        encryptedContent: data.encrypted_content,
        iv: data.iv,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err) {
    console.error("[createNote] error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Unknown error", code: "UNKNOWN" },
    };
  }
}

export async function updateNote(
  id: string,
  formData: FormData
): Promise<Result<EncryptedNote, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  const title = formData.get("title") as string | null;
  const encryptedContent = formData.get("encryptedContent") as string;
  const iv = formData.get("iv") as string;
  const plainTextForEmbedding = formData.get("plainText") as string;

  if (!encryptedContent || !iv) {
    return { success: false, error: { message: "Missing required fields", code: "INVALID_INPUT" } };
  }

  try {
    const embedding = plainTextForEmbedding
      ? await generateEmbedding(plainTextForEmbedding)
      : null;

    const { data, error } = await supabaseAdmin
      .from("notes")
      .update({
        title,
        encrypted_content: encryptedContent,
        iv,
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    revalidatePath("/notes");
    revalidatePath(`/notes/${id}`);

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        encryptedContent: data.encrypted_content,
        iv: data.iv,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Unknown error", code: "UNKNOWN" },
    };
  }
}

export async function deleteNote(
  id: string
): Promise<Result<void, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { error } = await supabaseAdmin
      .from("notes")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    revalidatePath("/notes");

    return { success: true, data: undefined };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Unknown error", code: "UNKNOWN" },
    };
  }
}

export async function getNotes(): Promise<Result<EncryptedNote[], ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    // Ensure user exists in Supabase
    await ensureUserExists(userId);

    const { data, error } = await supabaseAdmin
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    console.log("[getNotes] userId:", userId, "found:", data?.length || 0, "notes");

    if (error) {
      console.error("[getNotes] error:", error);
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    return {
      success: true,
      data: data.map((note) => ({
        id: note.id,
        userId: note.user_id,
        title: note.title,
        encryptedContent: note.encrypted_content,
        iv: note.iv,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
      })),
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Unknown error", code: "UNKNOWN" },
    };
  }
}

export async function getNoteById(
  id: string
): Promise<Result<EncryptedNote, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("notes")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        encryptedContent: data.encrypted_content,
        iv: data.iv,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Unknown error", code: "UNKNOWN" },
    };
  }
}

interface QuickCaptureInput {
  title: string;
  content: string;
}

export interface SimilarNote extends EncryptedNote {
  similarity: number;
}

export async function findSimilarNotes(
  noteId: string,
  threshold: number = 0.5,
  limit: number = 5
): Promise<Result<SimilarNote[], ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    // First get the note to find its embedding
    const { data: noteData, error: noteError } = await supabaseAdmin
      .from("notes")
      .select("encrypted_content, embedding")
      .eq("id", noteId)
      .eq("user_id", userId)
      .single();

    if (noteError || !noteData) {
      return { success: false, error: { message: "Note not found", code: "NOT_FOUND" } };
    }

    // If no embedding, generate one from content
    let embedding = noteData.embedding;
    if (!embedding) {
      try {
        embedding = await generateEmbedding(noteData.encrypted_content);
      } catch {
        return { success: false, error: { message: "Could not generate embedding", code: "EMBEDDING_ERROR" } };
      }
    }

    // Call match_notes RPC
    const { data, error } = await supabaseAdmin.rpc("match_notes", {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit + 1, // +1 because we'll filter out the original note
      filter_user_id: userId,
    });

    if (error) {
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    // Filter out the original note and map to our type
    const similarNotes: SimilarNote[] = (data || [])
      .filter((note: { id: string }) => note.id !== noteId)
      .slice(0, limit)
      .map((note: { id: string; user_id: string; title: string | null; encrypted_content: string; iv: string; similarity: number }) => ({
        id: note.id,
        userId: note.user_id,
        title: note.title,
        encryptedContent: note.encrypted_content,
        iv: note.iv,
        createdAt: "", // Not returned by match_notes
        updatedAt: "",
        similarity: note.similarity,
      }));

    return { success: true, data: similarNotes };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Unknown error", code: "UNKNOWN" },
    };
  }
}

export async function quickCaptureNote(
  input: QuickCaptureInput
): Promise<Result<EncryptedNote, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } };
  }

  try {
    // Ensure user exists in Supabase (sync from Clerk)
    await ensureUserExists(userId);

    // Generate embedding from content
    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbedding(input.content);
    } catch (embeddingErr) {
      console.error("Embedding generation failed:", embeddingErr);
      // Continue without embedding - note will still be saved
    }

    // For quick capture, we store plaintext temporarily
    // TODO: Implement proper client-side encryption flow
    console.log("[quickCaptureNote] Creating note for userId:", userId);

    const { data, error } = await supabaseAdmin
      .from("notes")
      .insert({
        user_id: userId,
        title: input.title,
        encrypted_content: input.content, // TODO: Encrypt client-side
        iv: "quick-capture", // Placeholder
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error("[quickCaptureNote] Supabase insert error:", error);
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    console.log("[quickCaptureNote] Note created successfully, id:", data.id);

    revalidatePath("/dashboard/notes");
    revalidatePath("/dashboard/chat");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        encryptedContent: data.encrypted_content,
        iv: data.iv,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    };
  } catch (err) {
    console.error("quickCaptureNote error:", err);
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : "Unknown error", code: "UNKNOWN" },
    };
  }
}
