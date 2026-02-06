'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, DollarSign, Target, Sparkles, Save, ThumbsDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { IdeaSuggestion } from '@/types/discovery';

interface IdeaSuggestionCardProps {
  suggestion: IdeaSuggestion;
  onIncubate: (suggestion: IdeaSuggestion) => void;
  onSave: (suggestion: IdeaSuggestion) => void;
  onDismiss: (suggestion: IdeaSuggestion) => void;
  isLoading?: boolean;
  className?: string;
}

const categoryIcons: Record<string, string> = {
  passive: '🌴',
  service: '🤝',
  product: '📦',
  content: '📝',
  technical: '💻',
};

const categoryLabels: Record<string, string> = {
  passive: 'Passive Income',
  service: 'Service',
  product: 'Product',
  content: 'Content',
  technical: 'Technical',
};

export function IdeaSuggestionCard({
  suggestion,
  onIncubate,
  onSave,
  onDismiss,
  isLoading = false,
  className,
}: IdeaSuggestionCardProps): React.ReactElement {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = (): void => {
    setDismissed(true);
    setTimeout(() => onDismiss(suggestion), 300);
  };

  const formatIncome = (min: number, max: number): string => {
    const formatNum = (n: number): string => {
      if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
      return `$${n}`;
    };
    return `${formatNum(min)} - ${formatNum(max)} / month`;
  };

  if (dismissed) {
    return (
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ opacity: 0, scale: 0.9 }}
        className={cn('rounded-xl border bg-card p-6', className)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        'rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {categoryIcons[suggestion.category] || '💡'}
          </span>
          <div>
            <h3 className="font-semibold text-lg">{suggestion.name}</h3>
            <span className="text-xs text-muted-foreground">
              {categoryLabels[suggestion.category] || suggestion.category}
            </span>
          </div>
        </div>
        {suggestion.technicalLevel === 'none' && (
          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
            No coding needed
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-muted-foreground mb-4 leading-relaxed">
        {suggestion.description}
      </p>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            <span className="text-muted-foreground">Setup:</span>{' '}
            {suggestion.timeUpfront}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            <span className="text-muted-foreground">Ongoing:</span>{' '}
            {suggestion.timeOngoing}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatIncome(suggestion.incomeMin, suggestion.incomeMax)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span>
            <span className="text-muted-foreground">Startup:</span>{' '}
            {suggestion.startupCost}
          </span>
        </div>
      </div>

      {/* Skills needed */}
      <div className="text-sm mb-4">
        <span className="text-muted-foreground">Skills needed:</span>{' '}
        <span>{suggestion.skillsNeeded}</span>
      </div>

      {/* Why this fits you */}
      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            Why this fits you
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {suggestion.whyFitsYou}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => onIncubate(suggestion)}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Incubate This
        </Button>
        <Button
          variant="outline"
          onClick={() => onSave(suggestion)}
          disabled={isLoading}
          aria-label="Save for later"
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          onClick={handleDismiss}
          disabled={isLoading}
          aria-label="Not for me"
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
