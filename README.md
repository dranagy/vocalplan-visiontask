# VocalPlan

Voice-powered Eisenhower Matrix task organizer. Record a voice note and AI automatically categorizes your tasks by urgency and importance.

## Features

- **Voice recording** — speak your tasks, AI does the rest
- **Dual AI provider** — choose between Google Gemini and Z.AI GLM
- **Eisenhower Matrix** — 4-quadrant priority grid (Do First / Schedule / Delegate / Eliminate)
- **Calendar navigation** — plan tasks for any date
- **Persistent storage** — tasks and voice notes saved in localStorage
- **PWA installable** — works offline as a standalone app

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI Providers**:
  - Google Gemini (`gemini-3-flash-preview`) — single-call audio analysis
  - Z.AI GLM (`GLM-ASR-2512` + `glm-5-turbo`) — transcription + categorization

## Getting Started

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure API keys in `.env.local`:
   ```
   GEMINI_API_KEY=your_key_here
   Z_AI_API_KEY=your_key_here
   ```
   Only one provider key is required. Set both to switch between providers in the UI.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## Project Structure

```
├── app/
│   ├── api/analyze/route.ts   # Server-side AI analysis endpoint
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── error.tsx               # Error boundary
│   └── loading.tsx             # Loading skeleton
├── components/
│   ├── PlannerApp.tsx          # Main app logic (client)
│   ├── VoiceRecorder.tsx       # Mic recording + provider toggle
│   ├── CalendarWheel.tsx       # Date picker strip
│   ├── EisenhowerMatrix.tsx    # 4-quadrant task grid
│   ├── VoiceNoteList.tsx       # Audio playback list
│   └── ToastProvider.tsx       # Toast notification wrapper
├── lib/
│   ├── gemini.ts               # Gemini provider logic
│   └── glm.ts                  # GLM provider logic (ASR + categorization)
├── types.ts                    # Shared TypeScript types
└── public/
    ├── manifest.json           # PWA manifest
    └── sw.js                   # Service worker
```

## Deployment

Optimized for [Vercel](https://vercel.com). Push to GitHub and import the repo — Vercel auto-detects Next.js. Set `GEMINI_API_KEY` and `Z_AI_API_KEY` as environment variables in the Vercel dashboard.

## License

MIT
