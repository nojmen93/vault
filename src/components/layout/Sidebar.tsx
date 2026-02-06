"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Cloud, Lightbulb, Brain, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IdeaDiscoveryWizard } from "@/components/discovery";
import { SidebarHistory } from "@/components/history";
import { generateDiscoverySuggestions, saveSuggestion } from "@/actions/discovery.actions";
import { quickCaptureNote } from "@/actions/notes.actions";
import type { DiscoveryAnswers, IdeaSuggestion } from "@/types/discovery";

interface HistoryNote {
  id: string;
  title: string | null;
  createdAt: string;
}

const navItems = [
  { href: "/dashboard", label: "Idea Cloud", icon: Cloud, exact: true },
  { href: "/dashboard/incubator", label: "Incubator", icon: Lightbulb },
  { href: "/dashboard/profile", label: "Thinking Profile", icon: Brain },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  notes?: HistoryNote[];
}

export function Sidebar({ notes = [] }: SidebarProps): React.ReactElement {
  const pathname = usePathname();
  const router = useRouter();
  const [showDiscovery, setShowDiscovery] = useState(false);

  const handleGenerateSuggestions = async (
    answers: DiscoveryAnswers,
    customRequest?: string
  ): Promise<IdeaSuggestion[]> => {
    const result = await generateDiscoverySuggestions(answers, customRequest);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data;
  };

  const handleIncubate = async (suggestion: IdeaSuggestion): Promise<void> => {
    try {
      // Build the content with all the rich details
      const content = [
        suggestion.oneLiner || '',
        '',
        suggestion.description,
        '',
        suggestion.firstSteps?.length ? `**First Steps:**\n${suggestion.firstSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : '',
        '',
        `**Why this fits you:** ${suggestion.whyFitsYou}`,
        suggestion.edgeForYou ? `\n**Your edge:** ${suggestion.edgeForYou}` : '',
      ].filter(Boolean).join('\n');

      // Save as a note first
      const result = await quickCaptureNote({
        title: suggestion.name,
        content,
      });

      if (result.success) {
        // Navigate to incubator with the note ID
        router.push(`/dashboard/incubator?noteId=${result.data.id}`);
        setShowDiscovery(false);
        toast.success('Idea saved and ready to incubate!');
      } else {
        toast.error('Failed to save idea');
      }
    } catch (error) {
      console.error('Failed to incubate:', error);
      toast.error('Failed to save idea');
    }
  };

  const handleSave = async (suggestion: IdeaSuggestion): Promise<void> => {
    try {
      const result = await saveSuggestion(suggestion);
      if (result.success) {
        toast.success('Idea saved to your cloud!');
        router.refresh();
      } else {
        toast.error('Failed to save idea');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save idea');
    }
  };

  const handleNoteClick = (id: string): void => {
    router.push(`/notes/${id}`);
  };

  return (
    <>
      <aside className="w-64 border-r bg-muted/40 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-semibold text-lg">Vault</span>
          </Link>
        </div>

        {/* Find an Idea Button */}
        <div className="p-3 border-b">
          <Button
            onClick={() => setShowDiscovery(true)}
            variant="outline"
            className="w-full justify-start gap-2 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-purple-500/20"
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            Find an Idea
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Idea History */}
        <SidebarHistory
          notes={notes}
          onNoteClick={handleNoteClick}
          maxItems={5}
        />

        {/* Footer hint */}
        <div className="p-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            Press <kbd className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium">⌘K</kbd> to capture
          </p>
        </div>
      </aside>

      {/* Discovery Wizard Modal */}
      {showDiscovery && (
        <IdeaDiscoveryWizard
          onClose={() => setShowDiscovery(false)}
          onIncubate={handleIncubate}
          onSave={handleSave}
          generateSuggestions={handleGenerateSuggestions}
        />
      )}
    </>
  );
}
