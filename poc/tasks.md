# Pain Radar - Implementation Tasks

## Overview

This document outlines the step-by-step implementation tasks for the Pain Radar POC, organized by epics. Each task is designed to be completed sequentially with clear deliverables.

---

## Epic 1: Project Foundation

### Task 1.1: Initialize Next.js Project (DONE)

**Step 1: Create Next.js project with TypeScript and Tailwind**

```bash
npx create-next-app@latest pain-radar --typescript --tailwind --app --no-src-dir
cd pain-radar
```

When prompted:

- Would you like to use ESLint? → Yes
- Would you like to use `src/` directory? → No (already specified)
- Would you like to use App Router? → Yes (already specified)
- Would you like to customize the default import alias? → No

**Step 2: Install and initialize shadcn/ui**

```bash
npx shadcn-ui@latest init
```

When prompted:

- Would you like to use TypeScript? → Yes
- Which style would you like to use? → Default
- Which color would you like to use as base color? → Slate
- Where is your global CSS file? → app/globals.css
- Would you like to use CSS variables for colors? → Yes
- Where is your tailwind.config.js located? → tailwind.config.ts
- Configure the import alias for components? → components
- Configure the import alias for utils? → lib/utils

**Step 3: Create folder structure**

```bash
# Create all necessary directories
mkdir -p app/\(marketing\) app/\(auth\)/login app/\(auth\)/signup
mkdir -p app/\(dashboard\)/dashboard app/\(dashboard\)/settings
mkdir -p app/api/ideas app/api/subscriptions app/api/cron/generate app/api/cron/email
mkdir -p components lib services agents types config
mkdir -p lib/supabase lib/reddit lib/email

# Create route group layout files
touch app/\(marketing\)/layout.tsx
touch app/\(auth\)/layout.tsx
touch app/\(dashboard\)/layout.tsx
```

### Task 1.2: Install Core Dependencies (DONE)

**Note**: Install all packages without specifying versions to get the latest stable releases.

**Database & Auth:**

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
```

**AI/LLM Integration:**

```bash
npm install openai @langchain/langgraph @langchain/core
```

**Email Service:**

```bash
npm install resend @react-email/components @react-email/render
```

**Form & Validation:**

```bash
npm install zod react-hook-form @hookform/resolvers
```

**Data Fetching:**

```bash
npm install @tanstack/react-query
```

**Reddit API:**

```bash
npm install axios
npm install -D @types/axios
```

**Additional Utilities:**

```bash
npm install date-fns nanoid
```

**Development Dependencies:**

```bash
npm install -D @types/node
```

### Task 1.3: Environment Configuration (PARTIALLY DONE, CREATED .env and .env.example)

- Create `.env.local` file
- Set up environment variable types
- Create configuration module

```typescript
// pseudocode - config/env.ts
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY!,
  },
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    userAgent: process.env.REDDIT_USER_AGENT!,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
  },
};
```

### Task 1.4: Set Up Type Definitions (DONE)

**Create type definition files:**

```typescript
// pseudocode - types/database.ts
export interface ProductIdea {
  id: string;
  name: string;
  pitch: string;
  painPoint: string;
  targetAudience: string;
  score: number;
  sources: string[];
  category: string;
  createdAt: Date;
  isNew: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  email: string;
  topics: string[];
  isActive: boolean;
  unsubscribeToken: string;
  createdAt: Date;
  lastEmailSent: Date | null;
}

export interface RedditSource {
  id: string;
  subreddit: string;
  lastChecked: Date | null;
  isActive: boolean;
  subscriberCount: number;
}

export interface EmailLog {
  id: string;
  subscriptionId: string;
  sentAt: Date;
  status: "sent" | "failed" | "pending";
  ideasSent: number;
}
```

```typescript
// pseudocode - types/reddit.ts
export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  content: string;
  url: string;
  score: number;
  numComments: number;
  created: Date;
}

export interface RedditComment {
  id: string;
  body: string;
  score: number;
  author: string;
}
```

```typescript
// pseudocode - types/workflow.ts
export interface WorkflowState {
  workflowId: string;
  currentStep:
    | "fetching"
    | "extracting"
    | "generating"
    | "scoring"
    | "complete";
  redditPosts: RedditPost[];
  painPoints: PainPoint[];
  ideas: ProductIdea[];
  errors: string[];
}

export interface PainPoint {
  description: string;
  severity: "low" | "medium" | "high";
  source: string;
  examples: string[];
}
```

```typescript
// pseudocode - types/index.ts
// Re-export all types for convenient importing
export * from "./database";
export * from "./reddit";
export * from "./workflow";
```

---

## Epic 2: Supabase Setup

### Task 2.1: Initialize Supabase Project (DONE)

**Step 1: Create Supabase Account and Project**

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New project"
4. Fill in project details:
   - Project name: `pain-radar`
   - Database password: Generate a strong password and save it securely
   - Region: Choose closest to your location
   - Pricing plan: Free tier is sufficient for POC

**Step 2: Configure Authentication**

1. Once project is created, go to Authentication → Providers
2. Ensure "Email" provider is enabled (should be by default)
3. Go to Authentication → Email Templates
4. For POC, disable email confirmation:
   - Go to Authentication → Settings
   - Under "Email Auth" section:
     - Toggle OFF "Enable email confirmations"
     - Set "Minimum password length" to 6 (for easier testing)

**Step 3: Get Project Credentials**

1. Go to Settings → API
2. Copy the following values for your `.env.local`:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_KEY` (keep this secret!)

**Step 4: Configure Auth Settings for POC**

1. Go to Authentication → URL Configuration
2. Set Site URL to: `http://localhost:3000`
3. Add to Redirect URLs:
   - `http://localhost:3000`
   - `http://localhost:3000/dashboard`
   - `http://localhost:3000/auth/callback`

### Task 2.2: Create Database Schema (DONE)

**Navigate to SQL Editor in Supabase Dashboard and create the following tables:**

**Table 1: `ideas`**

- `id` - UUID (Primary Key, auto-generate)
- `created_at` - TIMESTAMPTZ (default: now())
- `updated_at` - TIMESTAMPTZ (default: now())
- `name` - VARCHAR(200) (required)
- `pitch` - TEXT (required)
- `pain_point` - TEXT (required)
- `target_audience` - VARCHAR(200)
- `sources` - JSONB (default: '[]') - Array of {subreddit, post_url, post_title}
- `score` - INTEGER (0-100)
- `category` - VARCHAR(50)
- `is_new` - BOOLEAN (default: true)
- `view_count` - INTEGER (default: 0)

**Table 2: `subscriptions`**

- `id` - UUID (Primary Key, auto-generate)
- `user_id` - UUID (Foreign Key to auth.users, cascade delete)
- `email` - VARCHAR(255) (required)
- `topics` - TEXT[] (default: '{}') - Array of topic strings
- `is_active` - BOOLEAN (default: true)
- `unsubscribe_token` - VARCHAR(255) (unique)
- `created_at` - TIMESTAMPTZ (default: now())
- `last_email_sent` - TIMESTAMPTZ (nullable)

**Table 3: `reddit_sources`**

- `id` - UUID (Primary Key, auto-generate)
- `subreddit` - VARCHAR(100) (unique, required)
- `last_checked` - TIMESTAMPTZ (nullable)
- `is_active` - BOOLEAN (default: true)
- `subscriber_count` - INTEGER
- `created_at` - TIMESTAMPTZ (default: now())

**Table 4: `email_logs`**

- `id` - UUID (Primary Key, auto-generate)
- `subscription_id` - UUID (Foreign Key to subscriptions)
- `sent_at` - TIMESTAMPTZ (default: now())
- `status` - VARCHAR(50) - Values: 'sent', 'failed', 'pending'
- `ideas_sent` - INTEGER

**Initial Data: Insert default subreddits**
After creating tables, insert initial subreddits:

- r/startups
- r/SaaS
- r/Entrepreneur
- r/smallbusiness
- r/webdev

### Task 2.3: Generate TypeScript Types from Supabase (DONE)

**Install Supabase CLI and generate types:**

```bash
# Install Supabase CLI globally (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in project (creates supabase directory)
supabase init

# Link to your remote project (you'll need project ref from dashboard)
supabase link --project-ref <your-project-ref>

# Generate TypeScript types
supabase gen types typescript --linked > types/supabase.ts
```

**Note:** Your project reference can be found in Supabase Dashboard → Settings → General → Reference ID

**The generated file will include:**

- Database table types
- View types
- Function types
- Enum types
- Composite types

### Task 2.4: Set Up Supabase Client (DONE)

**Step 1: Create browser client for client-side usage**

```typescript
// pseudocode - lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/types/supabase";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Step 2: Create server client for server components**

```typescript
// pseudocode - lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/types/supabase";

export async function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
```

**Step 3: Create admin client for server-side operations**

```typescript
// pseudocode - lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### Task 2.5: Implement Auth Utilities (DONE)

**Step 1: Create auth actions for server components**

```typescript
// pseudocode - lib/auth/actions.ts
"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signIn(email: string, password: string) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signUp(email: string, password: string) {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
```

**Step 2: Create auth hooks for client components**

```typescript
// pseudocode - hooks/use-auth.ts
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

**Step 3: Create middleware for protected routes**

```typescript
// pseudocode - middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

## Epic 3: Authentication Flow

### Task 3.1: Create Auth Pages (DONE)

- Build login page with form
- Create signup page
- Add password reset flow (basic)

```tsx
// pseudocode - app/(auth)/login/page.tsx
export default function LoginPage() {
  const form = useForm<LoginSchema>();

  const onSubmit = async (data) => {
    await supabase.auth.signInWithPassword(data);
  };

  return <AuthForm onSubmit={onSubmit} />;
}
```

### Task 3.2: Implement Auth Forms (DONE)

- Create reusable auth form component
- Add form validation with Zod
- Implement error handling

### Task 3.3: Build Auth Navigation (DONE)

- Add login/logout buttons
- Create user menu dropdown
- Handle auth state changes

### Task 3.4: Set Up Protected Routes (DONE)

- Create middleware for dashboard routes
- Implement redirect logic
- Handle loading states

---

## Epic 4: Reddit Integration (Backend Service) (DONE)

**Note:** This is for backend API access only. Users authenticate only through Supabase.

### Task 4.1: Set Up Reddit API Service Authentication (DONE)

**Step 1: Create Reddit App for Backend Data Fetching**

1. Go to [https://www.reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
2. Click "Create App" or "Create Another App"
3. Fill in the form:
   - Name: `Pain Radar Bot`
   - App type: Select "script" (for personal use/backend)
   - Description: `Bot for analyzing Reddit posts`
   - About URL: Leave blank
   - Redirect URI: `http://localhost:3000/auth/reddit/callback`
4. Click "Create app"
5. Save the credentials:
   - Client ID: (shown under "personal use script")
   - Client Secret: (shown as "secret")

**Step 2: Configure Axios-based Reddit client for backend use**

```typescript
// pseudocode - lib/reddit/client.ts
import axios, { AxiosInstance } from "axios";

// This client is used by our backend service to fetch Reddit data
// It does NOT handle user authentication (that's done via Supabase)
export class RedditAPIClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.client = axios.create({
      baseURL: "https://oauth.reddit.com",
      headers: {
        "User-Agent": process.env.REDDIT_USER_AGENT!,
      },
      timeout: 10000, // 10 second timeout
    });
  }

  private async authenticate(): Promise<void> {
    const auth = Buffer.from(
      `${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`
    ).toString("base64");

    const { data } = await axios.post(
      "https://www.reddit.com/api/v1/access_token",
      new URLSearchParams({
        grant_type: "password",
        username: process.env.REDDIT_USERNAME!, // Bot account
        password: process.env.REDDIT_PASSWORD!, // Bot account
      }),
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "User-Agent": process.env.REDDIT_USER_AGENT!,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000 - 60000; // 1 min buffer
    this.client.defaults.headers.common["Authorization"] =
      `Bearer ${data.access_token}`;
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
  }
}
```

**Step 3: Add Reddit API methods to the client**

```typescript
// pseudocode - lib/reddit/client.ts (continued)
export class RedditAPIClient {
  // ... previous code ...

  async fetchSubredditPosts(
    subreddit: string,
    limit = 25
  ): Promise<RedditPost[]> {
    await this.ensureAuthenticated();

    try {
      const { data } = await this.client.get(`/r/${subreddit}/hot`, {
        params: { limit },
      });

      return data.data.children.map((post: any) => ({
        id: post.data.id,
        subreddit: post.data.subreddit,
        title: post.data.title,
        content: post.data.selftext,
        url: `https://reddit.com${post.data.permalink}`,
        score: post.data.score,
        numComments: post.data.num_comments,
        created: new Date(post.data.created_utc * 1000),
      }));
    } catch (error) {
      console.error(`Failed to fetch posts from r/${subreddit}:`, error);
      throw new Error(`Reddit API error: ${error.message}`);
    }
  }

  async fetchPostComments(
    postId: string,
    limit = 50
  ): Promise<RedditComment[]> {
    await this.ensureAuthenticated();

    try {
      const { data } = await this.client.get(`/comments/${postId}`, {
        params: { limit, depth: 1 },
      });

      const comments = data[1]?.data?.children || [];

      return comments
        .filter((comment: any) => comment.data.score > 5) // High-quality comments
        .map((comment: any) => ({
          id: comment.data.id,
          body: comment.data.body,
          score: comment.data.score,
          author: comment.data.author,
        }));
    } catch (error) {
      console.error(`Failed to fetch comments for post ${postId}:`, error);
      throw new Error(`Reddit API error: ${error.message}`);
    }
  }

  async fetchMultipleSubreddits(subreddits: string[]): Promise<RedditPost[]> {
    const allPosts = await Promise.allSettled(
      subreddits.map((subreddit) => this.fetchSubredditPosts(subreddit))
    );

    return allPosts
      .filter(
        (result): result is PromiseFulfilledResult<RedditPost[]> =>
          result.status === "fulfilled"
      )
      .flatMap((result) => result.value)
      .sort((a, b) => b.score - a.score); // Sort by score descending
  }
}
```

**Step 4: Create Reddit service wrapper**

```typescript
// pseudocode - services/reddit.ts
import { RedditAPIClient } from "@/lib/reddit/client";
import type { RedditPost, RedditComment } from "@/types/reddit";

export class RedditService {
  private client: RedditAPIClient;

  constructor() {
    this.client = new RedditAPIClient();
  }

  async fetchTrendingPosts(subreddit: string): Promise<RedditPost[]> {
    return this.client.fetchSubredditPosts(subreddit);
  }

  async fetchPostComments(postId: string): Promise<RedditComment[]> {
    return this.client.fetchPostComments(postId);
  }

  async fetchFromMultipleSubreddits(
    subreddits: string[]
  ): Promise<RedditPost[]> {
    return this.client.fetchMultipleSubreddits(subreddits);
  }
}
```

**Step 5: Add Reddit API credentials to .env.local**

```bash
# Reddit API credentials (for backend data fetching only)
# This is NOT for user authentication - users only use Supabase Auth
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT="PainRadar:v1.0.0 (by /u/your_bot_username)"
REDDIT_USERNAME=your_reddit_bot_username  # Bot account for API access
REDDIT_PASSWORD=your_reddit_bot_password  # Bot account password
```

### Task 4.2: Build Data Fetching Logic (DONE)

- Create function to fetch posts from multiple subreddits
- Extract comments with high engagement
- Format data for AI processing

### Task 4.3: Implement Caching Layer (DONE)

- Cache Reddit data in memory
- Add 6-hour expiration
- Create cache invalidation logic

### Task 4.4: Add Rate Limiting (DONE)

- Implement simple delay between requests
- Handle rate limit errors
- Add retry logic

---

## Epic 5: AI Agent Pipeline

**Epic Status:** 🎉 **100% COMPLETE** - All 12 tasks completed, full agent pipeline operational!

**Completed Tasks (12/12):**

- ✅ Task 5.1: Set Up LangGraph Workflow
- ✅ Task 5.2: Implement Supervisor Agent
- ✅ Task 5.3: Build Pain Extractor Agent
- ✅ Task 5.4: Create Idea Generator Agent
- ✅ Task 5.5: Implement Scoring Agent
- ✅ Task 5.6: Connect Workflow Pipeline
- ✅ Task 5.7: Enhance Pain Extractor Agent Output
- ✅ Task 5.8: Enhance Idea Generator Agent Output
- ✅ Task 5.9: Enhance Scoring Agent to Use Tool Results
- ✅ Task 5.10: Implement Hybrid Data Extraction Strategy
- ✅ Task 5.11: Add Comprehensive Agent Output Validation
- ✅ Task 5.12: Fix Agent Workflow Performance and Execution

**Key Achievements:**

- ✅ All agents successfully call tools and generate creative, detailed outputs
- ✅ Workflow completes in 2-3 minutes without timeouts
- ✅ Pain points are specific and actionable with real examples
- ✅ Product ideas are creative with unique names, detailed pitches, and specific target audiences
- ✅ Robust extraction handles partial JSON and multiple message types
- ✅ **NEW:** Scorer extracts agent's structured scoring synthesis (not just hardcoded fallback)
- ✅ **NEW:** Comprehensive validation for all outputs (pain points, ideas, scores) with logging

---

### Task 5.1: Set Up LangGraph Workflow (DONE)

- Initialize StateGraph
- Define workflow state interface
- Configure agent nodes

```typescript
// pseudocode - agents/workflow.ts
import { StateGraph } from "@langchain/langgraph";

const workflow = new StateGraph<WorkflowState>({
  channels: {
    workflowId: null,
    currentStep: null,
    redditPosts: [],
    painPoints: [],
    ideas: [],
    errors: [],
  },
});
```

### Task 5.2: Implement Supervisor Agent (DONE)

**Create the main orchestrator that manages the workflow:**

```typescript
// pseudocode - agents/supervisor.ts
import { WorkflowState } from "@/types/workflow";

export async function supervisorAgent(
  state: WorkflowState
): Promise<WorkflowState> {
  console.log(`[Supervisor] Starting workflow ${state.workflowId}`);

  // Initialize state if this is the first run
  if (!state.workflowId) {
    state = {
      ...state,
      workflowId: generateWorkflowId(),
      currentStep: "fetching",
      errors: [],
    };
  }

  // Validate we have Reddit data to process
  if (!state.redditPosts || state.redditPosts.length === 0) {
    console.error("[Supervisor] No Reddit posts to process");
    return {
      ...state,
      currentStep: "complete",
      errors: [...state.errors, "No Reddit data available"],
    };
  }

  console.log(`[Supervisor] Processing ${state.redditPosts.length} posts`);
  console.log(`[Supervisor] Moving to step: ${state.currentStep}`);

  // The workflow will automatically proceed to the next agent
  return {
    ...state,
    currentStep: "extracting",
  };
}

// Helper function
function generateWorkflowId(): string {
  return `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

**Key responsibilities:**

- Initialize workflow with unique ID
- Validate input data exists
- Set initial workflow state
- Handle error cases gracefully
- Log progress for debugging
- Prepare state for next agent

### Task 5.3: Build Pain Extractor Agent (DONE)

- ✅ Create GPT-5-mini prompt for pain extraction
- ✅ Parse Reddit content
- ✅ Extract and categorize pain points

```typescript
// pseudocode - agents/painExtractor.ts
async function painExtractorAgent(state: WorkflowState) {
  const prompt = `
    Extract user pain points from these Reddit posts.
    Focus on: complaints, frustrations, wishes, problems.
    
    Posts: ${JSON.stringify(state.redditPosts)}
    
    Return JSON array with severity levels.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return { ...state, painPoints: response.data };
}
```

### Task 5.4: Create Idea Generator Agent (DONE)

**Transform pain points into product ideas:**

```typescript
// pseudocode - agents/ideaGenerator.ts
import { WorkflowState, PainPoint, ProductIdea } from "@/types/workflow";
import { openai } from "@/lib/openai";

export async function ideaGeneratorAgent(
  state: WorkflowState
): Promise<WorkflowState> {
  const { painPoints } = state;

  if (!painPoints || painPoints.length === 0) {
    return {
      ...state,
      currentStep: "complete",
      errors: [...state.errors, "No pain points to process"],
    };
  }

  const prompt = `
    You are a startup idea generator. Based on these user pain points from Reddit, 
    generate innovative product ideas.
    
    Pain Points:
    ${painPoints.map((p) => `- ${p.description} (severity: ${p.severity})`).join("\n")}
    
    For each pain point, generate a product idea with:
    1. A catchy product name
    2. A 1-2 sentence pitch explaining what it does
    3. The specific pain point it addresses
    4. Target audience
    
    Return as JSON array with this structure:
    [{
      "name": "Product Name",
      "pitch": "One line description of what it does",
      "painPoint": "The specific problem it solves",
      "targetAudience": "Who would use this"
    }]
    
    Generate 2-3 ideas per pain point. Be creative but realistic.
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const ideas = JSON.parse(response.choices[0].message.content || "[]");

  // Add sources from pain points
  const enrichedIdeas: ProductIdea[] = ideas.map((idea: any) => {
    const relatedPainPoint = painPoints.find((p) =>
      idea.painPoint.includes(p.description.substring(0, 50))
    );

    return {
      ...idea,
      sources: relatedPainPoint?.examples || [],
      score: 0, // Will be set by scoring agent
    };
  });

  return {
    ...state,
    ideas: enrichedIdeas,
    currentStep: "scoring",
  };
}
```

### Task 5.5: Implement Scoring Agent (DONE)

**Evaluate each idea's potential:**

```typescript
// pseudocode - agents/scorer.ts
import { WorkflowState, ProductIdea } from "@/types/workflow";
import { openai } from "@/lib/openai";

export async function scoringAgent(
  state: WorkflowState
): Promise<WorkflowState> {
  const { ideas } = state;

  if (!ideas || ideas.length === 0) {
    return {
      ...state,
      currentStep: "complete",
      errors: [...state.errors, "No ideas to score"],
    };
  }

  // Score each idea individually
  const scoredIdeas = await Promise.all(
    ideas.map(async (idea) => {
      const prompt = `
        Evaluate this product idea on a scale of 0-100 based on these criteria:
        
        Product Idea:
        - Name: ${idea.name}
        - Pitch: ${idea.pitch}
        - Pain Point: ${idea.painPoint}
        - Target Audience: ${idea.targetAudience}
        
        Scoring Criteria:
        1. Pain Severity (0-30): How significant is the problem?
        2. Market Size (0-25): How many people have this problem?
        3. Competition (0-20): Is the market oversaturated? (higher = less competition)
        4. Feasibility (0-15): How realistic is it to build?
        5. Engagement (0-10): How engaged were Reddit users about this problem?
        
        Return ONLY a JSON object with this structure:
        {
          "painSeverity": 0-30,
          "marketSize": 0-25,
          "competition": 0-20,
          "feasibility": 0-15,
          "engagement": 0-10,
          "total": sum of all scores,
          "reasoning": "Brief explanation of the score"
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const scores = JSON.parse(response.choices[0].message.content || "{}");

      return {
        ...idea,
        score: scores.total || 0,
        scoreDetails: scores,
      };
    })
  );

  // Sort by score (highest first)
  scoredIdeas.sort((a, b) => b.score - a.score);

  console.log(`[Scorer] Scored ${scoredIdeas.length} ideas`);
  console.log(
    `[Scorer] Top idea: ${scoredIdeas[0].name} (score: ${scoredIdeas[0].score})`
  );

  return {
    ...state,
    ideas: scoredIdeas,
    currentStep: "complete",
  };
}
```

### Task 5.6: Connect Workflow Pipeline (DONE)

**Wire up the complete LangGraph workflow:**

```typescript
// pseudocode - agents/workflow.ts
import { StateGraph, END } from "@langchain/langgraph";
import { WorkflowState } from "@/types/workflow";
import { supervisorAgent } from "./supervisor";
import { painExtractorAgent } from "./painExtractor";
import { ideaGeneratorAgent } from "./ideaGenerator";
import { scoringAgent } from "./scorer";

export function createWorkflow() {
  // Initialize the workflow
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      workflowId: null,
      currentStep: null,
      redditPosts: [],
      painPoints: [],
      ideas: [],
      errors: [],
    },
  });

  // Add all agent nodes
  workflow.addNode("supervisor", supervisorAgent);
  workflow.addNode("pain_extractor", painExtractorAgent);
  workflow.addNode("idea_generator", ideaGeneratorAgent);
  workflow.addNode("scorer", scoringAgent);

  // Define the flow
  workflow.setEntryPoint("supervisor");
  workflow.addEdge("supervisor", "pain_extractor");
  workflow.addEdge("pain_extractor", "idea_generator");
  workflow.addEdge("idea_generator", "scorer");
  workflow.addEdge("scorer", END);

  // Compile the workflow
  return workflow.compile();
}

// Usage example
export async function runIdeaGeneration(redditPosts: RedditPost[]) {
  const workflow = createWorkflow();

  try {
    // Initialize state with Reddit data
    const initialState: WorkflowState = {
      workflowId: "",
      currentStep: "fetching",
      redditPosts,
      painPoints: [],
      ideas: [],
      errors: [],
    };

    // Run the workflow
    const result = await workflow.invoke(initialState);

    // Check for errors
    if (result.errors.length > 0) {
      console.error("Workflow errors:", result.errors);
    }

    // Return the generated ideas
    return {
      success: result.errors.length === 0,
      ideas: result.ideas,
      errors: result.errors,
    };
  } catch (error) {
    console.error("Workflow failed:", error);
    return {
      success: false,
      ideas: [],
      errors: [error.message],
    };
  }
}
```

**Test the workflow:**

```typescript
// pseudocode - agents/workflow.test.ts
import { runIdeaGeneration } from "./workflow";
import { RedditService } from "@/services/reddit";

async function testWorkflow() {
  // Fetch test data
  const reddit = new RedditService();
  const posts = await reddit.fetchTrendingPosts("startups");

  // Run the workflow
  const result = await runIdeaGeneration(posts);

  // Log results
  console.log("Generated ideas:", result.ideas.length);
  console.log("Top 3 ideas:");
  result.ideas.slice(0, 3).forEach((idea, i) => {
    console.log(`${i + 1}. ${idea.name} (Score: ${idea.score})`);
    console.log(`   ${idea.pitch}`);
  });
}
```

---

### Task 5.7: Enhance Pain Extractor Agent Output (DONE)

**Status:** ✅ Completed - Pain Extractor now successfully extracts detailed pain points from agent synthesis.

**What was achieved:**

- Implemented hybrid extraction strategy (Strategy 1a: ideal message, Strategy 1b: partial JSON in message with tool_calls)
- Agent now analyzes ALL posts before synthesis (with explicit checklist and counting instructions)
- Extracts from agent's creative synthesis, not just tool call arguments
- Pain points are detailed with specific examples, confidence scores, and proper categorization

**Current Issue (resolved):** Pain points were using Reddit post titles instead of extracting actual underlying problems.

**Goal (achieved):** Extract structured, analytical pain points from agent's reasoning after tool calls.

**What we have:**

```json
{
  "description": "Share your startup - quarterly post"
}
```

**What we need:**

```json
{
  "description": "Founders lack regular, high-visibility channels to promote their startups to relevant audiences",
  "category": "marketing",
  "severity": "medium"
}
```

**Implementation Steps:**

**Step 1: Update Pain Extractor prompt to require structured final output**

After the agent calls tools, it must synthesize findings into structured JSON:

```typescript
// agents/workflow.ts - painExtractorNode
const prompt = `You have ${state.redditPosts.length} Reddit posts to analyze.

WORKFLOW:
1. For EACH post, call analyze_pain_severity tool to get objective metrics
2. After analyzing ALL posts, synthesize your findings into structured JSON

Here are the posts:
${postsContext}

REQUIRED STEPS:
Step 1: Call analyze_pain_severity for each post
Step 2: After all tool calls, return ONLY this JSON structure:

{
  "painPoints": [
    {
      "description": "Clear problem statement (NOT the post title)",
      "category": "hiring|marketing|technical|productivity|financial|other",
      "severity": "low|medium|high",
      "evidence": ["Direct quote 1", "Direct quote 2"],
      "confidence": 0.0-1.0
    }
  ]
}

CRITICAL RULES:
- description must be the UNDERLYING PROBLEM, not the post title
- category must match the problem domain
- evidence must be direct quotes showing the pain
- Only include pain points with confidence >= 0.6`;
```

**Step 2: Extract both tool results AND agent's final synthesis**

````typescript
// Extract tool metrics for validation
const toolMessages = result.messages.filter(
  (msg: any) => msg._getType() === "tool"
);

// Extract agent's final structured output
const finalAIMessage = result.messages
  .slice()
  .reverse()
  .find((msg: any) => msg._getType() === "ai" && !msg.tool_calls);

if (!finalAIMessage) {
  throw new Error("Agent did not provide final synthesis");
}

// Parse the agent's structured output
let painPointsData;
try {
  painPointsData = JSON.parse(finalAIMessage.content);
} catch {
  // Try markdown extraction
  const jsonMatch = finalAIMessage.content.match(
    /```(?:json)?\s*(\{[\s\S]*\})\s*```/
  );
  if (jsonMatch) {
    painPointsData = JSON.parse(jsonMatch[1]);
  }
}

// Validate with schema
const validatedData = PainPointSchema.parse(painPointsData);
````

**Step 3: Cross-validate with tool results**

```typescript
// Ensure we have tool data for each pain point
const painPoints = validatedData.painPoints.map((point, index) => {
  const toolResult = toolMessages[index]?.content;
  const post = state.redditPosts[index];

  return {
    id: nanoid(),
    description: point.description, // Agent's analysis, not post title
    severity: point.severity,
    category: point.category,
    source: post.url,
    examples: point.evidence || [post.content?.substring(0, 200)],
    confidence: point.confidence,
    frequency: 1,
    // Store tool metrics for reference
    toolMetrics: toolResult ? JSON.parse(toolResult) : undefined,
  };
});
```

**Expected Output:**

```json
{
  "description": "Small startups (8 people) spend 3+ months failing to hire quality product designers through traditional channels",
  "category": "hiring",
  "severity": "medium",
  "confidence": 0.75
}
```

---

### Task 5.8: Enhance Idea Generator Agent Output (DONE)

**Status:** ✅ Completed - Idea Generator now creates creative, differentiated product ideas.

**What was achieved:**

- Replaced hardcoded template logic with `extractStructuredOutput` helper
- Agent generates creative product names (e.g., "Foundr Forge", "TrialHire Studio" instead of "Hiring Solution")
- Detailed pitches explaining HOW the product works and WHY it's differentiated
- Specific target audiences (e.g., "Pre-Series A SaaS founders with 5-15 employees" instead of "Startups and small businesses")
- Successfully extracts from agent synthesis using hybrid extraction strategy

**Example output:**

```json
{
  "name": "Foundr Forge",
  "pitch": "Curated designer marketplace matching SaaS founders with vetted designers using portfolio-first algorithm. Candidates complete paid micro-project as application.",
  "targetAudience": "Pre-seed to pre-Series A SaaS founders with 5–15 employees"
}
```

**Current Issue (resolved):** Ideas were generic templates with no creativity or differentiation.

**Goal (achieved):** Generate creative, specific product ideas using agent's synthesis of tool results.

**What we have:**

```json
{
  "name": "General Solution",
  "pitch": "A solution to address: Share your startup - quarterly post"
}
```

**What we need:**

```json
{
  "name": "LaunchPad Weekly",
  "pitch": "A curated newsletter featuring 10 vetted startups each week, distributed to 50K+ investors and early adopters",
  "targetAudience": "Early-stage B2B SaaS founders seeking visibility"
}
```

**Implementation Steps:**

**Step 1: Remove hardcoded idea generation logic**

Current (bad):

```typescript
const ideas = state.painPoints.map((painPoint) => ({
  name: `${painPoint.category} Solution`, // Generic!
  pitch: `A solution to address: ${painPoint.description}`, // Template!
}));
```

**Step 2: Let agent generate creative ideas after tool validation**

```typescript
const prompt = `You are a creative product strategist. Generate innovative product ideas for these pain points:

${painPointsContext}

WORKFLOW:
1. For EACH pain point, use estimate_market_size and analyze_competition tools
2. After gathering market data, generate 1-2 creative product ideas per pain point
3. Return structured JSON with your ideas

REQUIRED FINAL OUTPUT (after all tool calls):
{
  "ideas": [
    {
      "name": "Catchy 2-4 word product name",
      "pitch": "One compelling sentence describing what it does and why it matters",
      "painPoint": "Which specific pain point this solves",
      "targetAudience": "Specific audience segment (be precise)",
      "category": "Same category as the pain point",
      "differentiation": "What makes this unique vs existing solutions",
      "confidence": 0.0-1.0
    }
  ]
}

CREATIVITY RULES:
- Names must be memorable and relevant (NOT generic like "General Solution")
- Pitches must be specific about HOW it solves the problem
- Target audience must be precise (NOT "startups and small businesses")
- Each idea must have clear differentiation
- Ideas should be realistic but innovative`;
```

**Step 3: Extract agent's creative synthesis**

```typescript
// Find the last AI message with structured ideas
const finalAIMessage = result.messages
  .slice()
  .reverse()
  .find(
    (msg: any) =>
      msg._getType() === "ai" &&
      !msg.tool_calls &&
      msg.content.includes("ideas")
  );

// Parse and validate
const ideasData = parseJSON(finalAIMessage.content);
const validatedData = IdeaGenerationSchema.parse(ideasData);

// Enrich with sources and tool metrics
const ideas = validatedData.ideas.map((idea, index) => {
  const relatedPainPoint = state.painPoints.find(
    (p) => p.description === idea.painPoint
  );

  return {
    id: nanoid(),
    name: idea.name,
    pitch: idea.pitch,
    painPoint: idea.painPoint,
    targetAudience: idea.targetAudience,
    category: idea.category,
    sources: relatedPainPoint?.source ? [relatedPainPoint.source] : [],
    score: 0, // Will be filled by scorer
    generatedAt: new Date(),
    confidence: idea.confidence,
  };
});
```

**Expected Output:**

```json
{
  "name": "DesignMatch",
  "pitch": "On-demand product design marketplace matching vetted designers with startups in 48 hours, with trial periods to reduce hiring risk",
  "targetAudience": "Pre-Series A SaaS startups (5-15 employees) without in-house design",
  "category": "hiring"
}
```

---

### Task 5.9: Enhance Scoring Agent to Use Tool Results

**Current Issue:** Scoring uses hardcoded values instead of tool-generated insights.

**Goal:** Calculate scores using data from all 3 scoring tools (pain severity, market size, competition).

**What we have:**

```typescript
const painSeverity = 15; // Hardcoded
const marketSize = 20; // Hardcoded
const competition = 15; // Hardcoded
```

**What we need:**

```typescript
// Extract from tool results
const painSeverityScore = painSeverityTool.severityScore * 0.3; // 0-30 points
const marketSizeScore = marketSizeTool.tamScore * 0.25; // 0-25 points
const competitionScore = competitionTool.competitionScore * 0.2; // 0-20 points
```

**Implementation Steps:**

**Step 1: Update Scorer prompt to use tool data in final synthesis**

```typescript
const prompt = `Score these product ideas using objective tool data:

${ideasContext}

WORKFLOW:
1. For EACH idea, call all 3 tools:
   - analyze_pain_severity: How urgent is the pain?
   - estimate_market_size: What's the TAM/SAM?
   - analyze_competition: How crowded is the market?

2. After gathering ALL tool data, synthesize into final scores

REQUIRED FINAL OUTPUT:
{
  "scoredIdeas": [
    {
      "ideaId": "abc123",
      "score": 0-100,
      "breakdown": {
        "painSeverity": 0-30,
        "marketSize": 0-25,
        "competition": 0-20,
        "feasibility": 0-15,
        "engagement": 0-10,
        "total": sum
      },
      "reasoning": "Clear explanation citing tool data"
    }
  ]
}

SCORING RULES:
- painSeverity: Use tool's severityScore (0-100) * 0.30
- marketSize: Use tool's TAM/SAM analysis * 0.25
- competition: Use tool's competitionScore * 0.20
- feasibility: Evaluate manually (0-15)
- engagement: Use Reddit metrics from pain point source
- reasoning must cite specific tool findings`;
```

**Step 2: Extract and map tool results to ideas**

```typescript
// Parse tool messages by type
const toolMessagesByType: Record<string, any[]> = {
  pain_severity: [],
  market_size: [],
  competition: [],
};

toolMessages.forEach((msg: any) => {
  const content = JSON.parse(msg.content);
  const toolName = msg.name || inferToolName(content);

  if (toolName.includes("pain")) {
    toolMessagesByType.pain_severity.push(content);
  } else if (toolName.includes("market")) {
    toolMessagesByType.market_size.push(content);
  } else if (toolName.includes("competition")) {
    toolMessagesByType.competition.push(content);
  }
});

// Get agent's final synthesis
const finalAIMessage = result.messages
  .slice()
  .reverse()
  .find((msg: any) => msg._getType() === "ai" && !msg.tool_calls);

const scoresData = parseJSON(finalAIMessage.content);
const validatedData = ScoringSchema.parse(scoresData);

// Merge scores back into ideas with tool data
const scoredIdeas = state.ideas.map((idea, index) => {
  const scoreData = validatedData.scoredIdeas.find((s) => s.ideaId === idea.id);
  const painTool = toolMessagesByType.pain_severity[index];
  const marketTool = toolMessagesByType.market_size[index];
  const competitionTool = toolMessagesByType.competition[index];

  return {
    ...idea,
    score:
      scoreData?.score ||
      calculateFallbackScore(painTool, marketTool, competitionTool),
    scoreBreakdown: scoreData?.breakdown,
    toolData: {
      painSeverity: painTool,
      marketSize: marketTool,
      competition: competitionTool,
    },
  };
});
```

**Step 3: Add fallback logic using raw tool data**

```typescript
function calculateFallbackScore(
  painTool: any,
  marketTool: any,
  competitionTool: any
): number {
  const painScore = (painTool?.severityScore || 50) * 0.3;
  const marketScore = (marketTool?.tamScore || 50) * 0.25;
  const compScore = (competitionTool?.competitionScore || 50) * 0.2;
  const feasibility = 10; // Default
  const engagement = 5; // Default

  return Math.round(
    painScore + marketScore + compScore + feasibility + engagement
  );
}
```

**Expected Output:**

```json
{
  "score": 73,
  "breakdown": {
    "painSeverity": 22,
    "marketSize": 18,
    "competition": 16,
    "feasibility": 12,
    "engagement": 5,
    "total": 73
  },
  "reasoning": "High pain severity (tool: 73/100) with strong market potential (TAM: $2.1B). Moderate competition (15 competitors) but strong differentiation. Feasible MVP in 3-4 months."
}
```

---

### Task 5.10: Implement Hybrid Data Extraction Strategy (DONE)

**Status:** ✅ Completed - Robust extraction helper implemented and used across all agents.

**What was achieved:**

- Created `extractStructuredOutput` helper in `lib/openai/extraction.ts`
- Implemented 3-strategy approach:
  - Strategy 1a: AI message with content, NO tool_calls (ideal case)
  - Strategy 1b: AI message with content, EVEN IF has tool_calls (handles partial JSON)
  - Strategy 2: Direct tool results (fallback)
- All agents (Pain Extractor, Idea Generator) now use this unified helper
- Successfully extracts JSON from messages where agent provides synthesis AND tool_calls simultaneously
- Handles markdown code blocks, plain JSON, and JSON embedded in text

**Goal (achieved):** Create a robust extraction strategy that combines tool data with agent synthesis.

**Create a unified extraction helper:**

````typescript
// lib/openai/extraction.ts

/**
 * Extracts structured data from agent responses
 * Tries multiple strategies in order of preference
 */
export function extractStructuredOutput<T>(
  messages: any[],
  schema: z.ZodSchema<T>,
  options: {
    requireToolCalls?: boolean;
    fallbackToToolData?: boolean;
  } = {}
): { data: T; source: "agent_synthesis" | "tool_results" | "fallback" } {
  // Strategy 1: Agent's final structured synthesis (preferred)
  const finalAIMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg._getType() === "ai" && !msg.tool_calls);

  if (finalAIMessage?.content) {
    try {
      const parsed = parseJSON(finalAIMessage.content);
      const validated = schema.parse(parsed);
      return { data: validated, source: "agent_synthesis" };
    } catch (error) {
      console.warn("[Extraction] Failed to parse agent synthesis:", error);
    }
  }

  // Strategy 2: Direct tool results (fallback)
  if (options.fallbackToToolData) {
    const toolMessages = messages.filter((msg) => msg._getType() === "tool");

    if (toolMessages.length > 0) {
      try {
        const toolData = toolMessages.map((msg) => JSON.parse(msg.content));
        const validated = schema.parse({ items: toolData });
        return { data: validated, source: "tool_results" };
      } catch (error) {
        console.warn("[Extraction] Failed to parse tool results:", error);
      }
    }
  }

  throw new Error("Could not extract structured output from agent response");
}

/**
 * Parse JSON from various formats (plain, markdown, etc.)
 */
function parseJSON(content: string): any {
  // Try direct parse
  try {
    return JSON.parse(content);
  } catch {}

  // Try markdown code block
  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }

  // Try finding JSON in text
  const jsonInText = content.match(/\{[\s\S]*\}/);
  if (jsonInText) {
    return JSON.parse(jsonInText[0]);
  }

  throw new Error("No valid JSON found in content");
}
````

**Usage in workflow nodes:**

```typescript
// agents/workflow.ts - painExtractorNode

const { data: painPointsData, source } = extractStructuredOutput(
  result.messages,
  PainPointSchema,
  { fallbackToToolData: true }
);

console.log(`[Pain Extractor] Extracted data from: ${source}`);

const painPoints = painPointsData.painPoints.map((point) => ({
  id: nanoid(),
  ...point,
}));
```

---

### Task 5.11: Add Comprehensive Agent Output Validation

**Goal:** Ensure agent outputs meet quality standards before proceeding.

**Create validation helpers:**

```typescript
// lib/openai/validation.ts

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate pain point quality
 */
export function validatePainPoint(point: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check description is not just a title
  if (point.description.length < 20) {
    errors.push("Pain point description too short (likely just a title)");
  }

  // Check category is specific
  if (point.category === "general" || point.category === "other") {
    warnings.push("Pain point category is too generic");
  }

  // Check confidence threshold
  if (point.confidence < 0.6) {
    warnings.push(`Low confidence: ${point.confidence}`);
  }

  // Check for evidence
  if (!point.evidence || point.evidence.length === 0) {
    warnings.push("No evidence/quotes provided");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate product idea quality
 */
export function validateProductIdea(idea: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check name is not generic
  const genericNames = [
    "general solution",
    "product",
    "app",
    "platform",
    "tool",
  ];
  if (genericNames.some((name) => idea.name.toLowerCase().includes(name))) {
    errors.push(`Generic product name: ${idea.name}`);
  }

  // Check pitch is specific
  if (idea.pitch.toLowerCase().includes("a solution to address")) {
    errors.push("Pitch is a template, not a real product description");
  }

  if (idea.pitch.length < 30) {
    warnings.push("Pitch is too short");
  }

  // Check target audience is specific
  if (
    idea.targetAudience.toLowerCase().includes("startups and small businesses")
  ) {
    warnings.push("Target audience too broad");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
```

**Use in workflow:**

```typescript
// After extracting pain points
painPoints.forEach((point, index) => {
  const validation = validatePainPoint(point);

  if (!validation.isValid) {
    console.error(
      `[Pain Extractor] Invalid pain point ${index}:`,
      validation.errors
    );
  }

  if (validation.warnings.length > 0) {
    console.warn(
      `[Pain Extractor] Pain point ${index} warnings:`,
      validation.warnings
    );
  }
});

// Filter out invalid items
const validPainPoints = painPoints.filter((point) => {
  const validation = validatePainPoint(point);
  return validation.isValid;
});
```

---

### Task 5.12: Fix Agent Workflow Performance and Execution (DONE)

**Status:** ✅ Completed - All agents now complete execution without timeouts and process all inputs.

**Issues resolved:**

1. **Timeout Issue**: Scorer was timing out after 7+ minutes (7 attempts × 30s timeout)
2. **Incomplete Processing**: Pain Extractor was only analyzing 1 of 3 posts
3. **Agent Stopping Early**: Agents were providing synthesis before completing all tool calls

**What was achieved:**

**1. Fixed recursionLimit for Performance:**

- Lowered Scorer's `recursionLimit` from 25 to 15
- Prevents infinite loops while allowing sufficient iterations
- Reduced total workflow time from 7+ minutes to ~2 minutes
- All agents now complete without timeout

**2. Enforced Two-Phase Workflow:**

- Updated all agent prompts to explicitly require:
  - PHASE 1: Call tools for ALL inputs (mandatory)
  - PHASE 2: Provide synthesis ONLY after Phase 1 complete
- Added counting instructions: "You MUST call tool X times for X posts"
- Added execution checklists with explicit ordering

**3. Updated System Messages:**

- Pain Extractor: "CRITICAL RULE: You MUST call tool for EVERY post before synthesizing"
- Idea Generator: "MARKET RESEARCH PHASE (COMPLETE ALL FIRST)"
- Scorer: "DATA COLLECTION PHASE (use tools)"
- All system messages now reinforce the two-phase pattern

**Results:**

- Pain Extractor: Now analyzes ALL posts (not just first one)
- Idea Generator: Processes ALL pain points before generating ideas
- Scorer: Completes in ~2 minutes (was 7+ minutes)
- Average workflow time: 2-3 minutes ✅

**Performance metrics:**

```
Before: 469546ms (7.8 minutes) with timeout
After:  125645ms (2.1 minutes) complete success
```

---

## Epic 6: Dashboard & Ideas Feed

### Task 6.1: Create Dashboard Layout (DONE)

✅ **Completed:**

- Built dashboard shell with sidebar
- Added navigation menu with icons and badges
- Implemented responsive design (mobile + desktop)
- Created stats cards for overview
- Added empty states for future features

### Task 6.2: Build Ideas Feed Component (DONE)

✅ **Completed:**

- Created IdeaCard component with comprehensive idea display
- Built IdeasFeed component with search and category filtering
- Implemented sorting (by score or date)
- Added category badges with color coding
- Created score display with breakdown visualization
- Added empty and loading states
- Implemented responsive grid layout
- Created Ideas Feed page at `/dashboard/ideas`

### Task 6.3: Add Topic Filtering (DONE)

✅ **Completed:**

- Category filtering already implemented (Marketing, Hiring, Technical, Productivity, Financial, Other)
- Filter preferences persisted to localStorage
- Preferences automatically restored on page load
- Sort preferences (score/date) also persisted

### Task 6.4: Implement "New" Badge Logic (DONE)

✅ **Completed:**

- Tracked viewed ideas in localStorage
- "New" badge shows only for unviewed ideas (within 24 hours)
- Ideas automatically marked as viewed when displayed
- Viewed state persists across sessions

---

## Epic 7: Email Subscription System (DONE)

### Task 7.1: Create Subscription UI (DONE)

✅ **Completed:**

- Built subscription form component
- Added topic selection with badges (Marketing, Hiring, Technical, Productivity, Financial)
- Created success/error states with messages

### Task 7.2: Implement Subscription API (DONE)

✅ **Completed:**

- Created POST `/api/subscriptions` endpoint
- Generates unique unsubscribe tokens (32-char nanoid)
- Stores preferences in Supabase
- Implements DELETE endpoint for unsubscribe

```typescript
// pseudocode - app/api/subscriptions/route.ts
export async function POST(request: Request) {
  const { email, topics } = await request.json();

  const subscription = await supabase.from("subscriptions").insert({
    email,
    topics,
    unsubscribe_token: generateToken(),
  });

  return Response.json(subscription);
}
```

### Task 7.3: Build Email Templates (DONE)

✅ **Completed:**

- Created React Email template (`emails/ideas-digest.tsx`)
- Designed responsive layout with cards
- Added unsubscribe link with token

### Task 7.4: Set Up Resend Integration (DONE)

✅ **Completed:**

- Configured Resend client (`lib/email/resend.ts`)
- Created `sendIdeasDigest()` service function
- Handles errors with proper logging

### Task 7.5: Implement Email Dispatch Logic (DONE)

✅ **Completed:**

- Queries active subscriptions from Supabase
- Filters ideas by user topic preferences
- Batch sends emails with Promise.allSettled
- Updates `last_email_sent` timestamp

---

## Epic 8: Background Jobs

### Task 8.1: Create Cron Endpoints (DONE)

✅ **Completed:**

- Created `/api/cron/generate` endpoint
- Secured with CRON_SECRET header authentication
- ⏭️ Skipped `/api/cron/email` (requires Epic 7)

### Task 8.2: Implement Generation Job (DONE)

✅ **Completed:**

- Triggers Reddit data fetch (3 posts from r/startups)
- Runs AI pipeline with full workflow
- Stores ideas in Supabase `ideas` table
- Returns generation stats and processing time

```typescript
// pseudocode - app/api/cron/generate/route.ts
export async function POST(request: Request) {
  // Verify cron secret
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Run workflow
  const reddit = new RedditService();
  const posts = await reddit.fetchTrendingPosts();

  const workflow = createWorkflow();
  const result = await workflow.invoke({ redditPosts: posts });

  // Store ideas
  await storeIdeas(result.ideas);

  return Response.json({ success: true });
}
```

### Task 8.3: Implement Email Job (DONE)

✅ **Completed:**

- Created POST `/api/cron/email` endpoint
- Queries new ideas (is_new = true)
- Gets active subscriptions
- Filters ideas by user topics
- Sends digest emails via Resend
- Marks ideas as sent (is_new = false)

### Task 8.4: Add Manual Trigger (DONE)

✅ **Completed:**

- Added "Generate Ideas" button to dashboard
- Shows loading state during generation
- Displays last run timestamp
- Shows success/error alerts with stats

---

## Epic 9: Landing Page & Marketing

### Task 9.1: Create Landing Page Layout

- Build responsive header with navigation
- Implement hero section
- Add value proposition sections
- Create CTA buttons

### Task 9.2: Implement Landing Page Components

- Hero component with gradient background
- Features grid (3 key benefits)
- How it works section
- Footer with links

```tsx
// pseudocode - app/(marketing)/page.tsx
export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
    </>
  );
}
```

### Task 9.3: Add Marketing Animations

- Implement subtle scroll animations
- Add hover effects
- Ensure smooth transitions

### Task 9.4: Optimize for SEO

- Add metadata
- Implement Open Graph tags
- Set up proper page structure

---

## Epic 10: Polish & Deployment

### Task 10.1: Add Loading States

- Implement skeleton screens
- Add loading spinners
- Handle empty states

### Task 10.2: Implement Error Handling

- Create error boundaries
- Add user-friendly error messages
- Log errors properly

### Task 10.3: Optimize Performance

- Add React Query caching
- Implement lazy loading
- Optimize bundle size

### Task 10.4: Prepare for Deployment

- Set up Vercel project
- Configure environment variables
- Add domain and SSL

### Task 10.5: Create Documentation

- Write README.md with local setup instructions
- Add setup instructions
- Document API endpoints

### Task 10.6: Create Cursor Artifacts

- Create `.cursor/rules.md` with AI coding guidelines
- Create `.cursor/PROMPTS.md` with 5-10 key prompts used
- Document architectural decisions and constraints
- Include commit conventions and code style rules

---

## Implementation Notes

1. **Start Simple**: Begin with core functionality, enhance later
2. **Focus on Flow**: Ensure end-to-end works before optimizing
3. **Mock When Needed**: Use mock data if APIs aren't ready
4. **Iterate Quickly**: Get feedback early and often
5. **Keep It Clean**: Write clear, maintainable code

## Success Checklist

- [ ] User can sign up and log in
- [ ] Landing page looks professional
- [ ] Reddit data is fetched successfully
- [ ] AI pipeline generates relevant ideas
- [ ] Ideas are scored and stored
- [ ] Email subscriptions work
- [ ] Cron jobs run reliably
- [ ] Dashboard shows ideas feed
- [ ] Deployed to Vercel
