'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DiscoveryProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function DiscoveryProgress({
  currentStep,
  totalSteps,
  className,
}: DiscoveryProgressProps): React.ReactElement {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
