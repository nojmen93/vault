'use client';

import { useState, useEffect, useCallback } from 'react';
import { Brain } from 'lucide-react';
import { ProfileDisplay, ProfileEmptyState, ProfileSkeleton } from '@/components/profile';
import { getThinkingProfile, checkProfileStatus } from '@/actions/profile.actions';
import type { ThinkingProfile } from '@/lib/ai/thinking-profile';

interface ProfileState {
  profile: ThinkingProfile | null;
  noteCount: number;
  loading: boolean;
}

export default function ProfilePage(): React.ReactElement {
  const [state, setState] = useState<ProfileState>({
    profile: null,
    noteCount: 0,
    loading: true,
  });

  const loadProfile = useCallback(async (): Promise<void> => {
    setState((prev) => ({ ...prev, loading: true }));

    // Load profile and status in parallel
    const [profileResult, statusResult] = await Promise.all([
      getThinkingProfile(),
      checkProfileStatus(),
    ]);

    const profile = profileResult.success ? profileResult.data : null;
    const noteCount = statusResult.success ? statusResult.data.noteCount : 0;

    setState({ profile, noteCount, loading: false });
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleProfileUpdate = (): void => {
    loadProfile();
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
          <Brain className="h-5 w-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Thinking Profile</h1>
          <p className="text-sm text-muted-foreground">
            Personalized AI that understands how you think
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
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
