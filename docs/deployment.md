# Deployment Guide

THE LAB deploys to **Vercel** as a Next.js application.

## Prerequisites

- Git repository connected to GitHub (or GitLab/Bitbucket)
- Supabase project created and migrations applied
- OpenRouter API key

---

## 1. Configure Vercel Project

### Option A: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub recommended)
2. Click **Add New** → **Project**
3. Import your Git repository
4. Vercel auto-detects Next.js — no framework override needed
5. Click **Deploy** (you can add env vars before or after first deploy)

### Option B: Deploy via Vercel CLI

```bash
npm i -g vercel
vercel login
vercel          # Preview deployment
vercel --prod   # Production deployment
```

---

## 2. Environment Variables

Add these in **Vercel Dashboard** → Project → **Settings** → **Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key for AI chat |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side) |
| `NEXT_PUBLIC_APP_URL` | After 1st deploy | Your deployed URL (see workflow below) |
| `JINA_API_KEY` | No | Jina AI key for fallback scraping |

### First-time workflow (you don't know the URL yet)

1. **Add the other env vars** (OpenRouter, Supabase) before or during the first deploy.
2. **Deploy** — Vercel assigns a URL (e.g. `https://the-lab-abc123.vercel.app`).
3. **Copy the URL** from the deployment success page or **Settings** → **Domains**.
4. **Add** `NEXT_PUBLIC_APP_URL` = your deployed URL (e.g. `https://the-lab.vercel.app`).
5. **Redeploy** — Vercel will trigger a new build, or push a small change to trigger one.

Magic links and CORS will work correctly after step 5. Until then, magic links may point to localhost.

---

## 3. Preview Deployments

Preview deployments are **automatic** when using Git:

- Every push to a non-default branch creates a preview URL
- Pull requests get a dedicated preview URL (e.g. `the-lab-git-feature-xyz.vercel.app`)
- Previews use the same env vars as production unless overridden

No extra configuration required when using Vercel's Git integration.

---

## 4. Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain (e.g. `thelab.example.com`)
3. Follow DNS instructions (A record or CNAME)
4. Update `NEXT_PUBLIC_APP_URL` to your custom domain
5. Redeploy to apply the change

---

## 5. Verify Production Build

Before deploying, ensure the build succeeds locally:

```bash
npm run build
```

Expected: Compiled successfully, no TypeScript errors.

---

## 6. Deploy to Production

- **From Git:** Push to your default branch (e.g. `main`) to trigger production deploy
- **From CLI:** Run `vercel --prod` from the project root

---

## 7. Smoke Test Critical Paths

After deployment, verify these flows:

| Path | Action |
|------|--------|
| `/` | Home page loads |
| `/lab` | LAB home loads, demo list works |
| `/lab/new` | Builder loads, can create draft |
| `/lab/success` | Success page loads (requires `?id=<uuid>`) |
| `/demo/[id]` | Chat loads for active demo |

### Automated Smoke Test (Playwright)

Run E2E tests against your deployed URL (skips starting local dev server):

```bash
BASE_URL=https://your-app.vercel.app npm run test:e2e
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Magic links point to localhost | Set `NEXT_PUBLIC_APP_URL` in Vercel env vars |
| CORS errors on API | Ensure `NEXT_PUBLIC_APP_URL` matches the deployed origin |
| 503 on chat | Verify `OPENROUTER_API_KEY` is set |
| Supabase errors | Verify all three Supabase env vars are set |
| Build fails | Run `npm run build` locally; check for TypeScript/lint errors |
