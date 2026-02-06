'use client';

import { motion } from 'framer-motion';
import { Lightbulb, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DiscoveryEmptyStateProps {
  onFindIdea: () => void;
  onStartWriting: () => void;
  className?: string;
}

export function DiscoveryEmptyState({
  onFindIdea,
  onStartWriting,
  className,
}: DiscoveryEmptyStateProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col items-center justify-center text-center px-4 py-16',
        className
      )}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Lightbulb className="h-10 w-10 text-primary" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-semibold mb-3"
      >
        Welcome to Vault
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground max-w-md mb-8"
      >
        Your ideas will float here once you start capturing them.
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 mb-8"
      >
        <Button
          onClick={onFindIdea}
          size="lg"
          className="gap-2"
        >
          <Lightbulb className="h-5 w-5" />
          Help Me Find an Idea
        </Button>
        <Button
          variant="outline"
          onClick={onStartWriting}
          size="lg"
          className="gap-2"
        >
          <PenLine className="h-5 w-5" />
          Just Start Writing
        </Button>
      </motion.div>

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-muted-foreground max-w-sm"
      >
        Not sure what to build? No problem. I&apos;ll help you discover the
        perfect project based on your skills, time, and goals.
      </motion.p>
    </motion.div>
  );
}
