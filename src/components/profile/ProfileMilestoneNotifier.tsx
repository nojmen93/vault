'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Brain, Sparkles } from 'lucide-react';
import { checkProfileStatus } from '@/actions/profile.actions';

const STORAGE_KEY = 'vault-profile-milestones-shown';

interface MilestonesShown {
  firstProfile: boolean;
  enhancedProfile: boolean;
}

export function ProfileMilestoneNotifier(): React.ReactElement | null {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkMilestones = async (): Promise<void> => {
      try {
        // Get which milestones have been shown
        const stored = localStorage.getItem(STORAGE_KEY);
        const shown: MilestonesShown = stored
          ? JSON.parse(stored)
          : { firstProfile: false, enhancedProfile: false };

        // Check current status
        const result = await checkProfileStatus();
        if (!result.success) return;

        const { hasProfile, needsRegeneration, noteCount } = result.data;

        // Milestone 1: First profile available (5 notes)
        if (!shown.firstProfile && !hasProfile && noteCount >= 5) {
          toast(
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Build Your Thinking Profile</p>
                <p className="text-sm text-muted-foreground">
                  You have {noteCount} ideas! Generate your personalized AI profile now.
                </p>
              </div>
            </div>,
            {
              duration: 10000,
              action: {
                label: 'Generate',
                onClick: () => {
                  window.location.href = '/dashboard/profile';
                },
              },
            }
          );

          shown.firstProfile = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(shown));
        }

        // Milestone 2: Enhanced profile available (20 notes, profile exists but needs regen)
        if (!shown.enhancedProfile && hasProfile && needsRegeneration && noteCount >= 20) {
          toast(
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">Profile Upgrade Available</p>
                <p className="text-sm text-muted-foreground">
                  With {noteCount} ideas, AI can now understand you even better.
                </p>
              </div>
            </div>,
            {
              duration: 10000,
              action: {
                label: 'Upgrade',
                onClick: () => {
                  window.location.href = '/dashboard/profile';
                },
              },
            }
          );

          shown.enhancedProfile = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(shown));
        }
      } catch (err) {
        console.error('Failed to check profile milestones:', err);
      }
    };

    // Small delay to not block initial render
    const timer = setTimeout(checkMilestones, 2000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}
