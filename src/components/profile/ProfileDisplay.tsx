'use client';

import { useState, useTransition, useMemo } from 'react';
import { RefreshCw, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrainVisualization } from './BrainVisualization';
import { generateAndSaveProfile, deleteProfile } from '@/actions/profile.actions';
import { toast } from 'sonner';
import type { ThinkingProfile } from '@/lib/ai/thinking-profile';

interface ProfileDisplayProps {
  profile: ThinkingProfile;
  noteCount: number;
  onProfileUpdate: () => void;
}

export function ProfileDisplay({
  profile,
  noteCount,
  onProfileUpdate,
}: ProfileDisplayProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  // Extract keywords from profile for brain visualization
  const keywords = useMemo(() => {
    const allKeywords: string[] = [
      ...profile.domains,
      ...profile.skills,
      ...profile.recurringThemes,
      ...profile.values.slice(0, 2),
      ...profile.strengths.slice(0, 2),
    ];
    // Remove duplicates and limit to 12
    return [...new Set(allKeywords)].slice(0, 12);
  }, [profile]);

  const handleRegenerate = (): void => {
    startTransition(async () => {
      const result = await generateAndSaveProfile();
      if (result.success) {
        toast.success('Profile regenerated successfully');
        onProfileUpdate();
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handleDelete = async (): Promise<void> => {
    if (!confirm('Are you sure you want to delete your thinking profile? This cannot be undone.')) {
      return;
    }
    setIsDeleting(true);
    const result = await deleteProfile();
    setIsDeleting(false);
    if (result.success) {
      toast.success('Profile deleted');
      onProfileUpdate();
    } else {
      toast.error(result.error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Brain Visualization - Main Focus */}
      <BrainVisualization keywords={keywords} />

      {/* Minimal stats bar */}
      <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <span>{profile.domains.length} domains</span>
        <span className="text-muted-foreground/30">|</span>
        <span>{profile.skills.length} skills</span>
        <span className="text-muted-foreground/30">|</span>
        <span>{profile.noteCount} ideas analyzed</span>
      </div>

      {/* Regeneration hint */}
      {noteCount > profile.noteCount && (
        <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <Sparkles className="h-4 w-4" />
          <span>
            {noteCount - profile.noteCount} new ideas since last analysis
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={handleRegenerate}
          disabled={isPending || isDeleting}
          variant="outline"
          size="sm"
        >
          {isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending || isDeleting}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Last updated */}
      <p className="text-xs text-muted-foreground text-center">
        Last updated: {new Date(profile.lastUpdated).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}
