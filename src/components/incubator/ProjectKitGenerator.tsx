'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket,
  Loader2,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TechStackSelector, DEFAULT_TECH_STACK } from './TechStackSelector';
import { FileListPreview } from './FilePreview';
import { PromptCopyButtons } from './PromptCopyButtons';
import { GitHubConnect, RepoCreated } from '@/components/github/GitHubConnect';
import { generateKit } from '@/actions/kit.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { TechStack, ProjectKit } from '@/lib/ai/kit-generator';
import type { IncubatorResponse } from '@/lib/ai/incubator';

interface ProjectKitGeneratorProps {
  idea: string;
  analysis: IncubatorResponse;
  noteIds?: string[];
}

type Tab = 'files' | 'prompts' | 'github';

export function ProjectKitGenerator({
  idea,
  analysis,
  noteIds,
}: ProjectKitGeneratorProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [techStack, setTechStack] = useState<TechStack>(DEFAULT_TECH_STACK);
  const [isGenerating, setIsGenerating] = useState(false);
  const [kit, setKit] = useState<ProjectKit | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('files');
  const [githubUrl, setGithubUrl] = useState<string | null>(null);

  const handleGenerate = async (): Promise<void> => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    setIsGenerating(true);

    const result = await generateKit(idea, analysis, techStack, projectName.trim(), noteIds);

    setIsGenerating(false);

    if (result.success) {
      setKit(result.data);
      toast.success('Project kit generated!');
    } else {
      toast.error(result.error.message);
    }
  };

  const handleUpdateFile = (index: number, content: string): void => {
    if (!kit) return;
    const updatedFiles = [...kit.files];
    updatedFiles[index] = { ...updatedFiles[index], content };
    setKit({ ...kit, files: updatedFiles });
  };

  const handleDownloadZip = async (): Promise<void> => {
    if (!kit) return;

    try {
      // Dynamically import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add files to zip
      for (const file of kit.files) {
        const fullPath = file.path ? `${file.path}/${file.name}` : file.name;
        zip.file(fullPath, file.content);
      }

      // Generate and download
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${kit.projectSlug}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Downloaded project kit');
    } catch (err) {
      toast.error('Failed to create ZIP file');
    }
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/5 p-4"
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Start Building</h3>
              <p className="text-sm text-muted-foreground">
                Generate a complete project starter kit from your analysis
              </p>
            </div>
          </div>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-amber-600/5 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-amber-500/20">
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Start Building</h3>
              <p className="text-sm text-muted-foreground">
                {kit ? 'Project kit ready!' : 'Configure and generate your starter kit'}
              </p>
            </div>
          </div>
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {!kit ? (
          <div className="space-y-4">
            {/* Project name */}
            <div>
              <label className="text-sm font-medium mb-1 block">Project Name</label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Awesome Project"
                className="text-lg"
              />
            </div>

            {/* Tech stack */}
            <div>
              <label className="text-sm font-medium mb-2 block">Tech Stack</label>
              <TechStackSelector value={techStack} onChange={setTechStack} />
            </div>

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !projectName.trim()}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Project Kit...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Project Kit
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* GitHub success */}
            {githubUrl && <RepoCreated url={githubUrl} />}

            {/* Tabs */}
            <div className="flex gap-2 border-b">
              {(['files', 'prompts', 'github'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                    activeTab === tab
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab === 'files' && 'Files'}
                  {tab === 'prompts' && 'Copy Prompts'}
                  {tab === 'github' && 'Push to GitHub'}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="min-h-[300px]">
              {activeTab === 'files' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button variant="outline" size="sm" onClick={handleDownloadZip}>
                      <Download className="h-4 w-4 mr-2" />
                      Download ZIP
                    </Button>
                  </div>
                  <FileListPreview
                    files={kit.files}
                    isEditable
                    onUpdateFile={handleUpdateFile}
                  />
                </div>
              )}

              {activeTab === 'prompts' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Copy optimized prompts for your favorite AI coding tool:
                  </p>
                  <PromptCopyButtons prompts={kit.prompts} />
                </div>
              )}

              {activeTab === 'github' && (
                <GitHubConnect kit={kit} onRepoCreated={setGithubUrl} />
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
