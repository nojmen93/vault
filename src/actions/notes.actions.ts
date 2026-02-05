"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/embeddings";
import type { Result, ActionError, EncryptedNote } from "@/types";

// Ensure user exists in Supabase (sync from Clerk)
async function ensureUserExists(userId: string): Promise<void> {
  const user = await currentUser();
  if (!user) return;

  const email = user.emailAddresses[0]?.emailAddress || "";

  await supabaseAdmin
    .from("users")
    .upsert(
      { id: userId, email },
      { onConflict: "id" }
    );
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
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    revalidatePath("/notes");

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
    const { data, error } = await supabaseAdmin
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
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
      console.error("Supabase insert error:", error);
      return { success: false, error: { message: error.message, code: "DB_ERROR" } };
    }

    revalidatePath("/dashboard/notes");
    revalidatePath("/dashboard");

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
