'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrainVisualization } from './BrainVisualization';
import { generateAndSaveProfile } from '@/actions/profile.actions';
import { toast } from 'sonner';
import { useQuickCapture } from '@/components/quick-capture/QuickCaptureProvider';

interface ProfileEmptyStateProps {
  noteCount: number;
  onProfileGenerated: () => void;
}

const MIN_NOTES_REQUIRED = 5;

// Placeholder keywords for empty state brain
const PLACEHOLDER_KEYWORDS = [
  'ideas',
  'thoughts',
  'creativity',
  'insights',
  'patterns',
  'growth',
];

export function ProfileEmptyState({
  noteCount,
  onProfileGenerated,
}: ProfileEmptyStateProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const { open: openQuickCapture } = useQuickCapture();
  const canGenerate = noteCount >= MIN_NOTES_REQUIRED;
  const notesNeeded = MIN_NOTES_REQUIRED - noteCount;

  const handleGenerate = (): void => {
    startTransition(async () => {
      const result = await generateAndSaveProfile();
      if (result.success) {
        toast.success('Thinking profile generated!');
        onProfileGenerated();
      } else {
        toast.error(result.error.message);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center text-center h-full">
      {/* Brain Visualization - always show */}
      <div className="w-full max-w-2xl mb-4 flex-shrink-0" style={{ maxHeight: '50vh' }}>
        <BrainVisualization
          keywords={canGenerate ? [] : PLACEHOLDER_KEYWORDS}
          className="opacity-60 h-full"
        />
      </div>

      {/* Title */}
      <motion.h2
        className="text-2xl font-bold mb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {canGenerate ? 'Ready to Generate!' : 'Build Your Thinking Profile'}
      </motion.h2>

      {/* Description */}
      <motion.p
        className="text-muted-foreground max-w-md mb-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {canGenerate
          ? 'AI will analyze your ideas to understand how you think, what you care about, and how to best assist you.'
          : `Capture ${notesNeeded} more ${notesNeeded === 1 ? 'idea' : 'ideas'} to unlock your personalized thinking profile.`}
      </motion.p>

      {/* Progress or generate button */}
      {canGenerate ? (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Button
            onClick={handleGenerate}
            disabled={isPending}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            {isPending ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Your Ideas...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate My Profile
              </>
            )}
          </Button>
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Progress bar */}
          <div className="w-full max-w-xs">
            <div className="h-2 rounded-full bg-muted overflow-hidden mb-2">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(noteCount / MIN_NOTES_REQUIRED) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.4 }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {noteCount} of {MIN_NOTES_REQUIRED} ideas captured
            </p>
          </div>

          {/* Quick capture button */}
          <Button
            onClick={openQuickCapture}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Capture an Idea
          </Button>

          <p className="text-xs text-muted-foreground">
            or press <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">Ctrl+K</kbd> anywhere
          </p>
        </motion.div>
      )}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps): React.ReactElement {
  return (
    <div className="rounded-xl border bg-card p-4 text-left">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-medium text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
