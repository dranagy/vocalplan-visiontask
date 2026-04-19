# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VocalPlan + VisionTask — AI-powered multi-modal task management platform. Users capture tasks via voice recording or photo upload (whiteboards/handwritten notes), and AI extracts/organizes them. Tasks are viewable through an Eisenhower Matrix (priority) or Kanban Board (workflow). Built with Next.js 15 App Router, TypeScript, Tailwind CSS v4, PostgreSQL (Prisma), and NextAuth v5.

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (prisma generate + next build)
npm run lint         # ESLint
npm test             # Run tests once (vitest)
npm run test:watch   # Run tests in watch mode
npx prisma migrate dev    # Run database migrations
npx prisma generate       # Regenerate Prisma client
```

## Environment Setup

Copy `.env.example` to `.env.local`. Required:
- `DATABASE_URL` — PostgreSQL connection string (Neon recommended)
- `NEXTAUTH_SECRET` — JWT signing secret
- `NEXTAUTH_URL` — app URL (http://localhost:3000)
- `GEMINI_API_KEY` — required for both voice and image analysis
- `Z_AI_API_KEY` — optional, for GLM voice provider

## Architecture

### Routing & Auth
- **App Router** with route groups: `(auth)/` for login/register pages, `(dashboard)/` for protected planner/board/analytics/teams pages
- **Middleware** (`middleware.ts`) protects all routes except `/login`, `/register`, `/api/auth`
- **NextAuth v5** with credentials provider, JWT sessions, bcrypt password hashing. Config in `lib/auth.ts`

### AI Providers
- **Gemini Voice** (`lib/gemini.ts`) — single-call audio analysis with structured JSON output
- **GLM Voice** (`lib/glm.ts`) — two-step: ASR transcription + categorization
- **Gemini Vision** (`lib/gemini-vision.ts`) — image-to-task extraction from whiteboards/handwritten notes

### Dual View System
- **PlannerApp.tsx** is the main orchestrator with `viewMode` state (eisenhower/kanban) persisted to localStorage
- Same `tasks[]` array renders in both views — no data refetch on switch
- **EisenhowerMatrix** groups tasks by `task.category` (4 quadrants)
- **KanbanBoard** groups tasks by `task.assigneeId` (columns per person)
- Tasks have BOTH `category` (Eisenhower) AND `status`/`assigneeId` (Kanban) — these are independent

### Database (Prisma)
- PostgreSQL via Neon. Schema in `prisma/schema.prisma`
- Core models: `User`, `Task`, `VoiceNote`, `ImageNote`, `Team`, `TeamMember`
- Task has enums: `TaskCategory` (4 Eisenhower quadrants), `TaskStatus` (TODO/IN_PROGRESS/REVIEW/DONE), `TaskSource` (VOICE/IMAGE/MANUAL)
- Tasks indexed on `[userId, date]`, `[teamId, date]`, `[status, teamId]`, `[assigneeId]`

### API Routes
- `POST /api/analyze` — voice analysis (Gemini / GLM)
- `POST /api/analyze-image` — image analysis (Gemini Vision)
- `/api/tasks` — CRUD with support for status, assigneeId, source, description
- `/api/voice-notes` — voice note management
- `/api/image-notes` — image note management
- `/api/teams` — team creation and invite-based membership
- `/api/analytics` — usage statistics
- `/api/auth` — NextAuth handlers

### Key Components
- `PlannerApp` — main orchestrator with view switching
- `EisenhowerMatrix` — 4-quadrant drag-and-drop (@dnd-kit)
- `KanbanBoard` — multi-column Kanban (@dnd-kit)
- `VoiceRecorder` — microphone capture with provider toggle
- `ImageUploader` — photo capture for AI extraction
- `ViewToggle` — Eisenhower/Kanban view switcher
- `ExportMenu` — CSV/Excel/PNG export dropdown

### Shared Types
All shared types in `types.ts`: `Task`, `VoiceNote`, `ImageNote`, `DayData`, `EisenhowerMatrixData`, `GeminiTaskResponse`, `Team`, `TeamMember`, enums `TaskCategory`, `TaskStatus`, `TaskSource`, `TeamRole`, `ViewMode`.
