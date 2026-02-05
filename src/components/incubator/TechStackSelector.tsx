'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { TechStack } from '@/lib/ai/kit-generator';

interface TechStackSelectorProps {
  value: TechStack;
  onChange: (stack: TechStack) => void;
}

const STACK_OPTIONS = {
  framework: [
    { value: 'Next.js 15', label: 'Next.js 15', description: 'Full-stack React' },
    { value: 'Vite + React', label: 'Vite + React', description: 'Fast SPA' },
    { value: 'Remix', label: 'Remix', description: 'Web standards focused' },
    { value: 'Astro', label: 'Astro', description: 'Content-focused' },
  ],
  styling: [
    { value: 'Tailwind CSS', label: 'Tailwind CSS', description: 'Utility-first' },
    { value: 'CSS Modules', label: 'CSS Modules', description: 'Scoped styles' },
    { value: 'Styled Components', label: 'Styled Components', description: 'CSS-in-JS' },
  ],
  database: [
    { value: 'Supabase', label: 'Supabase', description: 'PostgreSQL + Auth' },
    { value: 'PostgreSQL', label: 'PostgreSQL', description: 'Relational DB' },
    { value: 'MongoDB', label: 'MongoDB', description: 'Document DB' },
    { value: 'PlanetScale', label: 'PlanetScale', description: 'Serverless MySQL' },
    { value: 'SQLite', label: 'SQLite', description: 'Embedded DB' },
  ],
  auth: [
    { value: 'Clerk', label: 'Clerk', description: 'Managed auth' },
    { value: 'NextAuth.js', label: 'NextAuth.js', description: 'Self-hosted' },
    { value: 'Supabase Auth', label: 'Supabase Auth', description: 'With Supabase' },
    { value: 'Auth0', label: 'Auth0', description: 'Enterprise' },
  ],
  deployment: [
    { value: 'Vercel', label: 'Vercel', description: 'Next.js native' },
    { value: 'Netlify', label: 'Netlify', description: 'Jamstack' },
    { value: 'Railway', label: 'Railway', description: 'Full-stack' },
    { value: 'Fly.io', label: 'Fly.io', description: 'Edge compute' },
  ],
  packageManager: [
    { value: 'pnpm', label: 'pnpm', description: 'Fast, efficient' },
    { value: 'npm', label: 'npm', description: 'Standard' },
    { value: 'yarn', label: 'Yarn', description: 'Classic' },
    { value: 'bun', label: 'Bun', description: 'All-in-one' },
  ],
};

export function TechStackSelector({ value, onChange }: TechStackSelectorProps): React.ReactElement {
  const [openSection, setOpenSection] = useState<keyof TechStack | null>(null);

  const handleSelect = (key: keyof TechStack, selectedValue: string): void => {
    onChange({ ...value, [key]: selectedValue });
    setOpenSection(null);
  };

  const toggleSection = (section: keyof TechStack): void => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="space-y-2">
      {(Object.keys(STACK_OPTIONS) as Array<keyof TechStack>).map((key) => (
        <div key={key} className="relative">
          <Button
            variant="outline"
            className="w-full justify-between text-left font-normal"
            onClick={() => toggleSection(key)}
          >
            <span className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground capitalize">{key}:</span>
              <span className="font-medium">{value[key]}</span>
            </span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', openSection === key && 'rotate-180')}
            />
          </Button>

          {openSection === key && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
              {STACK_OPTIONS[key].map((option) => (
                <button
                  key={option.value}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted',
                    value[key] === option.value && 'bg-muted'
                  )}
                  onClick={() => handleSelect(key, option.value)}
                >
                  <div>
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                  {value[key] === option.value && <Check className="h-4 w-4 text-primary" />}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export const DEFAULT_TECH_STACK: TechStack = {
  framework: 'Next.js 15',
  styling: 'Tailwind CSS',
  database: 'Supabase',
  auth: 'Clerk',
  deployment: 'Vercel',
  packageManager: 'pnpm',
};
