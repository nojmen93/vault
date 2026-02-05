'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, Sparkles, Edit3, Trash2, ArrowRight, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeleteConfirmation } from '@/components/delete-confirmation';
import { cn } from '@/lib/utils';
import type { EncryptedNote } from '@/types';

interface AnalysisData {
  verdict: 'build' | 'iterate' | 'pivot';
  risks: string[];
  stack: string[];
  summary: string;
}

interface IdeaExpandedWidgetProps {
  note: EncryptedNote;
  analysis?: AnalysisData | null;
  position: { x: number; y: number };
  onClose: () => void;
  isMobile?: boolean;
}

export function IdeaExpandedWidget({
  note,
  analysis,
  position,
  onClose,
  isMobile = false,
}: IdeaExpandedWidgetProps): React.ReactElement {
  const router = useRouter();
  const { openModal: openDeleteConfirmation } = useDeleteConfirmation();

  const handleIncubate = (): void => {
    router.push(`/dashboard/incubator?select=${note.id}`);
    onClose();
  };

  const handleEdit = (): void => {
    router.push(`/dashboard/notes/${note.id}/edit`);
    onClose();
  };

  const handleDelete = (): void => {
    openDeleteConfirmation(note.id, note.title);
    onClose();
  };

  const handleViewAnalysis = (): void => {
    router.push(`/dashboard/incubator?view=${note.id}`);
    onClose();
  };

  const getVerdictColor = (verdict: string): string => {
    switch (verdict) {
      case 'build': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'iterate': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'pivot': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getVerdictIcon = (verdict: string): React.ReactElement => {
    switch (verdict) {
      case 'build': return <CheckCircle className="h-3 w-3" />;
      case 'iterate': return <RefreshCw className="h-3 w-3" />;
      case 'pivot': return <AlertTriangle className="h-3 w-3" />;
      default: return <Sparkles className="h-3 w-3" />;
    }
  };

  // Mobile: bottom drawer style
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-black/50 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Drawer */}
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background/95 backdrop-blur-xl border-t shadow-2xl max-h-[85vh] overflow-hidden"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          </div>

          <div className="px-5 pb-10 overflow-y-auto max-h-[calc(85vh-40px)]">
            <WidgetContent
              note={note}
              analysis={analysis}
              onClose={onClose}
              onIncubate={handleIncubate}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewAnalysis={handleViewAnalysis}
              getVerdictColor={getVerdictColor}
              getVerdictIcon={getVerdictIcon}
            />
          </div>
        </motion.div>
      </>
    );
  }

  // Desktop: positioned card
  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/20 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Expanded card */}
      <motion.div
        className="absolute z-50 w-80 rounded-2xl overflow-hidden"
        style={{
          left: `${Math.min(Math.max(position.x, 20), 80)}%`,
          top: `${Math.min(Math.max(position.y, 20), 70)}%`,
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 100px rgba(147, 51, 234, 0.1)
          `,
        }}
        initial={{
          opacity: 0,
          scale: 0.8,
          x: '-50%',
          y: '-50%'
        }}
        animate={{
          opacity: 1,
          scale: 1,
          x: '-50%',
          y: '-50%'
        }}
        exit={{
          opacity: 0,
          scale: 0.8,
          x: '-50%',
          y: '-50%'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      >
        <div className="bg-background/95 backdrop-blur-xl border border-white/20 rounded-2xl p-5">
          <WidgetContent
            note={note}
            analysis={analysis}
            onClose={onClose}
            onIncubate={handleIncubate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewAnalysis={handleViewAnalysis}
            getVerdictColor={getVerdictColor}
            getVerdictIcon={getVerdictIcon}
          />
        </div>
      </motion.div>
    </>
  );
}

interface WidgetContentProps {
  note: EncryptedNote;
  analysis?: AnalysisData | null;
  onClose: () => void;
  onIncubate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewAnalysis: () => void;
  getVerdictColor: (verdict: string) => string;
  getVerdictIcon: (verdict: string) => React.ReactElement;
}

function WidgetContent({
  note,
  analysis,
  onClose,
  onIncubate,
  onEdit,
  onDelete,
  onViewAnalysis,
  getVerdictColor,
  getVerdictIcon,
}: WidgetContentProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {note.title && (
            <h3 className="font-semibold text-base truncate">{note.title}</h3>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(note.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <motion.button
          onClick={onClose}
          className="shrink-0 h-8 w-8 rounded-full bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="h-4 w-4" />
        </motion.button>
      </div>

      {analysis ? (
        // Analyzed idea view
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Verdict badge */}
          <div className="flex items-center gap-2">
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              getVerdictColor(analysis.verdict)
            )}>
              {getVerdictIcon(analysis.verdict)}
              {analysis.verdict.charAt(0).toUpperCase() + analysis.verdict.slice(1)}
            </span>
          </div>

          {/* Summary */}
          <p className="text-sm text-muted-foreground line-clamp-3">
            {analysis.summary}
          </p>

          {/* Key risks */}
          {analysis.risks.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Key Risks</p>
              <ul className="space-y-1">
                {analysis.risks.slice(0, 2).map((risk, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span className="line-clamp-1">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended stack */}
          {analysis.stack.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {analysis.stack.slice(0, 4).map((tech, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-muted text-xs"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1" onClick={onViewAnalysis}>
              View Full Analysis
              <ArrowRight className="ml-1.5 h-3 w-3" />
            </Button>
            <Button size="sm" variant="outline" onClick={onIncubate}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      ) : (
        // Unanalyzed idea view
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Full content */}
          <div className="rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 p-4 border border-muted/50">
            <p className="text-sm whitespace-pre-wrap line-clamp-6 leading-relaxed">
              {note.encryptedContent}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600" onClick={onIncubate}>
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Incubate This Idea
            </Button>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={onEdit}>
                <Edit3 className="mr-1.5 h-3 w-3" />
                Edit
              </Button>
              <Button size="sm" variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onDelete}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
