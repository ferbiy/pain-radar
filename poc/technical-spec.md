# Pain Radar - Technical Specification

## Project Overview
A SaaS platform that helps first-time founders discover product ideas by analyzing Reddit discussions about user problems and pain points.

## Tech Stack Decisions

### Core Framework
- **Next.js 14+ with App Router**
  - Full-stack TypeScript support
  - Server-side rendering for SEO
  - API routes for backend logic
  - Built-in performance optimizations
  - Easy Vercel deployment

### Database & Authentication
- **Supabase**
  - PostgreSQL for relational data
  - Built-in authentication (email/password)
  - No Row Level Security (POC scope)
  - Real-time subscriptions capability
  - Hosted solution (no self-hosting needed)

### Data Sources
- **Reddit API Integration**
  - Official Reddit API only (no mock data)
  - Simple rate limiting (if needed)
  - Subreddit popularity tracking
  - OAuth2 authentication flow

### AI/LLM Provider
- **OpenAI GPT-5-mini**
  - Latest mini model with improved capabilities
  - High-quality idea generation
  - Fast response times (<2s)
  - Structured output support
  - JSON mode for consistent outputs

### Email Service
- **Resend**
  - Developer-friendly API
  - React Email template support
  - Built-in unsubscribe handling
  - Good free tier (100 emails/day)
  - Easy integration with Next.js

### UI/Styling
- **Tailwind CSS + shadcn/ui**
  - Rapid prototyping
  - Consistent design system
  - Accessible components
  - Mobile-responsive by default

### Additional Libraries
- **Zod** - Schema validation and type inference
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form state management
- **date-fns** - Date manipulation
- **Vercel Cron** - Scheduled jobs

### AI Agent Orchestration
- **LangGraph**
  - Multi-agent workflow management
  - Stateful agent coordination
  - Graph-based agent interactions
  - Agents:
    - Reddit Analysis Agent (extracts pain points)
    - Idea Generation Agent (creates product ideas)
    - Scoring Agent (evaluates idea potential)
    - Summary Agent (formats final output)

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
├─────────────────────────────────────────────────────────────┤
│  Landing Page  │  Auth Flow  │  Dashboard  │  Settings      │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     NEXT.JS APP ROUTER                      │
├─────────────────────────────────────────────────────────────┤
│  /app                                                       │
│    /(marketing)     - Public pages                          │
│    /(auth)          - Auth pages                            │
│    /(dashboard)     - Protected pages                       │
│    /api             - API routes                            │
└─────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
┌───────────────────┐ ┌───────────────┐ ┌───────────────────┐
│   Supabase DB     │ │  External APIs │ │   Background      │
├───────────────────┤ ├───────────────┤ │   Jobs (Cron)     │
│ • ideas           │ │ • Reddit API   │ ├───────────────────┤
│ • subscriptions   │ │ • OpenAI API   │ │ • Data fetching   │
│ • reddit_sources  │ │ • Resend API   │ │ • Idea generation │
│ • email_logs      │ └───────────────┘ │ • Email dispatch  │
└───────────────────┘                   └───────────────────┘
```

## Database Schema

```sql
-- Product Ideas table
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Core fields
  name VARCHAR(200) NOT NULL,
  pitch TEXT NOT NULL,
  pain_point TEXT NOT NULL,
  target_audience VARCHAR(200),
  
  -- Metadata
  sources JSONB DEFAULT '[]', -- Array of {subreddit, post_url, post_title}
  score INTEGER CHECK (score >= 0 AND score <= 100),
  category VARCHAR(50),
  
  -- Tracking
  is_new BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0
);

-- Email Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  topics TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  unsubscribe_token VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_email_sent TIMESTAMPTZ
);

-- Reddit Sources tracking
CREATE TABLE reddit_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subreddit VARCHAR(100) UNIQUE NOT NULL,
  last_checked TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  subscriber_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email send logs (for tracking)
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50),
  ideas_sent INTEGER
);
```

## Key Design Decisions

### 1. **Monolithic Architecture**
- Single Next.js application for simplicity
- Easier to deploy and maintain
- Sufficient for MVP scale

### 2. **Hybrid Rendering Strategy**
- SSR/ISR/SSG for landing page only (SEO optimization)
- Client-Side Rendering (CSR) for dashboard and authenticated pages
- Faster development time for POC
- Optimal performance where it matters most

### 3. **Type Safety**
- End-to-end TypeScript
- Zod schemas for runtime validation
- Typed API responses

### 4. **Environment-Based Configuration**
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
OPENAI_API_KEY=
RESEND_API_KEY=
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_USER_AGENT=
REDDIT_USERNAME=
REDDIT_PASSWORD=
```

### 5. **API Design**
- RESTful endpoints for CRUD operations
- Server Actions for form submissions
- Webhook endpoints for external services

## MVP Feature Prioritization (8-hour breakdown)

### Phase 1: Foundation (Hours 1-2)
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Supabase project and auth
- [ ] Configure environment variables
- [ ] Install and configure core dependencies
- [ ] Create base layout and routing structure

### Phase 2: Landing & Auth (Hours 3-4)
- [ ] Design and implement landing page
- [ ] Create auth pages (signup/login)
- [ ] Implement Supabase auth integration
- [ ] Set up protected routes middleware
- [ ] Create basic navigation

### Phase 3: Core Features (Hours 5-6)
- [ ] Design ideas feed UI
- [ ] Implement Reddit API integration
- [ ] Set up LangGraph agent workflow
- [ ] Implement OpenAI integration
- [ ] Build idea generation pipeline
- [ ] Create scoring algorithm

### Phase 4: Subscriptions (Hour 7)
- [ ] Build subscription management UI
- [ ] Implement email subscription logic
- [ ] Create topic filtering
- [ ] Set up Resend integration
- [ ] Add unsubscribe functionality

### Phase 5: Polish & Deploy (Hour 8)
- [ ] Error handling and loading states
- [ ] Basic responsive design fixes
- [ ] Write README documentation
- [ ] Environment setup guide
- [ ] Deploy to Vercel

## API Endpoints

```typescript
// Public APIs
GET  /api/ideas          // List ideas (with filters)
GET  /api/ideas/[id]     // Single idea details

// Protected APIs
POST /api/subscriptions  // Create subscription
PUT  /api/subscriptions  // Update preferences
DELETE /api/subscriptions // Unsubscribe

// Webhooks
POST /api/webhooks/reddit // Reddit data ingestion
POST /api/cron/generate   // Scheduled idea generation
POST /api/cron/email      // Scheduled email dispatch
```

## LangGraph Agent Architecture

A comprehensive multi-agent system using the Supervisor Pattern for coordinated workflow management.

**See detailed architecture documentation: `/poc/ai-agent-architecture.md`**  
**Interactive Diagram**: [View on MermaidChart](https://www.mermaidchart.com/d/24666025-cca2-43b6-9f71-7b0b8df5d089)

### Key Components:

**AI Agents (LangGraph):**
1. **Supervisor Agent** - Lightweight orchestrator for linear flow
2. **Pain Extractor Agent** - Analyzes Reddit content for problems
3. **Idea Generator Agent** - Creates product ideas from pain points
4. **Scoring Agent** - Evaluates idea potential (0-100 score)

**Regular Services (Non-AI):**
1. **Reddit API Service** - Simple HTTP client for data fetching
2. **Email Service** - Template-based email sender

### Workflow Pattern:
```
Reddit Fetch → Pain Extraction → Idea Generation → Scoring → Storage
```

The architecture includes:
- State management with TypeScript interfaces
- Error recovery and retry logic
- Quality gates and thresholds
- Parallel processing capabilities
- Comprehensive monitoring and logging

## Prompt Engineering Strategy

### Idea Generation Prompt Structure
```typescript
interface IdeaGenerationPrompt {
  painPoints: string[];
  subreddit: string;
  engagement: number;
  constraints: {
    maxLength: number;
    tone: 'professional' | 'casual';
    includeFields: string[];
  };
}
```

### Scoring Criteria
1. **Pain Severity** (0-30 points)
2. **Market Size** (0-25 points)
3. **Competition** (0-20 points)
4. **Feasibility** (0-15 points)
5. **Engagement** (0-10 points)

## Security Considerations

1. **Authentication**
   - Supabase Auth with secure sessions
   - Email verification (optional for POC)

2. **Data Protection**
   - No RLS for POC (simplified development)
   - Simple in-memory rate limiting (optional)
   - Basic input sanitization

3. **API Keys**
   - All secrets in environment variables
   - Service keys only on server-side

## Deployment Strategy

1. **Vercel** (Primary)
   - Automatic deployments from GitHub
   - Environment variable management
   - Cron job support

2. **Monitoring**
   - Vercel Analytics
   - Error tracking (Sentry consideration)
   - API usage tracking

## Future Enhancements (Post-MVP)

1. **Advanced Features**
   - AI-powered trend analysis
   - Competitor analysis
   - Market size estimation
   - Team collaboration

2. **Integrations**
   - Discord communities
   - Twitter/X discussions
   - Hacker News threads
   - Product Hunt data

3. **Monetization**
   - Tiered subscriptions
   - API access
   - Custom reports
   - White-label solution
