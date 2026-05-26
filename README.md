# ThinkWithAI

An AI-powered learning and problem-solving companion built with Next.js and Claude. ThinkWithAI takes a user question, detects whether the user wants to **learn** a concept or **solve** a specific task, then guides them through it step by step with AI-generated explanations, recall questions, and code validation.

## Features

- **Mode detection** — automatically classifies the question as `LEARN` (understand a concept) or `SOLVE` (complete a task).
- **Topic overview** — generates a high-level overview of the topic before diving in.
- **Step-by-step concepts** — breaks the topic into ordered concepts with theory and a follow-up coding stage.
- **Answer & code validation** — checks the user's written answer and code attempts and returns AI feedback.
- **Domain detection & expansion suggestions** — supporting routes for richer, context-aware sessions.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19
- [Tailwind CSS 4](https://tailwindcss.com)
- [Anthropic Claude](https://www.anthropic.com) via `@anthropic-ai/sdk`
- [Supabase](https://supabase.com) JS client
- `axios`, `lucide-react`, `react-toastify`

## Project Structure

```
thinkwithai/
└── frontend/
    ├── app/
    │   ├── page.js                 # Main UI (question input, concept flow)
    │   ├── layout.js
    │   ├── globals.css
    │   └── api/
    │       ├── detect-mode/            # LEARN vs SOLVE classifier
    │       ├── detect-domain/          # Domain detection
    │       ├── generate-overview/      # Topic overview
    │       ├── generate-conceptual-guide/
    │       ├── generate-problem-steps/ # Ordered concept/step list
    │       ├── generate-solution/
    │       ├── suggest-expansion/
    │       └── validate-step/          # Validates user answer / code
    ├── public/
    ├── package.json
    └── next.config.mjs
```

## Getting Started

### Prerequisites

- Node.js 18.18+ (Node 20+ recommended)
- An Anthropic API key

### Install

```bash
cd frontend
npm install
```

### Environment Variables

Create a `.env.local` file inside `frontend/`:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key
# Optional, if you wire up Supabase:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other scripts

```bash
npm run build   # Production build
npm run start   # Run the production build
npm run lint    # Lint the project
```

## API Routes

All routes live under `frontend/app/api/` and are called from the client via `axios`.

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/detect-mode` | POST | Classifies the question as `LEARN` or `SOLVE`. |
| `/api/detect-domain` | POST | Detects the domain of the question. |
| `/api/generate-overview` | POST | Generates a topic overview for the chosen mode. |
| `/api/generate-conceptual-guide` | POST | Builds a conceptual guide. |
| `/api/generate-problem-steps` | POST | Breaks the topic into ordered concepts/steps. |
| `/api/generate-solution` | POST | Generates a worked solution. |
| `/api/suggest-expansion` | POST | Suggests follow-up expansions. |
| `/api/validate-step` | POST | Validates a user's answer or code submission. |

## How It Works

1. The user types a question on the home page.
2. `detect-mode` decides whether to enter `LEARN` or `SOLVE` flow.
3. `generate-overview` produces a short overview the user can read first.
4. `generate-problem-steps` returns an ordered list of concepts.
5. For each concept the user moves through a `theory` stage and then a `code` stage; submissions are scored by `validate-step`.
6. When all concepts are completed the session ends.

## Deployment

The project deploys cleanly on [Vercel](https://vercel.com). Set `ANTHROPIC_API_KEY` (and any Supabase variables you use) in the project's environment settings, then deploy the `frontend/` directory.

