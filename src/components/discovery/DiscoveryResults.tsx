'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IdeaSuggestionCard } from './IdeaSuggestionCard';
import { cn } from '@/lib/utils';
import type { IdeaSuggestion, ResultFilter } from '@/types/discovery';

interface DiscoveryResultsProps {
  suggestions: IdeaSuggestion[];
  onIncubate: (suggestion: IdeaSuggestion) => void;
  onSave: (suggestion: IdeaSuggestion) => void;
  onDismiss: (suggestion: IdeaSuggestion) => void;
  onLoadMore: () => void;
  onCustomRequest: (request: string) => void;
  onStartOver: () => void;
  isLoading?: boolean;
  isLoadingMore?: boolean;
  className?: string;
}

const filterOptions: { value: ResultFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'lowest_effort', label: 'Lowest Effort' },
  { value: 'highest_income', label: 'Highest Income' },
  { value: 'no_skills', label: 'No Skills Needed' },
];

export function DiscoveryResults({
  suggestions,
  onIncubate,
  onSave,
  onDismiss,
  onLoadMore,
  onCustomRequest,
  onStartOver,
  isLoading = false,
  isLoadingMore = false,
  className,
}: DiscoveryResultsProps): React.ReactElement {
  const [activeFilter, setActiveFilter] = useState<ResultFilter>('all');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (suggestion: IdeaSuggestion): void => {
    setDismissedIds((prev) => new Set([...prev, suggestion.id]));
    onDismiss(suggestion);
  };

  const filterSuggestions = (items: IdeaSuggestion[]): IdeaSuggestion[] => {
    // First filter out dismissed
    const visible = items.filter((s) => !dismissedIds.has(s.id));

    switch (activeFilter) {
      case 'lowest_effort':
        return [...visible].sort((a, b) => {
          // Parse hours from timeOngoing (e.g., "2-3 hours/week")
          const getHours = (time: string): number => {
            const match = time.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 999;
          };
          return getHours(a.timeOngoing) - getHours(b.timeOngoing);
        });
      case 'highest_income':
        return [...visible].sort((a, b) => b.incomeMax - a.incomeMax);
      case 'no_skills':
        return visible.filter(
          (s) =>
            s.technicalLevel === 'none' ||
            s.skillsNeeded.toLowerCase().includes('none') ||
            s.skillsNeeded.toLowerCase().includes('anyone')
        );
      default:
        return visible;
    }
  };

  const filteredSuggestions = filterSuggestions(suggestions);

  const handleCustomSubmit = (): void => {
    if (customInput.trim()) {
      onCustomRequest(customInput.trim());
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-20', className)}>
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <h3 className="text-xl font-medium mb-2">Finding your perfect ideas...</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Analyzing your answers to generate personalized suggestions
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Here are some ideas for you</h2>
          <p className="text-muted-foreground">
            Based on what you told me, these could be a great fit
          </p>
        </div>
        <Button variant="outline" onClick={onStartOver}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Start Over
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((filter) => (
          <Button
            key={filter.value}
            variant={activeFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredSuggestions.map((suggestion) => (
            <IdeaSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onIncubate={onIncubate}
              onSave={onSave}
              onDismiss={handleDismiss}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state after filtering */}
      {filteredSuggestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">
            No ideas match this filter. Try a different filter or load more ideas.
          </p>
          <Button variant="outline" onClick={() => setActiveFilter('all')}>
            Show All Ideas
          </Button>
        </motion.div>
      )}

      {/* Load More / Custom Request */}
      <div className="border-t pt-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              'Show me 5 more ideas'
            )}
          </Button>
          <span className="text-muted-foreground">or</span>
          <Button
            variant="ghost"
            onClick={() => setShowCustomInput(!showCustomInput)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            None of these feel right?
          </Button>
        </div>

        {/* Custom Request Input */}
        <AnimatePresence>
          {showCustomInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-xl mx-auto"
            >
              <p className="text-center text-muted-foreground mb-3">
                Describe what you&apos;re looking for:
              </p>
              <div className="flex gap-2">
                <Input
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="e.g., Something I can do from home that involves my love of cooking..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCustomSubmit();
                  }}
                />
                <Button onClick={handleCustomSubmit} disabled={!customInput.trim()}>
                  Generate
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
