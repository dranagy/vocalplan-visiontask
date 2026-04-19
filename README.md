# VocalPlan + VisionTask

AI-powered multi-modal task management platform. Capture tasks by **voice** or **photo**, then organize them through an **Eisenhower Matrix** (priority) or **Kanban Board** (workflow) view.

---

## How It Works

1. **Register / log in** with email and password
2. **Capture tasks two ways:**
   - **Voice recording** — speak naturally, AI extracts and categorizes tasks
   - **Photo upload** — snap a whiteboard or handwritten notes, AI extracts tasks
3. **View and organize** with a toggle between:
   - **Eisenhower Matrix** — 4-quadrant priority grid (Do First / Schedule / Delegate / Eliminate)
   - **Kanban Board** — columns by assignee with drag-and-drop workflow
4. **Collaborate with teams** — create teams, share invite codes, manage shared tasks
5. **Export reports** — CSV, Excel, or PNG image
6. **Review analytics** — completion rates, source breakdown, trends over time

---

## Features

### Capture (Input)
- **Voice recording** — speak your tasks, AI transcribes and categorizes them
- **Photo/whiteboard upload** — AI extracts tasks from handwritten notes and sketches
- **Manual task creation** — add tasks by hand when needed
- **Dual AI providers** — switch between Google Gemini and Z.AI GLM

### Organize (Views)
- **Eisenhower Matrix** — drag-and-drop 4-quadrant priority grid
- **Kanban Board** — multi-column board with per-assignee columns, drag-and-drop
- **Calendar navigation** — plan tasks for any date
- **View toggle** — switch between Priority and Board views for the same tasks

### Collaborate & Export
- **Team collaboration** — create teams, invite members via code, shared tasks
- **Export to CSV, Excel, PNG** — generate reports from either view
- **Analytics dashboard** — completion charts, quadrant distribution, source breakdown

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | NextAuth v5 (credentials provider, JWT sessions) |
| AI — Voice | Google Gemini 3 Flash + Z.AI GLM (ASR + categorization) |
| AI — Vision | Google Gemini 3 Flash (image-to-task extraction) |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Export | XLSX, html2canvas |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (or a [Neon](https://neon.tech) account)
- At least one AI provider API key (Gemini recommended)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```env
GEMINI_API_KEY=your_gemini_key          # Required — Get from https://aistudio.google.com/apikey
Z_AI_API_KEY=your_zai_key               # Optional — Get from https://z.ai

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

---

## Project Structure

```
├── app/
│   ├── (auth)/                    # Auth route group (public)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Protected route group
│   │   ├── planner/page.tsx       # Main planner (voice + Eisenhower/Kanban)
│   │   ├── board/page.tsx         # Dedicated Kanban board page
│   │   ├── analytics/page.tsx     # Usage analytics dashboard
│   │   └── teams/page.tsx         # Team management
│   ├── api/
│   │   ├── analyze/route.ts       # Voice analysis (Gemini / GLM)
│   │   ├── analyze-image/route.ts # Image analysis (Gemini Vision)
│   │   ├── tasks/route.ts         # Task CRUD (supports status, assigneeId, source)
│   │   ├── voice-notes/route.ts   # Voice note management
│   │   ├── image-notes/route.ts   # Image note management
│   │   ├── teams/                 # Team creation + invite codes
│   │   ├── analytics/route.ts     # Usage statistics
│   │   └── auth/                  # NextAuth handlers + registration
│   ├── layout.tsx
│   ├── error.tsx
│   └── loading.tsx
├── components/
│   ├── PlannerApp.tsx             # Main orchestrator with view switching
│   ├── EisenhowerMatrix.tsx       # 4-quadrant drag-and-drop grid
│   ├── VoiceRecorder.tsx          # Mic recording + provider toggle
│   ├── SortableTask.tsx           # Draggable task card for Eisenhower
│   ├── TeamSelector.tsx           # Personal / team context toggle
│   ├── CalendarWheel.tsx          # Date picker strip
│   ├── kanban/
│   │   ├── KanbanBoard.tsx        # Kanban orchestrator with @dnd-kit
│   │   ├── KanbanColumn.tsx       # Droppable column per assignee
│   │   ├── KanbanTaskCard.tsx     # Sortable task card with status/source badges
│   │   └── ImageUploader.tsx      # Photo capture + upload UI
│   ├── shared/
│   │   ├── ViewToggle.tsx         # Eisenhower / Kanban toggle
│   │   └── ExportMenu.tsx         # CSV / Excel / PNG export dropdown
│   └── analytics/                 # Chart components (Recharts)
├── lib/
│   ├── auth.ts                    # NextAuth v5 configuration
│   ├── prisma.ts                  # Prisma client singleton
│   ├── gemini.ts                  # Gemini voice provider
│   ├── glm.ts                     # GLM voice provider
│   ├── gemini-vision.ts           # Gemini Vision image-to-task extraction
│   └── export/                    # Export utilities (CSV, Excel, PNG)
├── prisma/
│   └── schema.prisma              # Database schema (9 models, 4 enums)
├── types.ts                       # Shared TypeScript types
└── middleware.ts                  # Auth middleware (route protection)
```

---

## AI Providers

### Voice Analysis
- **Gemini** — single API call, audio up to ~5 min, structured JSON output
- **GLM (Z.AI)** — two-step (ASR + categorization), audio up to ~30 sec

### Image Analysis
- **Gemini Vision** — analyzes whiteboard/handwritten photos, extracts tasks with titles, descriptions, deadlines, and assignees

---

## Database Schema

PostgreSQL with Prisma ORM. Core models:

- **User** — email/password auth, owns tasks, voice notes, image notes
- **Task** — title, description, Eisenhower category, Kanban status, source (voice/image/manual), assignee, date, deadline, team
- **VoiceNote** — audio URL, transcript, duration, linked to user and date
- **ImageNote** — image URL, extracted text, linked to user, team, and date
- **Team** — name, unique invite code for joining
- **TeamMember** — user-team relationship with OWNER/ADMIN/MEMBER roles
- **Account / Session / VerificationToken** — NextAuth support tables

---

## Deployment (Vercel + Neon)

1. Push to GitHub
2. Create a [Neon](https://neon.tech) PostgreSQL project, then push the schema:
   ```bash
   DATABASE_URL="your-neon-connection-string" npx prisma db push
   ```
3. Import repo at [vercel.com](https://vercel.com) — auto-detected as Next.js
4. Set environment variables:
   - `DATABASE_URL` — Neon connection string
   - `GEMINI_API_KEY` — your Gemini API key
   - `NEXTAUTH_SECRET` — `openssl rand -base64 32`
   - `NEXTAUTH_URL` — your Vercel app URL
   - `Z_AI_API_KEY` — *(optional)*
5. Deploy

The build script runs `prisma generate && next build` automatically.

---

## License

MIT
