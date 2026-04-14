# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VocalPlan — voice-powered Eisenhower Matrix task organizer. Users record voice notes, and AI extracts/categorizes tasks into a 4-quadrant priority grid (Do First / Schedule / Delegate / Eliminate). Built with Next.js 15 App Router, TypeScript, Tailwind CSS v4, PostgreSQL (Prisma), and NextAuth v5.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode
npx vitest run __tests__/path/to/test.ts  # Run a single test file
npx prisma migrate dev    # Run database migrations
npx prisma generate       # Regenerate Prisma client
```

## Environment Setup

Copy `.env.example` to `.env.local`. Required:
- `DATABASE_URL` — PostgreSQL connection string (Neon recommended)
- `NEXTAUTH_SECRET` — JWT signing secret
- `NEXTAUTH_URL` — app URL (http://localhost:3000)
- `GEMINI_API_KEY` and/or `Z_AI_API_KEY` — at least one AI provider key is required

## Architecture

### Routing & Auth
- **App Router** with route groups: `(auth)/` for login/register pages, `(dashboard)/` for protected planner/analytics/teams pages
- **Middleware** (`middleware.ts`) protects all routes except `/login`, `/register`, `/api/auth` — unauthenticated users get redirected to `/login`
- **NextAuth v5** with credentials provider (email/password), JWT sessions, bcrypt password hashing. Config in `lib/auth.ts`, user ID propagated via JWT callback

### AI Providers (Dual)
Both providers accept base64 audio + MIME type and return `EisenhowerMatrixData` (four string arrays).

- **Gemini** (`lib/gemini.ts`) — single API call using `gemini-3-flash-preview` with structured JSON output via `responseSchema`. Max ~5 min audio.
- **GLM** (`lib/glm.ts`) — two-step: `glm-asr-2512` transcribes audio, then `glm-5-turbo` categorizes the transcript with `response_format: json_object`. Max ~30 sec audio.

Provider selection happens client-side in `VoiceRecorder`, dispatched server-side in `/api/analyze/route.ts`.

### Database (Prisma)
- PostgreSQL via Neon. Schema in `prisma/schema.prisma`
- Core models: `User`, `Task` (with `TaskCategory` enum), `VoiceNote`, `Team`, `TeamMember` (with `TeamRole` enum)
- Tasks are indexed on `[userId, date]` and `[teamId, date]`
- Prisma client singleton in `lib/prisma.ts`

### Key Client Components
- `PlannerApp` — main orchestrator (client component), manages task state, date selection, API calls
- `VoiceRecorder` — microphone capture with provider toggle, sends audio to `/api/analyze`
- `EisenhowerMatrix` — 4-quadrant drag-and-drop grid using `@dnd-kit`
- `SortableTask` — individual draggable task cards

### API Routes
- `POST /api/analyze` — authenticates session, dispatches to Gemini or GLM provider
- `/api/tasks` — CRUD for tasks (user-scoped)
- `/api/voice-notes` — voice note management
- `/api/teams` — team creation and invite-based membership
- `/api/analytics` — usage statistics
- `/api/auth/[...nextauth]` — NextAuth handler

### Shared Types
All shared types in `types.ts`: `Task`, `VoiceNote`, `DayData`, `EisenhowerMatrixData`, `Team`, `TeamMember`, enums `TaskCategory`, `TeamRole`.

### Testing
- Vitest with JSDOM environment, React Testing Library
- Config in `vitest.config.ts`, setup in `vitest.setup.ts`
- Tests in `__tests__/`
- Path alias `@/` maps to project root
