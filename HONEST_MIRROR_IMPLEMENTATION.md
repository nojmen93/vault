# THE HONEST MIRROR - Implementation Guide

## Overview

The Honest Mirror is a proactive AI agent that acts as a trusted advisor and accountability partner for entrepreneurs. Unlike generic chatbots, it tracks user behavior, remembers commitments, challenges assumptions, and intervenes when users get stuck.

---

## Database Migration

Run this in Supabase SQL Editor:

```sql
-- Agent conversations
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(clerk_id),
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Commitments the user makes during conversations
CREATE TABLE agent_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(clerk_id),
  conversation_id UUID REFERENCES agent_conversations(id),
  idea_id UUID REFERENCES notes(id),
  commitment TEXT NOT NULL,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Key moments extracted from conversations
CREATE TABLE agent_key_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(clerk_id),
  conversation_id UUID REFERENCES agent_conversations(id),
  insight TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fear', 'strength', 'blind_spot', 'pivot', 'breakthrough')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proactive interventions
CREATE TABLE agent_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(clerk_id),
  trigger_type TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'seen', 'responded')),
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Behavioral metrics (updated daily)
CREATE TABLE agent_behavior_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(clerk_id),
  ideas_per_week FLOAT DEFAULT 0,
  validation_rate FLOAT DEFAULT 0,
  follow_through_score FLOAT DEFAULT 0,
  pivot_frequency INT DEFAULT 0,
  avg_idea_depth FLOAT DEFAULT 0,
  last_activity TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS policies
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_key_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_behavior_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own conversations" ON agent_conversations FOR ALL USING (user_id = auth.jwt()->>'sub');
CREATE POLICY "Users see own commitments" ON agent_commitments FOR ALL USING (user_id = auth.jwt()->>'sub');
CREATE POLICY "Users see own moments" ON agent_key_moments FOR ALL USING (user_id = auth.jwt()->>'sub');
CREATE POLICY "Users see own interventions" ON agent_interventions FOR ALL USING (user_id = auth.jwt()->>'sub');
CREATE POLICY "Users see own metrics" ON agent_behavior_metrics FOR ALL USING (user_id = auth.jwt()->>'sub');
```

---

## File Structure

```
src/
  lib/
    ai/
      honest-mirror/
        agent.ts          -- Main agent class
        triggers.ts       -- Proactive intervention triggers
        prompts.ts        -- System prompt builder
        metrics.ts        -- Behavioral metrics calculator
        types.ts          -- TypeScript interfaces
  actions/
    agent.actions.ts      -- Server actions for agent
  app/
    dashboard/
      agent/
        page.tsx          -- Agent chat page
    api/
      cron/
        agent-interventions/
          route.ts        -- Daily cron job
  components/
    agent-chat.tsx        -- Chat interface component
    agent-sidebar.tsx     -- Intervention notifications
```

---

## Core Types

```typescript
// src/lib/ai/honest-mirror/types.ts

export interface UserContext {
  user_id: string;
  behavior: BehaviorMetrics;
  recent_ideas: RecentIdea[];
  commitments: Commitment[];
  key_moments: KeyMoment[];
  themes: string[];
}

export interface BehaviorMetrics {
  ideas_per_week: number;
  validation_rate: number;
  follow_through_score: number;
  pivot_frequency: number;
  avg_idea_depth: number;
  last_activity: Date | null;
}

export interface Commitment {
  id: string;
  idea_id: string | null;
  commitment: string;
  deadline: Date | null;
  status: 'pending' | 'completed' | 'missed';
}

export interface KeyMoment {
  date: Date;
  insight: string;
  category: 'fear' | 'strength' | 'blind_spot' | 'pivot' | 'breakthrough';
}

export interface RecentIdea {
  id: string;
  title: string;
  created_at: Date;
}

export interface Intervention {
  id: string;
  trigger_type: string;
  message: string;
  status: 'pending' | 'seen' | 'responded';
  created_at: Date;
}
```

---

## Proactive Triggers

```typescript
// src/lib/ai/honest-mirror/triggers.ts

import { UserContext } from './types';

interface TriggerConfig {
  condition: (ctx: UserContext) => boolean;
  message: (ctx: UserContext) => string;
}

function daysSinceLastActivity(ctx: UserContext): number {
  if (!ctx.behavior.last_activity) return 999;
  const diff = Date.now() - new Date(ctx.behavior.last_activity).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function hasOpenCommitments(ctx: UserContext): boolean {
  return ctx.commitments.some(c => c.status === 'pending');
}

function allSameTheme(ideas: UserContext['recent_ideas']): boolean {
  // Simplified check -- if more than 3 ideas in a week, likely same theme
  return ideas.length > 3;
}

export const INTERVENTION_TRIGGERS: Record<string, TriggerConfig> = {
  same_theme_spam: {
    condition: (ctx) => ctx.behavior.ideas_per_week > 5 && allSameTheme(ctx.recent_ideas),
    message: (ctx) => `You've added ${ctx.recent_ideas.length} ideas in the same space recently. Are you ideating to avoid validating? Pick one and test it this week.`
  },

  ghosting: {
    condition: (ctx) => daysSinceLastActivity(ctx) > 7 && hasOpenCommitments(ctx),
    message: (ctx) => {
      const open = ctx.commitments.find(c => c.status === 'pending');
      return `You went quiet. Last time we talked, you committed to: "${open?.commitment}". What happened?`;
    }
  },

  momentum: {
    condition: (ctx) => ctx.behavior.validation_rate > 0.5 && ctx.behavior.follow_through_score > 0.7,
    message: (ctx) => `You're on fire. ${Math.round(ctx.behavior.validation_rate * 100)}% of your ideas are getting validated. What changed in your approach?`
  },

  pivot_fatigue: {
    condition: (ctx) => ctx.behavior.pivot_frequency > 3,
    message: () => `This is your 4th pivot recently. Real talk: are you avoiding committing to one direction? Pick one and give it 2 full weeks.`
  },

  stale_commitments: {
    condition: (ctx) => {
      const overdue = ctx.commitments.filter(c => {
        if (c.status !== 'pending' || !c.deadline) return false;
        return new Date(c.deadline) < new Date();
      });
      return overdue.length > 0;
    },
    message: (ctx) => {
      const overdue = ctx.commitments.filter(c =>
        c.status === 'pending' && c.deadline && new Date(c.deadline) < new Date()
      );
      return `You have ${overdue.length} overdue commitment(s). First one: "${overdue[0]?.commitment}". Complete it, renegotiate the deadline, or admit it's not happening.`;
    }
  }
};
```

---

## System Prompt Builder

```typescript
// src/lib/ai/honest-mirror/prompts.ts

import { UserContext } from './types';

export function buildSystemPrompt(ctx: UserContext, userName: string): string {
  const behaviorAnalysis = analyzeBehavior(ctx.behavior);
  const momentsText = ctx.key_moments
    .slice(-10)
    .map(m => `- ${new Date(m.date).toLocaleDateString()}: [${m.category}] ${m.insight}`)
    .join('\n');
  const commitmentsText = ctx.commitments
    .filter(c => c.status === 'pending')
    .map(c => `- ${c.commitment}${c.deadline ? ` (due ${new Date(c.deadline).toLocaleDateString()})` : ''}`)
    .join('\n');

  return `You are The Honest Mirror -- a brutally honest but caring advisor for ${userName}.

You are NOT a generic chatbot. You are a co-founder who:
- Knows their patterns deeply
- Challenges bullshit directly
- Celebrates real progress
- Holds them accountable
- References specific past moments

BEHAVIORAL DATA:
- Ideas per week: ${ctx.behavior.ideas_per_week} (${behaviorAnalysis.ideation})
- Validation rate: ${Math.round(ctx.behavior.validation_rate * 100)}% (${behaviorAnalysis.validation})
- Follow-through: ${Math.round(ctx.behavior.follow_through_score * 100)}% (${behaviorAnalysis.followThrough})
- Pivot frequency: ${ctx.behavior.pivot_frequency} recent pivots

KEY MOMENTS YOU REMEMBER:
${momentsText || '(No key moments recorded yet -- this is a new relationship)'}

OPEN COMMITMENTS:
${commitmentsText || '(No open commitments)'}

THEIR THEMES:
${ctx.themes.length > 0 ? ctx.themes.join(', ') : '(No themes identified yet)'}

YOUR RULES:
1. Be direct, not mean. Challenge with care.
2. Reference their specific patterns and past moments -- never give generic advice.
3. If they make a commitment, acknowledge it explicitly ("I'm noting that you said X by Y").
4. If they're avoiding something, call it out.
5. If they're making real progress, celebrate it genuinely.
6. Ask hard questions. "Why this idea?" "What are you avoiding?" "Who have you talked to?"
7. Keep responses concise. No walls of text.
8. If this is your first conversation, introduce yourself and ask about their current focus.

NEVER:
- Give generic startup advice
- Be a yes-man
- Let them off easy on commitments
- Forget what they've told you
- Write more than 3 paragraphs per response`;
}

function analyzeBehavior(b: UserContext['behavior']): {
  ideation: string;
  validation: string;
  followThrough: string;
} {
  return {
    ideation: b.ideas_per_week > 5 ? 'High -- possibly ideating to avoid action' :
              b.ideas_per_week > 2 ? 'Healthy pace' : 'Low -- might be stuck',
    validation: b.validation_rate > 0.5 ? 'Strong -- testing ideas' :
                b.validation_rate > 0.2 ? 'Could improve' : 'Low -- rarely validates',
    followThrough: b.follow_through_score > 0.7 ? 'Reliable' :
                   b.follow_through_score > 0.4 ? 'Inconsistent' : 'Needs work'
  };
}
```

---

## Main Agent Class

```typescript
// src/lib/ai/honest-mirror/agent.ts

import Anthropic from '@anthropic-ai/sdk';
import { UserContext, Commitment, KeyMoment } from './types';
import { buildSystemPrompt } from './prompts';
import { INTERVENTION_TRIGGERS } from './triggers';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export class HonestMirror {

  async respond(
    userId: string,
    userName: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<string> {
    const context = await this.loadUserContext(userId);
    const systemPrompt = buildSystemPrompt(context, userName);

    const messages = [
      ...conversationHistory,
      { role: 'user' as const, content: userMessage }
    ];

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages,
    });

    const assistantMessage = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Extract commitments and key moments in background
    this.extractCommitment(userId, userMessage).catch(console.error);
    this.extractKeyMoments(userId, userMessage, assistantMessage).catch(console.error);

    return assistantMessage;
  }

  async loadUserContext(userId: string): Promise<UserContext> {
    // This will be implemented in server actions
    // Fetches behavior metrics, recent ideas, commitments, key moments, themes
    throw new Error('Implement via server action -- see agent.actions.ts');
  }

  async extractCommitment(userId: string, message: string): Promise<void> {
    // Use Claude to detect if the message contains a commitment
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: 'Extract any commitment or promise from this message. Return JSON: { "found": boolean, "commitment": string, "deadline": string | null }. If no commitment, return { "found": false }.',
      messages: [{ role: 'user', content: message }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (parsed.found) {
        // Save via server action
        console.log('Commitment detected:', parsed.commitment);
      }
    } catch {
      // Parsing failed, skip
    }
  }

  async extractKeyMoments(userId: string, userMessage: string, assistantMessage: string): Promise<void> {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      system: 'Analyze this exchange for key psychological moments. Return JSON: { "found": boolean, "insight": string, "category": "fear" | "strength" | "blind_spot" | "pivot" | "breakthrough" }. Only return found:true for significant moments.',
      messages: [{ role: 'user', content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantMessage}"` }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      if (parsed.found) {
        console.log('Key moment detected:', parsed.insight);
      }
    } catch {
      // Parsing failed, skip
    }
  }

  async checkForInterventions(userId: string): Promise<void> {
    const context = await this.loadUserContext(userId);

    for (const [triggerName, trigger] of Object.entries(INTERVENTION_TRIGGERS)) {
      if (trigger.condition(context)) {
        const message = trigger.message(context);
        // Save intervention via server action
        console.log(`Intervention triggered: ${triggerName} - ${message}`);
      }
    }
  }
}
```

---

## Behavioral Metrics Calculator

```typescript
// src/lib/ai/honest-mirror/metrics.ts

import { createAdminClient } from '@/lib/db/client';
import { BehaviorMetrics } from './types';

export async function calculateBehaviorMetrics(userId: string): Promise<BehaviorMetrics> {
  const supabase = createAdminClient();
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Ideas per week
  const { count: weeklyIdeas } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneWeekAgo.toISOString());

  // Total ideas this month for validation rate
  const { count: monthlyIdeas } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneMonthAgo.toISOString());

  // Commitments follow-through
  const { data: commitments } = await supabase
    .from('agent_commitments')
    .select('status')
    .eq('user_id', userId)
    .gte('created_at', oneMonthAgo.toISOString());

  const totalCommitments = commitments?.length || 0;
  const completedCommitments = commitments?.filter(c => c.status === 'completed').length || 0;
  const followThrough = totalCommitments > 0 ? completedCommitments / totalCommitments : 0;

  // Pivot frequency (ideas marked as pivoted or abandoned)
  const { count: pivots } = await supabase
    .from('agent_key_moments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('category', 'pivot')
    .gte('created_at', oneMonthAgo.toISOString());

  // Last activity
  const { data: lastNote } = await supabase
    .from('notes')
    .select('created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Ideas that went through incubator = "validated"
  // Rough proxy: ideas with more than just a title
  const { count: validatedIdeas } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', oneMonthAgo.toISOString())
    .not('encrypted_content', 'is', null);

  const validationRate = (monthlyIdeas || 0) > 0
    ? (validatedIdeas || 0) / (monthlyIdeas || 1)
    : 0;

  return {
    ideas_per_week: weeklyIdeas || 0,
    validation_rate: validationRate,
    follow_through_score: followThrough,
    pivot_frequency: pivots || 0,
    avg_idea_depth: 0, // Can be calculated later based on note length/detail
    last_activity: lastNote?.created_at ? new Date(lastNote.created_at) : null,
  };
}
```

---

## Server Actions

```typescript
// src/actions/agent.actions.ts

'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/db/client';
import { HonestMirror } from '@/lib/ai/honest-mirror/agent';
import { calculateBehaviorMetrics } from '@/lib/ai/honest-mirror/metrics';
import { UserContext } from '@/lib/ai/honest-mirror/types';

export async function chatWithAgent(
  message: string,
  conversationId?: string
): Promise<{ success: boolean; data?: { response: string; conversationId: string }; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  const user = await currentUser();
  const userName = user?.firstName || 'there';

  const supabase = createAdminClient();
  const agent = new HonestMirror();

  // Load or create conversation
  let conversation;
  if (conversationId) {
    const { data } = await supabase
      .from('agent_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();
    conversation = data;
  }

  const history = conversation?.messages || [];

  // Override loadUserContext with actual data
  const context = await loadFullContext(userId);

  const response = await agent.respond(userId, userName, message, history);

  // Save conversation
  const newMessages = [...history, { role: 'user', content: message }, { role: 'assistant', content: response }];

  if (conversationId && conversation) {
    await supabase
      .from('agent_conversations')
      .update({ messages: newMessages, updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } else {
    const { data: newConv } = await supabase
      .from('agent_conversations')
      .insert({ user_id: userId, messages: newMessages })
      .select()
      .single();
    conversationId = newConv?.id;
  }

  return { success: true, data: { response, conversationId: conversationId! } };
}

export async function getMyInterventions(): Promise<{ success: boolean; data: any[] }> {
  const { userId } = await auth();
  if (!userId) return { success: false, data: [] };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('agent_interventions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return { success: true, data: data || [] };
}

export async function respondToIntervention(
  interventionId: string,
  response: string
): Promise<{ success: boolean }> {
  const { userId } = await auth();
  if (!userId) return { success: false };

  const supabase = createAdminClient();
  await supabase
    .from('agent_interventions')
    .update({ status: 'responded', response, responded_at: new Date().toISOString() })
    .eq('id', interventionId)
    .eq('user_id', userId);

  return { success: true };
}

export async function markCommitmentComplete(
  commitmentId: string
): Promise<{ success: boolean }> {
  const { userId } = await auth();
  if (!userId) return { success: false };

  const supabase = createAdminClient();
  await supabase
    .from('agent_commitments')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', commitmentId)
    .eq('user_id', userId);

  return { success: true };
}

async function loadFullContext(userId: string): Promise<UserContext> {
  const supabase = createAdminClient();

  const behavior = await calculateBehaviorMetrics(userId);

  const { data: recentIdeas } = await supabase
    .from('notes')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: commitments } = await supabase
    .from('agent_commitments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: keyMoments } = await supabase
    .from('agent_key_moments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  const { data: themes } = await supabase
    .from('themes')
    .select('name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    user_id: userId,
    behavior,
    recent_ideas: (recentIdeas || []).map(i => ({
      id: i.id,
      title: i.title || 'Untitled',
      created_at: new Date(i.created_at),
    })),
    commitments: (commitments || []).map(c => ({
      id: c.id,
      idea_id: c.idea_id,
      commitment: c.commitment,
      deadline: c.deadline ? new Date(c.deadline) : null,
      status: c.status,
    })),
    key_moments: (keyMoments || []).map(m => ({
      date: new Date(m.created_at),
      insight: m.insight,
      category: m.category,
    })),
    themes: (themes || []).map(t => t.name),
  };
}
```

---

## Cron Job (Daily Interventions)

```typescript
// src/app/api/cron/agent-interventions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/client';
import { HonestMirror } from '@/lib/ai/honest-mirror/agent';
import { INTERVENTION_TRIGGERS } from '@/lib/ai/honest-mirror/triggers';
import { calculateBehaviorMetrics } from '@/lib/ai/honest-mirror/metrics';

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Get all active users (had activity in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: users } = await supabase
    .from('users')
    .select('clerk_id')
    .gte('updated_at', thirtyDaysAgo);

  let checked = 0;
  let interventions = 0;

  for (const user of users || []) {
    const agent = new HonestMirror();

    try {
      // Load context for this user
      const behavior = await calculateBehaviorMetrics(user.clerk_id);

      const { data: commitments } = await supabase
        .from('agent_commitments')
        .select('*')
        .eq('user_id', user.clerk_id)
        .eq('status', 'pending');

      const { data: recentIdeas } = await supabase
        .from('notes')
        .select('id, title, created_at')
        .eq('user_id', user.clerk_id)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: keyMoments } = await supabase
        .from('agent_key_moments')
        .select('*')
        .eq('user_id', user.clerk_id)
        .limit(20);

      const { data: themes } = await supabase
        .from('themes')
        .select('name')
        .eq('user_id', user.clerk_id);

      const context = {
        user_id: user.clerk_id,
        behavior,
        recent_ideas: (recentIdeas || []).map(i => ({ id: i.id, title: i.title || 'Untitled', created_at: new Date(i.created_at) })),
        commitments: (commitments || []).map(c => ({ id: c.id, idea_id: c.idea_id, commitment: c.commitment, deadline: c.deadline ? new Date(c.deadline) : null, status: c.status })),
        key_moments: (keyMoments || []).map(m => ({ date: new Date(m.created_at), insight: m.insight, category: m.category })),
        themes: (themes || []).map(t => t.name),
      };

      // Check each trigger
      for (const [triggerName, trigger] of Object.entries(INTERVENTION_TRIGGERS)) {
        if (trigger.condition(context)) {
          const message = trigger.message(context);

          // Don't duplicate -- check if same trigger fired recently
          const { data: existing } = await supabase
            .from('agent_interventions')
            .select('id')
            .eq('user_id', user.clerk_id)
            .eq('trigger_type', triggerName)
            .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
            .limit(1);

          if (!existing || existing.length === 0) {
            await supabase.from('agent_interventions').insert({
              user_id: user.clerk_id,
              trigger_type: triggerName,
              message,
              status: 'pending',
            });
            interventions++;
          }
        }
      }

      // Update behavior metrics
      await supabase
        .from('agent_behavior_metrics')
        .upsert({
          user_id: user.clerk_id,
          ...behavior,
          updated_at: new Date().toISOString(),
        });

      checked++;
    } catch (error) {
      console.error(`Error checking user ${user.clerk_id}:`, error);
    }
  }

  return NextResponse.json({ checked, interventions });
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/agent-interventions",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## Agent Chat UI

```typescript
// src/components/agent-chat.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { chatWithAgent } from '@/actions/agent.actions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AgentChat(): React.ReactElement {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(): Promise<void> {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    const result = await chatWithAgent(userMessage, conversationId);

    if (result.success && result.data) {
      setMessages(prev => [...prev, { role: 'assistant', content: result.data!.response }]);
      setConversationId(result.data.conversationId);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }]);
    }

    setLoading(false);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-neutral-800 p-4">
        <h2 className="text-lg font-semibold text-white">The Honest Mirror</h2>
        <p className="text-sm text-neutral-400">Your accountability partner. No BS.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-neutral-500 mt-20">
            <p className="text-lg font-medium">I've been watching your ideas.</p>
            <p className="text-sm mt-2">Tell me what you're working on. I'll be honest.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-amber-600 text-white'
                  : 'bg-neutral-800 text-neutral-100'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neutral-800 rounded-lg p-3">
              <p className="text-sm text-neutral-400 animate-pulse">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-neutral-800 p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Talk to The Honest Mirror..."
            className="flex-1 resize-none bg-neutral-900 border-neutral-700 text-white"
            rows={2}
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-amber-600 hover:bg-amber-500 text-white"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Agent Sidebar (Intervention Notifications)

```typescript
// src/components/agent-sidebar.tsx

'use client';

import { useEffect, useState } from 'react';
import { getMyInterventions, respondToIntervention } from '@/actions/agent.actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Intervention {
  id: string;
  trigger_type: string;
  message: string;
  created_at: string;
}

export function AgentSidebar(): React.ReactElement {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterventions();
  }, []);

  async function loadInterventions(): Promise<void> {
    const result = await getMyInterventions();
    if (result.success) {
      setInterventions(result.data);
    }
    setLoading(false);
  }

  async function handleDismiss(interventionId: string): Promise<void> {
    await respondToIntervention(interventionId, 'Dismissed');
    setInterventions(prev => prev.filter(i => i.id !== interventionId));
  }

  if (loading || interventions.length === 0) return <></>;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg p-4 space-y-3 z-50">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-amber-500 text-sm">The Honest Mirror</h3>
        <span className="text-xs text-neutral-500">
          {interventions.length} nudge{interventions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {interventions.slice(0, 2).map((intervention) => (
        <div key={intervention.id} className="bg-neutral-800 rounded p-3 space-y-2">
          <p className="text-sm text-neutral-200">{intervention.message}</p>
          <div className="flex gap-2">
            <Link href="/dashboard/agent">
              <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white text-xs">
                Respond
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-neutral-400"
              onClick={() => handleDismiss(intervention.id)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Agent Page

```typescript
// src/app/dashboard/agent/page.tsx

import { AgentChat } from '@/components/agent-chat';

export default function AgentPage(): React.ReactElement {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <AgentChat />
    </div>
  );
}
```

---

## Environment Variables

Add to `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
CRON_SECRET=your-random-secret-here
```

---

## Implementation Checklist

- [ ] Run database migration (6 tables + RLS)
- [ ] Create src/lib/ai/honest-mirror/ directory with all files
- [ ] Create src/actions/agent.actions.ts
- [ ] Create src/app/api/cron/agent-interventions/route.ts
- [ ] Create src/components/agent-chat.tsx
- [ ] Create src/components/agent-sidebar.tsx
- [ ] Create src/app/dashboard/agent/page.tsx
- [ ] Add agent link to sidebar navigation
- [ ] Add AgentSidebar to dashboard layout
- [ ] Add vercel.json cron config
- [ ] Add CRON_SECRET to environment variables
- [ ] Test: have a conversation, make a commitment, verify it saves
- [ ] Test: trigger an intervention manually
- [ ] Update CHANGELOG.md, ROADMAP.md, ARCHITECTURE.md, API.md

---

## Success Metrics

After implementation, verify:
- Agent chat works and responds in character
- Commitments extracted from conversations
- Key moments saved to database
- Interventions trigger correctly (test by adjusting thresholds)
- Sidebar shows pending interventions
- Behavior metrics calculate accurately
- Cron job runs daily (check Vercel logs)

---

## Documentation Updates

**ARCHITECTURE.md:**
```markdown
## The Honest Mirror (AI Agent)

Proactive AI agent that tracks behavioral patterns and holds users accountable.

**Data flow:**
1. User chats with agent -> conversation stored in agent_conversations
2. Commitments extracted via Claude -> stored in agent_commitments
3. Key moments extracted -> stored in agent_key_moments
4. Daily cron checks triggers -> creates agent_interventions
5. Behavior metrics updated daily -> agent_behavior_metrics
```

**API.md:**
```markdown
## Agent Actions

### chatWithAgent(message, conversationId?)
Chat with The Honest Mirror agent.

### getMyInterventions()
Fetch pending proactive interventions.

### respondToIntervention(interventionId, response)
Respond to or dismiss an intervention.

### markCommitmentComplete(commitmentId)
Mark a commitment as completed.
```
