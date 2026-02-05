'use client';

import { useState, useEffect, useTransition } from 'react';
import { Github, LogOut, Loader2, ExternalLink, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getGithubStatus, disconnectGithub, pushToGithub } from '@/actions/github.actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ProjectKit } from '@/lib/ai/kit-generator';

interface GitHubConnectProps {
  kit?: ProjectKit;
  onRepoCreated?: (url: string) => void;
}

export function GitHubConnect({ kit, onRepoCreated }: GitHubConnectProps): React.ReactElement {
  const [status, setStatus] = useState<{ connected: boolean; username: string | null }>({
    connected: false,
    username: null,
  });
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [repoName, setRepoName] = useState(kit?.projectSlug || '');
  const [isPrivate, setIsPrivate] = useState(true);
  const [isPushing, setIsPushing] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (kit?.projectSlug) {
      setRepoName(kit.projectSlug);
    }
  }, [kit?.projectSlug]);

  const loadStatus = async (): Promise<void> => {
    const result = await getGithubStatus();
    if (result.success) {
      setStatus(result.data);
    }
    setLoading(false);
  };

  const handleConnect = (): void => {
    window.location.href = '/api/github/auth';
  };

  const handleDisconnect = (): void => {
    startTransition(async () => {
      const result = await disconnectGithub();
      if (result.success) {
        setStatus({ connected: false, username: null });
        toast.success('GitHub disconnected');
      } else {
        toast.error(result.error.message);
      }
    });
  };

  const handlePush = async (): Promise<void> => {
    if (!kit || !repoName.trim()) {
      toast.error('Please enter a repository name');
      return;
    }

    setIsPushing(true);

    // Convert files to Record<string, string>
    const files: Record<string, string> = {};
    for (const file of kit.files) {
      const fullPath = file.path ? `${file.path}/${file.name}` : file.name;
      files[fullPath] = file.content;
    }

    const result = await pushToGithub(
      repoName.trim(),
      `${kit.projectName} - Created with Vault`,
      files,
      isPrivate
    );

    setIsPushing(false);

    if (result.success) {
      toast.success('Repository created!');
      onRepoCreated?.(result.data.url);
    } else {
      toast.error(result.error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status.connected) {
    return (
      <div className="rounded-lg border p-4 bg-card">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
            <Github className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium">Connect GitHub</h3>
            <p className="text-sm text-muted-foreground">Push your project directly to a new repository</p>
          </div>
        </div>
        <Button onClick={handleConnect} className="w-full">
          <Github className="h-4 w-4 mr-2" />
          Connect GitHub Account
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 bg-card space-y-4">
      {/* Connected status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-900 flex items-center justify-center">
            <Github className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-medium">@{status.username}</p>
            <p className="text-sm text-muted-foreground">GitHub connected</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDisconnect}
          disabled={isPending}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Create repo form */}
      {kit && (
        <div className="space-y-3 pt-3 border-t">
          <div>
            <label className="text-sm font-medium mb-1 block">Repository Name</label>
            <Input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-project"
              className="font-mono text-sm"
            />
          </div>

          {/* Visibility toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsPrivate(true)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors',
                isPrivate
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted'
              )}
            >
              <Lock className="h-3 w-3" />
              Private
            </button>
            <button
              onClick={() => setIsPrivate(false)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors',
                !isPrivate
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted'
              )}
            >
              <Globe className="h-3 w-3" />
              Public
            </button>
          </div>

          <Button onClick={handlePush} disabled={isPushing || !repoName.trim()} className="w-full">
            {isPushing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Repository...
              </>
            ) : (
              <>
                <Github className="h-4 w-4 mr-2" />
                Create Repository
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

interface RepoCreatedProps {
  url: string;
}

export function RepoCreated({ url }: RepoCreatedProps): React.ReactElement {
  return (
    <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
          <Github className="h-5 w-5 text-green-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-green-600 dark:text-green-400">Repository Created!</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:underline truncate block"
          >
            {url}
          </a>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
