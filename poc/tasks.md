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

### Task 5.1: Set Up LangGraph Workflow

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

### Task 5.2: Implement Supervisor Agent

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

### Task 5.3: Build Pain Extractor Agent

- Create GPT-5-mini prompt for pain extraction
- Parse Reddit content
- Extract and categorize pain points

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

### Task 5.4: Create Idea Generator Agent

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
    temperature: 0.8, // Higher temperature for more creativity
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

### Task 5.5: Implement Scoring Agent

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
        temperature: 0.3, // Lower temperature for consistent scoring
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

### Task 5.6: Connect Workflow Pipeline

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

## Epic 6: Dashboard & Ideas Feed

### Task 6.1: Create Dashboard Layout

- Build dashboard shell with sidebar
- Add navigation menu
- Implement responsive design

### Task 6.2: Build Ideas Feed Component

- Create idea card component
- Implement infinite scroll or pagination
- Add filtering by category

```tsx
// pseudocode - components/IdeasFeed.tsx
export function IdeasFeed() {
  const { data: ideas } = useQuery({
    queryKey: ["ideas"],
    queryFn: fetchIdeas,
  });

  return (
    <div className="grid gap-4">
      {ideas.map((idea) => (
        <IdeaCard key={idea.id} idea={idea} />
      ))}
    </div>
  );
}
```

### Task 6.3: Add Topic Filtering

- Create filter UI component with categories:
  - DevTools
  - Health
  - Education
  - SaaS
  - E-commerce
  - Productivity
  - Finance
  - Marketing
- Implement filter logic
- Persist filter preferences in localStorage

### Task 6.4: Implement "New" Badge Logic

- Track viewed ideas
- Show new badge for recent ideas
- Update view count on click

---

## Epic 7: Email Subscription System

### Task 7.1: Create Subscription UI

- Build subscription form
- Add topic selection checkboxes
- Create success/error states

### Task 7.2: Implement Subscription API

- Create subscription endpoint
- Generate unsubscribe tokens
- Store preferences in database

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

### Task 7.3: Build Email Templates

- Create React Email template
- Design responsive layout
- Add unsubscribe link

### Task 7.4: Set Up Resend Integration

- Configure Resend client
- Create email sending service
- Handle delivery errors

### Task 7.5: Implement Email Dispatch Logic

- Query active subscriptions
- Filter ideas by user preferences
- Batch send emails

---

## Epic 8: Background Jobs

### Task 8.1: Create Cron Endpoints

- Set up `/api/cron/generate` endpoint
- Add `/api/cron/email` endpoint
- Secure with API keys

### Task 8.2: Implement Generation Job

- Trigger Reddit data fetch
- Run AI pipeline
- Store results in database

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

### Task 8.3: Implement Email Job

- Query new ideas
- Get active subscriptions
- Send digest emails

### Task 8.4: Add Manual Trigger

- Create admin UI for manual runs
- Add run status tracking
- Show last run timestamp

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
