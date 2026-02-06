'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Target,
  Heart,
  MessageSquare,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileRadarChart } from './ProfileRadarChart';
import { BrainVisualization } from './BrainVisualization';
import { generateAndSaveProfile, deleteProfile } from '@/actions/profile.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    thinking: true,
    cares: false,
    style: false,
    howAiSees: false,
  });

  const toggleSection = (section: string): void => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

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

  const formatStyle = (value: string): string => {
    return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStyleDescription = (style: string): string => {
    const descriptions: Record<string, string> = {
      analytical: 'You approach problems with logic and data, breaking them down systematically.',
      intuitive: 'You trust your gut and spot patterns others miss, often making quick connections.',
      systematic: 'You love frameworks and processes, building reliable systems to solve problems.',
      creative: 'You think outside the box and come up with novel, unconventional solutions.',
    };
    return descriptions[style] || '';
  };

  const getDecisionDescription = (pattern: string): string => {
    const descriptions: Record<string, string> = {
      fast_mover: 'You prefer quick action over perfect information.',
      deliberate: 'You take time to carefully consider all options before deciding.',
      data_driven: 'You rely heavily on evidence and metrics to guide decisions.',
    };
    return descriptions[pattern] || '';
  };

  return (
    <div className="space-y-6">
      {/* Header with brain visualization */}
      <div className="flex flex-col items-center text-center mb-8">
        {/* Brain visualization */}
        <BrainVisualization isActive={true} className="mb-4" />

        <h2 className="text-2xl font-bold mb-2">Your Thinking Profile</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Built from analyzing {profile.noteCount} of your ideas
        </p>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-purple-500">{profile.domains.length}</p>
            <p className="text-xs text-muted-foreground">Domains</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{profile.skills.length}</p>
            <p className="text-xs text-muted-foreground">Skills</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-2xl font-bold text-green-500">{profile.strengths.length}</p>
            <p className="text-xs text-muted-foreground">Strengths</p>
          </div>
        </div>

        {/* Note count indicator */}
        {noteCount > profile.noteCount && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
            <Sparkles className="h-4 w-4" />
            <span>
              {noteCount - profile.noteCount} new ideas since last analysis - consider regenerating!
            </span>
          </div>
        )}
      </div>

      {/* Radar chart (optional - for detailed view) */}
      <div className="mb-6">
        <ProfileRadarChart profile={profile} />
      </div>

      {/* Background section */}
      <Section
        icon={<Brain className="h-4 w-4" />}
        title="Your Background"
        expanded={true}
      >
        <div className="space-y-4">
          {/* Domains */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Expert In</h4>
            <div className="flex flex-wrap gap-2">
              {profile.domains.length > 0 ? (
                profile.domains.map((domain, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm"
                  >
                    {domain}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Not yet identified</span>
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {profile.skills.length > 0 ? (
                profile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Not yet identified</span>
              )}
            </div>
          </div>

          {/* Experiences */}
          {profile.experiences.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Key Experiences</h4>
              <ul className="space-y-1">
                {profile.experiences.map((exp, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    {exp}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>

      {/* How You Think */}
      <Section
        icon={<Zap className="h-4 w-4" />}
        title="How You Think"
        expanded={expandedSections.thinking}
        onToggle={() => toggleSection('thinking')}
        collapsible
      >
        <div className="space-y-4">
          {/* Thinking style */}
          <div className="rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">{formatStyle(profile.thinkingStyle)} Thinker</span>
              <span className="text-xs text-muted-foreground">• {formatStyle(profile.decisionPattern)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {getStyleDescription(profile.thinkingStyle)} {getDecisionDescription(profile.decisionPattern)}
            </p>
          </div>

          {/* Strengths */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-green-500" />
              Strengths
            </h4>
            <ul className="space-y-1">
              {profile.strengths.length > 0 ? (
                profile.strengths.map((strength, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    {strength}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">Not yet identified</li>
              )}
            </ul>
          </div>

          {/* Blind spots */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              Potential Blind Spots
            </h4>
            <ul className="space-y-1">
              {profile.blindSpots.length > 0 ? (
                profile.blindSpots.map((blind, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-amber-500">!</span>
                    {blind}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">None identified yet</li>
              )}
            </ul>
          </div>
        </div>
      </Section>

      {/* What You Care About */}
      <Section
        icon={<Heart className="h-4 w-4" />}
        title="What You Care About"
        expanded={expandedSections.cares}
        onToggle={() => toggleSection('cares')}
        collapsible
      >
        <div className="space-y-4">
          {/* Recurring themes */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Recurring Themes</h4>
            <div className="flex flex-wrap gap-2">
              {profile.recurringThemes.length > 0 ? (
                profile.recurringThemes.map((theme, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 text-sm"
                  >
                    {theme}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Not yet identified</span>
              )}
            </div>
          </div>

          {/* Values */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Core Values</h4>
            <div className="flex flex-wrap gap-2">
              {profile.values.length > 0 ? (
                profile.values.map((value, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm"
                  >
                    {value}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Not yet identified</span>
              )}
            </div>
          </div>

          {/* Goals */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <Target className="h-3 w-3" />
              Goals
            </h4>
            <ul className="space-y-1">
              {profile.goals.length > 0 ? (
                profile.goals.map((goal, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-blue-500">→</span>
                    {goal}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground">Not yet identified</li>
              )}
            </ul>
          </div>
        </div>
      </Section>

      {/* Your Style */}
      <Section
        icon={<MessageSquare className="h-4 w-4" />}
        title="Your Style"
        expanded={expandedSections.style}
        onToggle={() => toggleSection('style')}
        collapsible
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-1">Communication</h4>
            <p className="text-sm text-muted-foreground">
              {formatStyle(profile.communicationStyle)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="text-sm font-medium mb-1">Feedback Preference</h4>
            <p className="text-sm text-muted-foreground">
              {formatStyle(profile.preferredFeedback)}
            </p>
          </div>
        </div>
      </Section>

      {/* How AI Sees You */}
      <Section
        icon={<Eye className="h-4 w-4" />}
        title="How AI Sees You"
        expanded={expandedSections.howAiSees}
        onToggle={() => toggleSection('howAiSees')}
        collapsible
        highlight
      >
        <div className="space-y-3 text-sm">
          <p>
            Based on your profile, AI assistance in Vault is personalized to:
          </p>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>
                Provide <strong>{profile.preferredFeedback}</strong> feedback that matches your
                preference
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>
                Challenge you on potential blind spots:{' '}
                {profile.blindSpots.slice(0, 2).join(', ') || 'none identified'}
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>
                Reference your expertise in {profile.domains.slice(0, 2).join(' and ') || 'your domains'}{' '}
                when relevant
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5">•</span>
              <span>
                Keep responses {profile.communicationStyle === 'direct_and_concise' ? 'concise and to the point' : profile.communicationStyle === 'detailed' ? 'detailed and thorough' : 'conversational and friendly'}
              </span>
            </li>
          </ul>
        </div>
      </Section>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          onClick={handleRegenerate}
          disabled={isPending || isDeleting}
          className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          {isPending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Regenerating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate Profile
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isPending || isDeleting}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
          hour: 'numeric',
          minute: '2-digit',
        })}
      </p>
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  expanded?: boolean;
  onToggle?: () => void;
  collapsible?: boolean;
  highlight?: boolean;
}

function Section({
  icon,
  title,
  children,
  expanded = true,
  onToggle,
  collapsible = false,
  highlight = false,
}: SectionProps): React.ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        highlight && 'border-purple-500/30 bg-purple-500/5'
      )}
    >
      <button
        onClick={collapsible ? onToggle : undefined}
        className={cn(
          'flex items-center justify-between w-full text-left',
          collapsible && 'cursor-pointer'
        )}
        disabled={!collapsible}
      >
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
            {icon}
          </div>
          <h3 className="font-semibold">{title}</h3>
        </div>
        {collapsible && (
          <span className="text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
