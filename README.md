# THE LAB

**AI Demo Builder** — An internal tool for creating branded, AI-powered chat demos for prospective clients.

THE LAB is part of the **Funnel Finished** platform, a tech-enabled service bureau for AI-powered customer engagement. Operators use THE LAB to configure AI agents for four mission types, then share a Magic Link with prospects to experience the agent firsthand.

## How It Works

1. **Choose a Mission** — Select from Database Reactivation, Inbound Nurture, Customer Service, or Review Generation
2. **Scrape & Configure** — Enter a company URL, auto-extract context, customize products/offers
3. **Select a Model** — Choose the AI model via OpenRouter
4. **Preview & Test** — Live preview the agent on Step 5 before deploying
5. **Share a Magic Link** — Generate an expiring link + QR code for the prospect

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| AI | OpenRouter (multi-model) |
| Scraping | Cheerio + Jina AI fallback |
| Testing | Vitest + React Testing Library + Storybook |
| Icons | Lucide React |

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase and OpenRouter keys

# Run development server
npm run dev

# Open in browser
open http://localhost:3000/lab
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:storybook` | Run Storybook interaction tests |
| `npm run test:all` | Run all tests |
| `npm run storybook` | Launch Storybook (port 6006) |
| `npm run build-storybook` | Build static Storybook |

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/
│   │   ├── chat/route.ts         # AI chat (streaming, session-aware)
│   │   ├── demo/route.ts         # Demo CRUD (create, list)
│   │   ├── demo/[id]/route.ts    # Demo by ID (get, update, delete)
│   │   └── scrape/route.ts       # URL scraping
│   ├── demo/[id]/page.tsx        # External demo chat (Magic Link)
│   ├── lab/
│   │   ├── page.tsx              # LAB home (demo list)
│   │   ├── new/page.tsx          # New demo builder
│   │   ├── [id]/page.tsx         # Resume/edit draft
│   │   └── success/page.tsx      # Magic Link display
│   └── globals.css               # Design system tokens
├── components/
│   └── ui/                       # 23 design system components
│       ├── __stories__/           # Storybook stories
│       └── __tests__/             # Unit tests
├── lib/                          # Utilities
│   ├── prompts.ts                # Mission profile templates
│   ├── openrouter.ts             # AI client
│   ├── scraper.ts                # Web scraper
│   ├── supabase.ts               # Database client
│   ├── creatorId.ts              # Temporary user scoping
│   ├── useAutosave.ts            # Draft autosave hook
│   └── database.types.ts         # TypeScript DB types
└── test/
    └── setup.ts                  # Vitest setup
```

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design, data flow, technical decisions |
| [Design System](docs/design-system.md) | Colors, typography, component specifications |
| [API Reference](docs/api-reference.md) | REST API endpoints and payloads |
| [Database Schema](docs/database.md) | Tables, columns, RLS policies |
| [Testing](docs/testing.md) | Testing strategy, tools, and conventions |
| [Storybook](docs/storybook.md) | Component catalog and interaction tests |
| [Roadmap](docs/roadmap.md) | Phases, current status, and future plans |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side) |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |

## License

Private — Funnel Finished, Inc.
