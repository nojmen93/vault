'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, RefreshCw, Lightbulb, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateAndSaveProfile } from '@/actions/profile.actions';
import { toast } from 'sonner';

interface ProfileEmptyStateProps {
  noteCount: number;
  onProfileGenerated: () => void;
}

const MIN_NOTES_REQUIRED = 5;

export function ProfileEmptyState({
  noteCount,
  onProfileGenerated,
}: ProfileEmptyStateProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
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
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      {/* Animated icon */}
      <motion.div
        className="relative mb-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
          <Brain className="h-12 w-12 text-purple-500" />
        </div>
        <motion.div
          className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-4 w-4 text-white" />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-2xl font-bold mb-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        Build Your Thinking Profile
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
          className="w-full max-w-xs"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
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
        </motion.div>
      )}

      {/* Features preview */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 w-full max-w-2xl"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <FeatureCard
          icon={<Lightbulb className="h-5 w-5 text-amber-500" />}
          title="Know Your Patterns"
          description="Discover recurring themes and blind spots in your thinking"
        />
        <FeatureCard
          icon={<Target className="h-5 w-5 text-green-500" />}
          title="Personalized AI"
          description="Get advice tailored to your style and expertise"
        />
        <FeatureCard
          icon={<Zap className="h-5 w-5 text-blue-500" />}
          title="Better Feedback"
          description="Receive analysis that respects your preferences"
        />
      </motion.div>
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
