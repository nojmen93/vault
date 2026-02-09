# Theme Clustering Implementation Guide

## Overview

This document contains the complete implementation for automatic theme detection and pattern analysis in Vault. The system uses k-means clustering on OpenAI embeddings to identify thematic patterns across a user's ideas, then uses Claude to generate human-readable theme names and meta-analysis.

**Key Features:**
- Automatic theme detection from existing embeddings (no new API costs)
- Per-user pattern analysis ("You're a B2B SaaS builder")
- Blind spot identification ("You never consider consumer products")
- Weekly background job for active users
- Real-time manual analysis trigger

---

## Architecture

**Data Flow:**
```
User's Notes (with embeddings)
  ↓
K-Means Clustering (find groups)
  ↓
Theme Name Generation (Claude)
  ↓
Meta-Pattern Analysis (Claude)
  ↓
Store in database
  ↓
Display in UI
```

**Components:**
1. Clustering engine (k-means on embeddings)
2. Theme generation (Claude API)
3. Meta-analysis (user pattern identification)
4. Server actions (API layer)
5. Background job (weekly cron)
6. UI components (dashboard widget)

---

## Database Schema

Add these tables to Supabase via migration:
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_themes_tables.sql

-- Themes table
CREATE TABLE themes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  note_ids TEXT[] NOT NULL,
  size INTEGER NOT NULL,
  centroid VECTOR(1536), -- Optional: store cluster centroid
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_themes_user_id ON themes(user_id);

ALTER TABLE themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own themes"
  ON themes
  FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');

-- User patterns table
CREATE TABLE user_patterns (
  user_id TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  themes JSONB NOT NULL,
  insights TEXT[] NOT NULL,
  blind_spots TEXT[] NOT NULL,
  last_analyzed TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own pattern"
  ON user_patterns
  FOR ALL
  USING (user_id = auth.jwt() ->> 'sub');
```

---

## File Structure

Create these files:
```
src/lib/ai/clustering/
├── types.ts                    # TypeScript interfaces
├── clustering.ts               # Core k-means implementation
├── theme-generation.ts         # Claude API integration
└── index.ts                    # Public exports

src/actions/
└── themes.actions.ts           # Server actions

src/app/api/cron/analyze-themes/
└── route.ts                    # Weekly background job

src/components/
└── pattern-dashboard.tsx       # UI component
```

---

## Implementation Files

### 1. types.ts
```typescript
// src/lib/ai/clustering/types.ts

export interface Theme {
  id: string;
  user_id: string;
  name: string;
  description: string;
  note_ids: string[];
  size: number;
  centroid?: number[];
  created_at: string;
}

export interface UserPattern {
  user_id: string;
  profile: string;
  themes: Theme[];
  insights: string[];
  blind_spots: string[];
  last_analyzed: string;
}

export interface ClusterResult {
  clusters: number[];
  centroids: number[][];
  k: number;
}

export interface Note {
  id: string;
  embedding: number[];
  title: string;
  tags: string[];
}
```

---

### 2. clustering.ts
```typescript
// src/lib/ai/clustering/clustering.ts

import { createClient } from '@/lib/db/client';
import { generateThemeName } from './theme-generation';
import type { Theme, ClusterResult, Note } from './types';

/**
 * Simple k-means clustering implementation
 */
export function kMeansClustering(
  embeddings: number[][],
  k: number,
  maxIterations: number = 100
): ClusterResult {
  const n = embeddings.length;
  const dim = embeddings[0].length;

  // Initialize centroids randomly
  const centroids: number[][] = [];
  const usedIndices = new Set<number>();
  
  for (let i = 0; i < k; i++) {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * n);
    } while (usedIndices.has(idx));
    usedIndices.add(idx);
    centroids.push([...embeddings[idx]]);
  }

  let clusters = new Array(n).fill(0);
  let changed = true;
  let iterations = 0;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Assign each point to nearest centroid
    for (let i = 0; i < n; i++) {
      let minDist = Infinity;
      let bestCluster = 0;

      for (let j = 0; j < k; j++) {
        const dist = euclideanDistance(embeddings[i], centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          bestCluster = j;
        }
      }

      if (clusters[i] !== bestCluster) {
        clusters[i] = bestCluster;
        changed = true;
      }
    }

    // Update centroids
    for (let j = 0; j < k; j++) {
      const clusterPoints = embeddings.filter((_, idx) => clusters[idx] === j);
      
      if (clusterPoints.length > 0) {
        centroids[j] = clusterPoints[0].map((_, dimIdx) => {
          const sum = clusterPoints.reduce((acc, point) => acc + point[dimIdx], 0);
          return sum / clusterPoints.length;
        });
      }
    }
  }

  return { clusters, centroids, k };
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(
    a.reduce((sum, val, idx) => sum + Math.pow(val - b[idx], 2), 0)
  );
}

/**
 * Determine optimal k using heuristic
 * k = sqrt(n/2), capped between 3 and 10
 */
export function determineOptimalK(noteCount: number): number {
  if (noteCount < 10) return Math.max(2, Math.floor(noteCount / 3));
  const k = Math.floor(Math.sqrt(noteCount / 2));
  return Math.min(Math.max(k, 3), 10);
}

/**
 * Filter out tiny clusters (< minSize notes)
 */
export function filterClusters(
  clusters: number[],
  minSize: number = 3
): { clusters: number[]; mapping: Map<number, number> } {
  const clusterSizes = new Map<number, number>();
  clusters.forEach(c => clusterSizes.set(c, (clusterSizes.get(c) || 0) + 1));

  const validClusters = Array.from(clusterSizes.entries())
    .filter(([_, size]) => size >= minSize)
    .map(([id, _]) => id);

  const mapping = new Map<number, number>();
  validClusters.forEach((oldId, newId) => mapping.set(oldId, newId));

  const filteredClusters = clusters.map(c => 
    mapping.has(c) ? mapping.get(c)! : -1
  );

  return { clusters: filteredClusters, mapping };
}

/**
 * Main function: Detect themes for a user
 */
export async function detectThemes(userId: string): Promise<Theme[]> {
  const supabase = createClient();

  // Fetch all notes with embeddings
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, encrypted_content, embedding, tags')
    .eq('user_id', userId)
    .not('embedding', 'is', null);

  if (error) throw error;
  if (!notes || notes.length < 6) {
    // Need at least 6 notes for meaningful clustering
    return [];
  }

  // Decrypt titles for theme generation
  const notesWithTitles: Note[] = notes.map(n => ({
    id: n.id,
    title: extractTitle(n.encrypted_content),
    tags: n.tags || [],
    embedding: n.embedding,
  }));

  // Determine optimal k
  const k = determineOptimalK(notes.length);

  // Cluster
  const embeddings = notesWithTitles.map(n => n.embedding);
  const result = kMeansClustering(embeddings, k);

  // Filter small clusters
  const { clusters, mapping } = filterClusters(result.clusters, 3);

  // Generate themes
  const themes: Theme[] = [];
  const validClusterIds = Array.from(mapping.values());

  for (const clusterId of validClusterIds) {
    const clusterNotes = notesWithTitles.filter(
      (_, idx) => clusters[idx] === clusterId
    );

    // Take top 5 for theme generation
    const sampleNotes = clusterNotes.slice(0, 5);

    try {
      const themeData = await generateThemeName(sampleNotes);

      themes.push({
        id: `${userId}-theme-${clusterId}-${Date.now()}`,
        user_id: userId,
        name: themeData.name,
        description: themeData.description,
        note_ids: clusterNotes.map(n => n.id),
        size: clusterNotes.length,
        centroid: result.centroids[clusterId],
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`Failed to generate theme for cluster ${clusterId}:`, err);
    }
  }

  // Save to database
  if (themes.length > 0) {
    await saveThemes(userId, themes);
  }

  return themes;
}

async function saveThemes(userId: string, themes: Theme[]): Promise<void> {
  const supabase = createClient();

  // Delete old themes
  await supabase.from('themes').delete().eq('user_id', userId);

  // Insert new themes
  const { error } = await supabase.from('themes').insert(themes);
  if (error) {
    console.error('Failed to save themes:', error);
  }
}

/**
 * Extract title from encrypted content
 * Adjust based on your encryption implementation
 */
function extractTitle(encryptedContent: string): string {
  try {
    // If encrypted_content is JSON with a title field
    const parsed = JSON.parse(encryptedContent);
    return parsed.title || 'Untitled';
  } catch {
    // If it's encrypted, you'll need to decrypt first
    // For now, return placeholder
    return 'Untitled';
  }
}
```

---

### 3. theme-generation.ts
```typescript
// src/lib/ai/clustering/theme-generation.ts

import Anthropic from '@anthropic-ai/sdk';
import type { Note, Theme } from './types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ThemeNameResult {
  name: string;
  description: string;
  keywords: string[];
}

export async function generateThemeName(
  notes: Array<{ title: string; tags: string[] }>
): Promise<ThemeNameResult> {
  const noteTitles = notes.map(n => n.title).join('\n');
  const allTags = [...new Set(notes.flatMap(n => n.tags))].join(', ');

  const prompt = `You are analyzing a cluster of related startup ideas. Generate a concise theme name that captures what connects them.

Note titles:
${noteTitles}

Common tags: ${allTags}

Provide:
1. Theme name (2-4 words, catchy)
2. Description (1 sentence explaining the pattern)
3. Keywords (3-5 relevant terms)

Format as JSON:
{
  "name": "Remote Team Tools",
  "description": "Ideas focused on async collaboration for distributed teams",
  "keywords": ["remote work", "async", "collaboration", "productivity"]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let jsonText = content.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  return JSON.parse(jsonText);
}

export async function generateUserPattern(
  themes: Theme[]
): Promise<{ profile: string; insights: string[]; blind_spots: string[] }> {
  const themeDescriptions = themes
    .map(t => `- ${t.name}: ${t.description} (${t.size} ideas)`)
    .join('\n');

  const prompt = `A user has generated startup ideas that cluster into these themes:

${themeDescriptions}

Analyze their pattern and provide insights:

1. PROFILE (2-3 sentences): What type of builder are they? What problems do they gravitate toward?

2. INSIGHTS (3-4 bullet points): What can we learn about their interests, strengths, or approach?

3. BLIND SPOTS (2-3 bullet points): What types of ideas are they NOT exploring? What might they be missing?

Be specific and actionable. Format as JSON:
{
  "profile": "You consistently build...",
  "insights": ["You prioritize...", "You tend to..."],
  "blind_spots": ["You rarely consider...", "You might explore..."]
}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  let jsonText = content.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  }

  return JSON.parse(jsonText);
}
```

---

### 4. index.ts
```typescript
// src/lib/ai/clustering/index.ts

export { detectThemes, kMeansClustering, determineOptimalK, filterClusters } from './clustering';
export { generateThemeName, generateUserPattern } from './theme-generation';
export type { Theme, UserPattern, ClusterResult, Note } from './types';
```

---

### 5. themes.actions.ts
```typescript
// src/actions/themes.actions.ts

'use server';

import { auth } from '@clerk/nextjs/server';
import { detectThemes, generateUserPattern } from '@/lib/ai/clustering';
import { createClient } from '@/lib/db/client';
import type { Theme, UserPattern } from '@/lib/ai/clustering/types';

interface Result<T> {
  success: true;
  data: T;
} | {
  success: false;
  error: { message: string; code: string };
}

export async function analyzeMyThemes(): Promise<Result<Theme[]>> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    };
  }

  try {
    const themes = await detectThemes(userId);
    return { success: true, data: themes };
  } catch (err) {
    console.error('Theme analysis error:', err);
    return {
      success: false,
      error: { message: 'Failed to analyze themes', code: 'ANALYSIS_ERROR' },
    };
  }
}

export async function getMyThemes(): Promise<Result<Theme[]>> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('user_id', userId)
    .order('size', { ascending: false });

  if (error) {
    return {
      success: false,
      error: { message: 'Failed to fetch themes', code: 'DB_ERROR' },
    };
  }

  return { success: true, data: data || [] };
}

export async function getMyPattern(): Promise<Result<UserPattern>> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
    };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_patterns')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // Generate if doesn't exist
    const themesResult = await getMyThemes();
    if (!themesResult.success) {
      // If no themes exist, try to generate them first
      const analyzeResult = await analyzeMyThemes();
      if (!analyzeResult.success || analyzeResult.data.length === 0) {
        return {
          success: false,
          error: { message: 'Not enough data to generate patterns', code: 'INSUFFICIENT_DATA' }
        };
      }
    }

    const themes = themesResult.success ? themesResult.data : [];
    
    if (themes.length === 0) {
      return {
        success: false,
        error: { message: 'Not enough themes to analyze', code: 'INSUFFICIENT_DATA' }
      };
    }

    const pattern = await generateUserPattern(themes);

    const userPattern: UserPattern = {
      user_id: userId,
      profile: pattern.profile,
      themes: themes,
      insights: pattern.insights,
      blind_spots: pattern.blind_spots,
      last_analyzed: new Date().toISOString(),
    };

    await supabase.from('user_patterns').upsert(userPattern);

    return { success: true, data: userPattern };
  }

  return { success: true, data };
}
```

---

### 6. route.ts (Cron Job)
```typescript
// src/app/api/cron/analyze-themes/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/db/client';
import { detectThemes, generateUserPattern } from '@/lib/ai/clustering';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();

  // Get users who added notes in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: activeUsers, error } = await supabase
    .from('notes')
    .select('user_id')
    .gte('created_at', sevenDaysAgo)
    .not('embedding', 'is', null);

  if (error || !activeUsers) {
    return NextResponse.json({ error: 'Failed to fetch users', analyzed: 0 });
  }

  const uniqueUsers = [...new Set(activeUsers.map(n => n.user_id))];

  let analyzed = 0;
  let failed = 0;

  for (const userId of uniqueUsers) {
    try {
      const themes = await detectThemes(userId);
      
      if (themes.length > 0) {
        const pattern = await generateUserPattern(themes);

        await supabase.from('user_patterns').upsert({
          user_id: userId,
          profile: pattern.profile,
          themes: themes,
          insights: pattern.insights,
          blind_spots: pattern.blind_spots,
          last_analyzed: new Date().toISOString(),
        });

        analyzed++;
      }
    } catch (err) {
      console.error(`Failed to analyze themes for user ${userId}:`, err);
      failed++;
    }
  }

  return NextResponse.json({ 
    total_users: uniqueUsers.length,
    analyzed,
    failed 
  });
}
```

---

### 7. pattern-dashboard.tsx
```typescript
// src/components/pattern-dashboard.tsx

'use client';

import { useEffect, useState } from 'react';
import { getMyThemes, getMyPattern, analyzeMyThemes } from '@/actions/themes.actions';
import type { Theme, UserPattern } from '@/lib/ai/clustering/types';
import { Button } from '@/components/ui/button';

export function PatternDashboard(): React.ReactElement {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [pattern, setPattern] = useState<UserPattern | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [themesResult, patternResult] = await Promise.all([
      getMyThemes(),
      getMyPattern(),
    ]);

    if (themesResult.success) setThemes(themesResult.data);
    if (patternResult.success) setPattern(patternResult.data);
    setLoading(false);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    const result = await analyzeMyThemes();
    if (result.success) {
      await loadData();
    }
    setAnalyzing(false);
  }

  if (loading) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="text-muted-foreground">Analyzing your patterns...</p>
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center space-y-4">
        <p className="text-muted-foreground">
          Add at least 6 ideas to see patterns emerge
        </p>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? 'Analyzing...' : 'Analyze Now'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Patterns</h2>
        <Button onClick={handleAnalyze} disabled={analyzing} variant="outline">
          {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {/* Your Pattern */}
      {pattern && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-3">Your Pattern</h3>
          <p className="text-sm text-muted-foreground mb-4">{pattern.profile}</p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-2">💡 Insights</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {pattern.insights.map((insight, i) => (
                  <li key={i}>• {insight}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">👀 Blind Spots</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {pattern.blind_spots.map((spot, i) => (
                  <li key={i}>• {spot}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Themes */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Your Themes</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {themes.map(theme => (
            <div key={theme.id} className="rounded-lg border p-4 hover:bg-accent transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium">{theme.name}</h4>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {theme.size} ideas
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{theme.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Environment Variables

Add to `.env.local`:
```bash
# Already exists (for embeddings)
OPENAI_API_KEY=sk-...

# Already exists (for incubator)
ANTHROPIC_API_KEY=sk-ant-...

# Add for cron job authentication
CRON_SECRET=your-random-secret-here
```

---

## Vercel Cron Configuration

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/analyze-themes",
    "schedule": "0 2 * * 0"
  }]
}
```

This runs every Sunday at 2 AM UTC.

---

## Testing Locally
```bash
# 1. Run Supabase migration
supabase db push

# 2. Generate embeddings for existing notes (if not already done)
# Run your existing embedding generation

# 3. Test theme detection
# In your app, click "Analyze Now" button

# 4. Test cron job manually
curl -X GET http://localhost:3000/api/cron/analyze-themes \
  -H "Authorization: Bearer your-cron-secret"
```

---

## Integration with Idea Cloud

To show themes in your Idea Cloud:
```typescript
// In your Idea Cloud component
const { data: themes } = await getMyThemes();

// Render large bubbles for themes
{themes.map(theme => (
  <ThemeBubble
    key={theme.id}
    name={theme.name}
    size={theme.size}
    noteIds={theme.note_ids}
  />
))}
```

**Visual design:**
- Theme bubbles: Large, translucent, labeled
- Idea bubbles: Smaller, positioned near their theme
- On hover: Show theme description
- On click: Filter to show only ideas in that theme

---

## Performance Considerations

**Clustering complexity:** O(n * k * i) where:
- n = number of notes
- k = number of clusters (3-10)
- i = iterations (usually 10-30)

**For 100 notes:** ~0.5 seconds
**For 1000 notes:** ~5 seconds

**Optimization:** Run as background job (cron), not real-time.

---

## Cost Analysis

**OpenAI embeddings:** Already paid (using existing embeddings)
**Claude API calls:**
- Theme name generation: $0.003 per theme (300 tokens)
- Meta-pattern analysis: $0.015 per user (1500 tokens)

**Weekly cost for 1000 active users:**
- Avg 5 themes per user: 5000 * $0.003 = $15
- Meta-pattern: 1000 * $0.015 = $15
- **Total: ~$30/week = $120/month**

---

## Monitoring

Add logging to track:
- Theme generation success rate
- Clustering quality (silhouette score)
- API costs per user
- Background job execution time
```typescript
// In detectThemes()
console.log(`[Themes] User ${userId}: Found ${themes.length} themes from ${notes.length} notes in ${duration}ms`);
```

---

## Troubleshooting

**Issue:** No themes detected
- **Cause:** Less than 6 notes or notes too similar
- **Fix:** Wait for more data

**Issue:** Theme names are generic ("Group 1", "Group 2")
- **Cause:** Claude API failed or returned invalid JSON
- **Fix:** Check API key, add retry logic

**Issue:** Clusters are unbalanced (1 big cluster, many small)
- **Cause:** K-means limitation with uneven data
- **Fix:** Use DBSCAN instead (more complex)

**Issue:** Cron job not running
- **Cause:** CRON_SECRET mismatch or Vercel config missing
- **Fix:** Verify vercel.json and environment variable

---

## Future Enhancements

1. **Time-series tracking:** Store theme history monthly
2. **Cross-user patterns:** "Other users building X also build Y"
3. **Theme recommendations:** "Based on your themes, try exploring Z"
4. **Visual clustering:** t-SNE/UMAP projection for 2D visualization
5. **DBSCAN clustering:** Better for uneven cluster sizes

---

## Documentation Updates

After implementing, update these files:

**ARCHITECTURE.md:**
```markdown
## Theme Clustering System

User notes are automatically clustered weekly using k-means on OpenAI embeddings. Claude generates human-readable theme names and identifies user patterns.

**Data flow:**
1. Notes with embeddings → k-means clustering
2. Clusters → Claude API for theme naming
3. Themes → Meta-analysis for user pattern
4. Store in `themes` and `user_patterns` tables
```

**API.md:**
```markdown
## Theme Actions

### analyzeMyThemes()
Manually trigger theme analysis for current user.

### getMyThemes()
Fetch user's current themes.

### getMyPattern()
Get user's pattern analysis (profile, insights, blind spots).
```

**ROADMAP.md:**
```markdown
- [x] Theme clustering implementation
- [x] User pattern analysis
- [x] Pattern dashboard UI
- [ ] Integrate themes into Idea Cloud visualization
- [ ] Time-series theme tracking
```

---

## Implementation Checklist

- [ ] Run database migration (add themes and user_patterns tables)
- [ ] Create src/lib/ai/clustering/ directory with all files
- [ ] Create src/actions/themes.actions.ts
- [ ] Create src/app/api/cron/analyze-themes/route.ts
- [ ] Create src/components/pattern-dashboard.tsx
- [ ] Add CRON_SECRET to environment variables
- [ ] Add vercel.json cron configuration
- [ ] Test with existing notes (click "Analyze Now")
- [ ] Verify cron job works (check Vercel logs)
- [ ] Update documentation (ARCHITECTURE, API, ROADMAP)
- [ ] Add pattern dashboard to main UI

---

## Notes for Claude Code

**CRITICAL:**
1. The `extractTitle()` function in clustering.ts needs to be updated based on how you currently encrypt note content. If notes.encrypted_content is already decrypted in the query, adjust accordingly.

2. This uses Anthropic SDK, ensure it's installed: `pnpm add @anthropic-ai/sdk`

3. The clustering algorithm is a simple k-means implementation. For production at scale (10k+ notes), consider using a library like `ml-kmeans` from npm.

4. Test with at least 6 notes that have embeddings. The system won't work with fewer notes.

5. The cron job requires Vercel Pro plan. For development, trigger manually via the dashboard button.

---

## Success Metrics

After implementation, you should see:
- ✅ Themes auto-detected weekly
- ✅ Pattern dashboard showing user insights
- ✅ "Analyze Now" button working
- ✅ Cron job running (check Vercel logs)
- ✅ Themes stored in database

**Test with Noam's account:**
Create 10-15 diverse ideas, run analysis, verify themes make sense.
