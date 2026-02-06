'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/db';
import {
  generateIdeaSuggestions,
  getMoreSuggestions,
  classifyPersona,
} from '@/lib/ai/idea-discovery';
import type { Result, ActionError } from '@/types';
import type {
  DiscoveryAnswers,
  DiscoverySession,
  IdeaSuggestion,
  SavedSuggestion,
  SavedSuggestionStatus,
} from '@/types/discovery';
import { getProfileContextForAI } from './profile.actions';

/**
 * Generate idea suggestions based on discovery answers
 */
export async function generateDiscoverySuggestions(
  answers: DiscoveryAnswers,
  customRequest?: string
): Promise<Result<IdeaSuggestion[], ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    // Get user's thinking profile context for AI
    const profileContext = await getProfileContextForAI();

    // Generate suggestions
    const suggestions = await generateIdeaSuggestions(
      answers,
      profileContext,
      undefined, // relevantNotes - could fetch user's notes here
      customRequest
    );

    return { success: true, data: suggestions };
  } catch (error) {
    console.error('generateDiscoverySuggestions error:', error);

    // Provide more specific error messages
    let message = 'Failed to generate suggestions';
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        message = 'API configuration error. Please check ANTHROPIC_API_KEY.';
      } else if (error.message.includes('rate limit')) {
        message = 'Rate limited. Please try again in a moment.';
      } else if (error.message.includes('parse')) {
        message = 'Failed to parse AI response. Please try again.';
      } else {
        message = error.message;
      }
    }

    return {
      success: false,
      error: { message, code: 'AI_ERROR' },
    };
  }
}

/**
 * Load more suggestions (different from existing)
 */
export async function loadMoreSuggestions(
  answers: DiscoveryAnswers,
  existingSuggestions: IdeaSuggestion[]
): Promise<Result<IdeaSuggestion[], ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    // Get user's thinking profile context for AI
    const profileContext = await getProfileContextForAI();

    const suggestions = await getMoreSuggestions(
      answers,
      existingSuggestions,
      profileContext
    );

    return { success: true, data: suggestions };
  } catch (error) {
    console.error('loadMoreSuggestions error:', error);
    return {
      success: false,
      error: { message: 'Failed to load more suggestions', code: 'AI_ERROR' },
    };
  }
}

/**
 * Save a discovery session to the database
 */
export async function saveDiscoverySession(
  answers: DiscoveryAnswers,
  suggestions: IdeaSuggestion[]
): Promise<Result<DiscoverySession, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    const persona = classifyPersona(answers);

    const { data, error } = await supabaseAdmin
      .from('discovery_sessions')
      .insert({
        user_id: userId,
        answers,
        persona,
        suggestions,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        answers: data.answers,
        persona: data.persona,
        suggestions: data.suggestions,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error('saveDiscoverySession error:', error);
    return {
      success: false,
      error: { message: 'Failed to save session', code: 'DB_ERROR' },
    };
  }
}

/**
 * Save a suggestion for later
 */
export async function saveSuggestion(
  suggestion: IdeaSuggestion,
  discoverySessionId?: string
): Promise<Result<SavedSuggestion, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('saved_suggestions')
      .insert({
        user_id: userId,
        discovery_session_id: discoverySessionId,
        suggestion,
        status: 'saved',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        id: data.id,
        userId: data.user_id,
        discoverySessionId: data.discovery_session_id,
        suggestion: data.suggestion,
        status: data.status,
        noteId: data.note_id,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error('saveSuggestion error:', error);
    return {
      success: false,
      error: { message: 'Failed to save suggestion', code: 'DB_ERROR' },
    };
  }
}

/**
 * Update suggestion status
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  status: SavedSuggestionStatus,
  noteId?: string
): Promise<Result<void, ActionError>> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    const updateData: Record<string, unknown> = { status };
    if (noteId) {
      updateData.note_id = noteId;
    }

    const { error } = await supabaseAdmin
      .from('saved_suggestions')
      .update(updateData)
      .eq('id', suggestionId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    revalidatePath('/dashboard');

    return { success: true, data: undefined };
  } catch (error) {
    console.error('updateSuggestionStatus error:', error);
    return {
      success: false,
      error: { message: 'Failed to update suggestion', code: 'DB_ERROR' },
    };
  }
}

/**
 * Get user's saved suggestions
 */
export async function getSavedSuggestions(): Promise<
  Result<SavedSuggestion[], ActionError>
> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('saved_suggestions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'saved')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const suggestions: SavedSuggestion[] = data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      discoverySessionId: item.discovery_session_id,
      suggestion: item.suggestion,
      status: item.status,
      noteId: item.note_id,
      createdAt: item.created_at,
    }));

    return { success: true, data: suggestions };
  } catch (error) {
    console.error('getSavedSuggestions error:', error);
    return {
      success: false,
      error: { message: 'Failed to get suggestions', code: 'DB_ERROR' },
    };
  }
}

/**
 * Dismiss a suggestion
 */
export async function dismissSuggestion(
  suggestionId: string
): Promise<Result<void, ActionError>> {
  return updateSuggestionStatus(suggestionId, 'dismissed');
}

/**
 * Get user's discovery sessions
 */
export async function getDiscoverySessions(): Promise<
  Result<DiscoverySession[], ActionError>
> {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('discovery_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      throw error;
    }

    const sessions: DiscoverySession[] = data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      answers: item.answers,
      persona: item.persona,
      suggestions: item.suggestions,
      createdAt: item.created_at,
    }));

    return { success: true, data: sessions };
  } catch (error) {
    console.error('getDiscoverySessions error:', error);
    return {
      success: false,
      error: { message: 'Failed to get sessions', code: 'DB_ERROR' },
    };
  }
}
