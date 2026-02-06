'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import { ProfileDisplay, ProfileEmptyState, ProfileSkeleton } from '@/components/profile';
import { Button } from '@/components/ui/button';
import { getThinkingProfile, debugNoteCount } from '@/actions/profile.actions';
import type { ThinkingProfile } from '@/lib/ai/thinking-profile';

interface DebugInfo {
  userId: string;
  userExists: boolean;
  noteCount: number;
  recentNotes: { id: string; title: string | null; createdAt: string }[];
}

interface ProfileState {
  profile: ThinkingProfile | null;
  noteCount: number;
  loading: boolean;
  debugInfo: DebugInfo | null;
}

export default function ProfilePage(): React.ReactElement {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    noteCount: 0,
    loading: true,
    debugInfo: null,
  });
  const [showDebug, setShowDebug] = useState(false);

  const loadProfile = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));

    // Load profile and debug info in parallel
    // Using debugNoteCount as the primary source of truth for note count
    const [profileResult, debugResult] = await Promise.all([
      getThinkingProfile(),
      debugNoteCount(),
    ]);

    const profile = profileResult.success ? profileResult.data : null;
    const debugInfo = debugResult.success ? debugResult.data : null;
    // Use debugInfo.noteCount as the source of truth since it's more reliable
    const noteCount = debugInfo?.noteCount ?? 0;

    setState({ profile, noteCount, loading: false, debugInfo });
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleProfileUpdate = (): void => {
    loadProfile();
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 flex items-center justify-center">
            <Brain className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Thinking Profile</h1>
            <p className="text-sm text-muted-foreground">
              Personalized AI that understands how you think
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-muted-foreground"
          >
            {showDebug ? 'Hide Debug' : 'Debug'}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadProfile}
            disabled={state.loading}
          >
            <RefreshCw className={`h-4 w-4 ${state.loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      {showDebug && state.debugInfo && (
        <div className="flex-shrink-0 rounded-lg border bg-muted/50 p-4 text-xs font-mono">
          <p><strong>User ID:</strong> {state.debugInfo.userId}</p>
          <p><strong>User Exists in DB:</strong> {state.debugInfo.userExists ? 'Yes' : 'No'}</p>
          <p><strong>Note Count:</strong> {state.debugInfo.noteCount}</p>
          <p><strong>Recent Notes:</strong></p>
          {state.debugInfo.recentNotes.length > 0 ? (
            <ul className="ml-4 mt-1">
              {state.debugInfo.recentNotes.map((note) => (
                <li key={note.id}>
                  {note.title || '(no title)'} - {new Date(note.createdAt).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="ml-4 text-muted-foreground">No notes found</p>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {state.loading ? (
          <ProfileSkeleton />
        ) : state.profile ? (
          <ProfileDisplay
            profile={state.profile}
            noteCount={state.noteCount}
            onProfileUpdate={handleProfileUpdate}
          />
        ) : (
          <ProfileEmptyState
            noteCount={state.noteCount}
            onProfileGenerated={handleProfileUpdate}
          />
        )}
      </div>
    </div>
  );
}
