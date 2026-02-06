'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  DollarSign,
  Target,
  Sparkles,
  Save,
  ThumbsDown,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Wrench,
  AlertTriangle,
  TrendingUp,
  Zap,
} from 'lucide-react';
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

const regionLabels: Record<string, string> = {
  global: '🌍 Global',
  europe: '🇪🇺 Europe-friendly',
  scandinavia: '🇸🇪 Scandinavia-focused',
  us: '🇺🇸 US-focused',
  uk: '🇬🇧 UK-focused',
};

const competitionColors: Record<string, string> = {
  low: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
  medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
  high: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
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
  const [showDetails, setShowDetails] = useState(false);

  const handleDismiss = (): void => {
    setDismissed(true);
    setTimeout(() => onDismiss(suggestion), 300);
  };

  const formatIncome = (min: number, max: number): string => {
    const formatNum = (n: number): string => {
      if (n >= 1000) return `€${(n / 1000).toFixed(0)}k`;
      return `€${n}`;
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
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            {categoryIcons[suggestion.category] || '💡'}
          </span>
          <div>
            <h3 className="font-semibold text-lg leading-tight">{suggestion.name}</h3>
            <span className="text-xs text-muted-foreground">
              {categoryLabels[suggestion.category] || suggestion.category}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {suggestion.technicalLevel === 'none' && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              No coding
            </span>
          )}
          {suggestion.competition && (
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              competitionColors[suggestion.competition]
            )}>
              {suggestion.competition === 'low' ? '📊 Low competition' :
               suggestion.competition === 'medium' ? '📊 Medium competition' :
               '📊 High competition'}
            </span>
          )}
        </div>
      </div>

      {/* One-liner */}
      {suggestion.oneLiner && (
        <p className="text-sm font-medium text-primary mb-2">
          {suggestion.oneLiner}
        </p>
      )}

      {/* Region badge */}
      {suggestion.region && suggestion.region !== 'global' && (
        <div className="flex items-center gap-1 mb-3">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {regionLabels[suggestion.region] || suggestion.region}
          </span>
        </div>
      )}

      {/* Description */}
      <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
        {suggestion.description}
      </p>

      {/* Time & Income Metrics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>
            <span className="text-muted-foreground">Setup:</span>{' '}
            {suggestion.timeUpfront}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>
            <span className="text-muted-foreground">Ongoing:</span>{' '}
            {suggestion.timeOngoing}
          </span>
        </div>
      </div>

      {/* Income Timeline */}
      {suggestion.incomeTimeline ? (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-400">
              Income Timeline
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <div className="text-muted-foreground">Month 1-3</div>
              <div className="font-semibold text-green-600 dark:text-green-400">
                {suggestion.incomeTimeline.month1to3}
              </div>
            </div>
            <div className="text-center border-l border-r border-green-200 dark:border-green-800">
              <div className="text-muted-foreground">Month 6</div>
              <div className="font-semibold text-green-600 dark:text-green-400">
                {suggestion.incomeTimeline.month6}
              </div>
            </div>
            <div className="text-center">
              <div className="text-muted-foreground">Month 12</div>
              <div className="font-semibold text-green-600 dark:text-green-400">
                {suggestion.incomeTimeline.month12}
              </div>
            </div>
          </div>
          {suggestion.incomeModel && (
            <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3 inline mr-1" />
              {suggestion.incomeModel}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm mb-4">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-green-600 dark:text-green-400">
            {formatIncome(suggestion.incomeMin, suggestion.incomeMax)}
          </span>
        </div>
      )}

      {/* Startup cost and skills */}
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <span className="text-muted-foreground">Startup:</span>{' '}
          <span>{suggestion.startupCost}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Skills:</span>{' '}
          <span>{suggestion.skillsNeeded}</span>
        </div>
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
        {suggestion.edgeForYou && (
          <p className="text-sm text-primary mt-2">
            <Zap className="h-3 w-3 inline mr-1" />
            {suggestion.edgeForYou}
          </p>
        )}
      </div>

      {/* First Steps (expandable) */}
      {suggestion.firstSteps && suggestion.firstSteps.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
          >
            <Sparkles className="h-4 w-4" />
            First steps to get started
            {showDetails ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </button>
          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {suggestion.firstSteps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 text-sm bg-muted/50 rounded-lg p-2"
                    >
                      <span className="text-primary font-medium shrink-0">
                        {index + 1}.
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>

                {/* Tools & Platforms */}
                {(suggestion.tools?.length || suggestion.platforms?.length) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestion.platforms?.map((platform) => (
                      <span
                        key={platform}
                        className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full"
                      >
                        {platform}
                      </span>
                    ))}
                    {suggestion.tools?.map((tool) => (
                      <span
                        key={tool}
                        className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        <Wrench className="h-3 w-3" />
                        {tool}
                      </span>
                    ))}
                  </div>
                )}

                {/* Risks */}
                {suggestion.risks && suggestion.risks.length > 0 && (
                  <div className="mt-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
                    <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400 font-medium mb-1">
                      <AlertTriangle className="h-3 w-3" />
                      Risks to consider
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {suggestion.risks.map((risk, index) => (
                        <li key={index}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

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
