'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Edit2, Check, X, FileText, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { GeneratedFile } from '@/lib/ai/kit-generator';

interface FilePreviewProps {
  file: GeneratedFile;
  onUpdate?: (content: string) => void;
  isEditable?: boolean;
}

export function FilePreview({
  file,
  onUpdate,
  isEditable = false,
}: FilePreviewProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(file.content);

  const fullPath = file.path ? `${file.path}/${file.name}` : file.name;

  const handleSave = (): void => {
    onUpdate?.(editContent);
    setIsEditing(false);
  };

  const handleCancel = (): void => {
    setEditContent(file.content);
    setIsEditing(false);
  };

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {file.path ? (
            <Folder className="h-4 w-4 text-muted-foreground" />
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-mono text-sm">{fullPath}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t">
              {/* Actions */}
              {isEditable && (
                <div className="flex justify-end gap-2 px-4 py-2 border-b bg-muted/30">
                  {isEditing ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={handleCancel}>
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave}>
                        <Check className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              )}

              {/* Content area */}
              {isEditing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[300px] max-h-[500px] p-4 font-mono text-sm bg-muted/20 focus:outline-none resize-y"
                />
              ) : (
                <pre className="p-4 text-sm font-mono whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto">
                  {file.content}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface FileListPreviewProps {
  files: GeneratedFile[];
  onUpdateFile?: (index: number, content: string) => void;
  isEditable?: boolean;
}

export function FileListPreview({
  files,
  onUpdateFile,
  isEditable = false,
}: FileListPreviewProps): React.ReactElement {
  // Group files by path
  const groupedFiles = files.reduce(
    (acc, file) => {
      const group = file.path || 'root';
      if (!acc[group]) acc[group] = [];
      acc[group].push(file);
      return acc;
    },
    {} as Record<string, GeneratedFile[]>
  );

  return (
    <div className="space-y-2">
      {Object.entries(groupedFiles).map(([group, groupFiles]) => (
        <div key={group} className="space-y-2">
          {group !== 'root' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
              <Folder className="h-3 w-3" />
              <span>{group}/</span>
            </div>
          )}
          {groupFiles.map((file) => {
            const originalIndex = files.findIndex((f) => f === file);
            return (
              <FilePreview
                key={`${file.path}/${file.name}`}
                file={file}
                isEditable={isEditable}
                onUpdate={(content) => onUpdateFile?.(originalIndex, content)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
