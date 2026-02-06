'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Lightbulb, Sparkles, Loader2, ArrowRight, Link2, CheckCircle2, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeSelectedIdeas } from '@/actions/incubator.actions';
import { ProjectKitGenerator } from './ProjectKitGenerator';
import type { EncryptedNote } from '@/types';
import type { IncubatorResponse } from '@/lib/ai/incubator';

interface IncubatorPanelProps {
  notes: EncryptedNote[];
  preSelectedNoteId?: string;
  initialIdeaText?: string;
}

export function IncubatorPanel({
  notes,
  preSelectedNoteId,
  initialIdeaText
}: IncubatorPanelProps): React.ReactElement {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // Pre-select the note if provided
    if (preSelectedNoteId) {
      return new Set([preSelectedNoteId]);
    }
    return new Set();
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<IncubatorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzedIdea, setAnalyzedIdea] = useState<string>(initialIdeaText || '');
  const hasAutoAnalyzed = useRef(false);

  // Auto-analyze when preSelectedNoteId is provided
  useEffect(() => {
    if (preSelectedNoteId && !hasAutoAnalyzed.current && notes.length > 0) {
      hasAutoAnalyzed.current = true;
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handleAnalyze();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [preSelectedNoteId, notes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleSelect = (id: string): void => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size < 10) {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = (): void => {
    if (selectedIds.size === Math.min(notes.length, 10)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notes.slice(0, 10).map(n => n.id)));
    }
  };

  const handleAnalyze = async (): Promise<void> => {
    if (selectedIds.size === 0) return;

    setIsAnalyzing(true);
    setError(null);

    // Capture the combined idea text from selected notes
    const selectedNotes = notes.filter((n) => selectedIds.has(n.id));
    const ideaText = selectedNotes
      .map((n) => (n.title ? `${n.title}: ${n.encryptedContent}` : n.encryptedContent))
      .join('\n\n');
    setAnalyzedIdea(ideaText);

    try {
      const result = await analyzeSelectedIdeas(Array.from(selectedIds));
      if (result.success) {
        setAnalysis(result.data);
        toast.success('Analysis complete!');
      } else {
        setError(result.error.message);
        toast.error(result.error.message);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (notes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <Lightbulb className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-medium">No ideas to incubate</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Capture some ideas first, then come back to analyze them
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full gap-6 lg:grid-cols-2">
      {/* Left panel - Idea selector */}
      <div className="flex flex-col rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold">Select Ideas to Analyze</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={notes.length === 0}
          >
            {selectedIds.size === Math.min(notes.length, 10) ? 'Deselect All' : 'Select All'}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {notes.map((note) => (
              <IdeaCard
                key={note.id}
                note={note}
                isSelected={selectedIds.has(note.id)}
                onToggle={() => handleToggleSelect(note.id)}
              />
            ))}
          </div>
        </div>

        <div className="border-t p-4">
          <Button
            onClick={handleAnalyze}
            disabled={selectedIds.size === 0 || isAnalyzing}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Analyze {selectedIds.size} Idea{selectedIds.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
          <p className="mt-2 text-xs text-center text-muted-foreground">
            Select up to 10 ideas · Powered by Claude
          </p>
        </div>
      </div>

      {/* Right panel - Analysis results */}
      <div className="flex flex-col rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b p-4">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="font-semibold">Analysis Results</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Analysis */}
              <div>
                <h3 className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Analysis
                </h3>
                <p className="text-sm leading-relaxed">{analysis.analysis}</p>
              </div>

              {/* Connections */}
              {analysis.connections.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
                    <Link2 className="h-4 w-4" />
                    Connections Found
                  </h3>
                  <ul className="space-y-2">
                    {analysis.connections.map((connection, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm rounded-lg bg-muted/50 p-3"
                      >
                        <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-amber-100 text-amber-600 text-xs flex items-center justify-center font-medium dark:bg-amber-900/30 dark:text-amber-400">
                          {i + 1}
                        </span>
                        <span>{connection}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-medium text-sm text-muted-foreground mb-2">
                    <ArrowRight className="h-4 w-4" />
                    Next Steps
                  </h3>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm rounded-lg bg-muted/50 p-3"
                      >
                        <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center font-medium dark:bg-green-900/30 dark:text-green-400">
                          {i + 1}
                        </span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Personalized Insights */}
              {analysis.personalizedInsights && analysis.personalizedInsights.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                  <h3 className="flex items-center gap-2 font-medium text-sm text-amber-600 dark:text-amber-400 mb-3">
                    <Brain className="h-4 w-4" />
                    Personalized for You
                  </h3>
                  <ul className="space-y-2">
                    {analysis.personalizedInsights.map((insight, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm"
                      >
                        <span className="text-amber-500 mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-muted-foreground">
                    Based on your thinking profile
                  </p>
                </div>
              )}

              {/* Project Kit Generator */}
              <ProjectKitGenerator
                idea={analyzedIdea}
                analysis={analysis}
                noteIds={Array.from(selectedIds)}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-center">
              <div>
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Select ideas and click Analyze to see insights
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IdeaCardProps {
  note: EncryptedNote;
  isSelected: boolean;
  onToggle: () => void;
}

function IdeaCard({ note, isSelected, onToggle }: IdeaCardProps): React.ReactElement {
  const preview = note.encryptedContent.length > 100
    ? note.encryptedContent.substring(0, 100) + '...'
    : note.encryptedContent;

  return (
    <button
      onClick={onToggle}
      className={`w-full text-left rounded-lg border p-3 transition-all ${
        isSelected
          ? 'border-primary bg-primary/5 ring-1 ring-primary'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-muted-foreground/30'
          }`}
        >
          {isSelected && <CheckCircle2 className="h-3 w-3" />}
        </div>
        <div className="min-w-0 flex-1">
          {note.title && (
            <h4 className="font-medium text-sm truncate">{note.title}</h4>
          )}
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {preview}
          </p>
        </div>
      </div>
    </button>
  );
}
