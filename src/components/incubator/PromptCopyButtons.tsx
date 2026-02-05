'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { ProjectKit } from '@/lib/ai/kit-generator';

interface PromptCopyButtonsProps {
  prompts: ProjectKit['prompts'];
}

const TOOL_LABELS: Record<keyof ProjectKit['prompts'], { name: string; color: string }> = {
  claudeCode: { name: 'Claude Code', color: 'bg-orange-500' },
  lovable: { name: 'Lovable', color: 'bg-pink-500' },
  bolt: { name: 'Bolt', color: 'bg-yellow-500' },
  cursor: { name: 'Cursor', color: 'bg-blue-500' },
  v0: { name: 'v0', color: 'bg-gray-800' },
  windsurf: { name: 'Windsurf', color: 'bg-cyan-500' },
};

export function PromptCopyButtons({ prompts }: PromptCopyButtonsProps): React.ReactElement {
  const [copiedKey, setCopiedKey] = useState<keyof ProjectKit['prompts'] | null>(null);

  const handleCopy = async (key: keyof ProjectKit['prompts']): Promise<void> => {
    try {
      await navigator.clipboard.writeText(prompts[key]);
      setCopiedKey(key);
      toast.success(`Copied ${TOOL_LABELS[key].name} prompt`);

      setTimeout(() => {
        setCopiedKey(null);
      }, 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {(Object.keys(prompts) as Array<keyof ProjectKit['prompts']>).map((key) => {
        const tool = TOOL_LABELS[key];
        const isCopied = copiedKey === key;

        return (
          <Button
            key={key}
            variant="outline"
            size="sm"
            onClick={() => handleCopy(key)}
            className="justify-start gap-2"
          >
            <div className={`h-2 w-2 rounded-full ${tool.color}`} />
            <span className="flex-1 text-left">{tool.name}</span>
            {isCopied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        );
      })}
    </div>
  );
}
