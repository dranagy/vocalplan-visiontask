# VocalPlan

Voice-powered Eisenhower Matrix task organizer. Record a voice note and AI automatically extracts and categorizes your tasks by urgency and importance into a 4-quadrant priority grid.

**Live demo:** [eisenhower-voice-planner.vercel.app](https://eisenhower-voice-planner.vercel.app)

---

## How It Works

1. **Register / log in** with email and password
2. **Record a voice note** — speak naturally about your tasks, deadlines, and priorities
3. **AI processes your audio** — transcribes, extracts tasks, and sorts them into the Eisenhower Matrix:
   - **Do First** — Urgent & Important
   - **Schedule** — Important, Not Urgent
   - **Delegate** — Urgent, Not Important
   - **Eliminate** — Not Urgent, Not Important
4. **Drag and drop** tasks between quadrants to re-prioritize
5. **Navigate by date** using the calendar strip to plan different days
6. **Review analytics** — completion rates, quadrant distribution, and trends over time
7. **Collaborate with teams** — create a team, share an invite code, switch to team context in the planner to create and manage shared tasks

---

## Features

- **Voice recording** — speak your tasks, AI does the rest
- **Dual AI providers** — switch between Google Gemini and Z.AI GLM in the UI
- **Eisenhower Matrix** — drag-and-drop 4-quadrant priority grid
- **Calendar navigation** — plan tasks for any date
- **User authentication** — secure email/password login with JWT sessions
- **Persistent database** — tasks and voice notes stored in PostgreSQL
- **Analytics dashboard** — completion charts, quadrant pie chart, and stats cards
- **Team collaboration** — create teams, invite members via code, switch between personal and team task views, assign tasks to teams directly from the planner
- **PWA installable** — works as a standalone app with offline support
- **Responsive design** — works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | NextAuth v5 (credentials provider, JWT sessions) |
| AI — Gemini | Google Gemini 3 Flash Preview (structured JSON output) |
| AI — GLM | Z.AI GLM-ASR-2512 (transcription) + GLM-5 Turbo (categorization) |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Testing | Vitest + React Testing Library |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or a [Neon](https://neon.tech) account)
- At least one AI provider API key

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
# AI Providers — at least one is required
GEMINI_API_KEY=your_gemini_key          # Get from https://aistudio.google.com/apikey
Z_AI_API_KEY=your_zai_key               # Get from https://z.ai

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
npx prisma db push
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the registration page.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Generate Prisma client + production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## Project Structure

```
├── app/
│   ├── (auth)/                    # Auth route group (public)
│   │   ├── login/page.tsx         # Login page
│   │   └── register/page.tsx      # Registration page
│   ├── (dashboard)/               # Protected route group
│   │   ├── planner/page.tsx       # Main planner with Eisenhower Matrix
│   │   ├── analytics/page.tsx     # Usage analytics dashboard
│   │   └── teams/page.tsx         # Team management
│   ├── api/
│   │   ├── analyze/route.ts       # Voice analysis endpoint (Gemini / GLM)
│   │   ├── auth/                  # NextAuth handlers + registration
│   │   ├── tasks/route.ts         # Task CRUD
│   │   ├── voice-notes/route.ts   # Voice note management
│   │   ├── teams/route.ts         # Team creation + invite codes
│   │   └── analytics/route.ts     # Usage statistics
│   ├── layout.tsx                 # Root layout with providers
│   ├── error.tsx                  # Error boundary
│   └── loading.tsx                # Loading skeleton
├── components/
│   ├── PlannerApp.tsx             # Main orchestrator (client component)
│   ├── VoiceRecorder.tsx          # Mic recording + provider toggle
│   ├── EisenhowerMatrix.tsx       # 4-quadrant drag-and-drop grid
│   ├── SortableTask.tsx           # Individual draggable task card (with team badge)
│   ├── TeamSelector.tsx           # Personal / team context toggle
│   ├── CalendarWheel.tsx          # Date picker strip
│   ├── VoiceNoteList.tsx          # Audio playback list
│   ├── analytics/                 # Chart components (Recharts)
│   ├── Providers.tsx              # App-wide provider wrapper
│   ├── ErrorBoundary.tsx          # Client-side error boundary
│   ├── MatrixSkeleton.tsx         # Loading skeleton for matrix
│   └── ToastProvider.tsx          # Toast notification wrapper
├── lib/
│   ├── auth.ts                    # NextAuth v5 configuration
│   ├── prisma.ts                  # Prisma client singleton
│   ├── gemini.ts                  # Gemini provider (single-call audio analysis)
│   └── glm.ts                     # GLM provider (ASR + categorization)
├── prisma/
│   └── schema.prisma              # Database schema (7 models, 2 enums)
├── __tests__/                     # Vitest test files
├── types.ts                       # Shared TypeScript types
├── middleware.ts                  # Auth middleware (route protection)
└── public/
    ├── manifest.json              # PWA manifest
    └── sw.js                      # Service worker
```

---

## AI Providers

### Gemini (Google)

Single API call — sends base64 audio to `gemini-3-flash-preview` with a structured JSON response schema. Supports audio up to ~5 minutes. Returns all four Eisenhower Matrix categories in one response.

### GLM (Z.AI)

Two-step pipeline:
1. `glm-asr-2512` transcribes the audio to text
2. `glm-5-turbo` categorizes the transcript into the four quadrants using `response_format: json_object`

Supports audio up to ~30 seconds. Better for shorter, focused voice notes.

Both providers are selectable in the UI via a toggle in the voice recorder.

---

## Database Schema

PostgreSQL with Prisma ORM. Core models:

- **User** — email/password auth, owns tasks and voice notes
- **Task** — title, category (Eisenhower quadrant), date, deadline, completion status, optional team assignment
- **VoiceNote** — audio URL, transcript, duration, linked to user and date
- **Team** — name, unique invite code for joining
- **TeamMember** — user-team relationship with OWNER/MEMBER roles
- **Account / Session / VerificationToken** — NextAuth support tables

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import repo at [vercel.com](https://vercel.com) — auto-detected as Next.js
3. Set environment variables (all five: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`, `Z_AI_API_KEY`)
4. Deploy

The build script runs `prisma generate && next build` automatically. A `postinstall` hook also runs `prisma generate` as a safety net.

### Database setup

Create a [Neon](https://neon.tech) PostgreSQL project, then push the schema:

```bash
DATABASE_URL="your-neon-connection-string" npx prisma db push
```

---

## License

MIT
