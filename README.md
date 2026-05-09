# RefMaster AI

> AI-powered SaaS for automatic essay/report ("реферат") generation with template-aware formatting.

RefMaster AI takes a topic, discipline, target length, language, requirements, and optionally a sample
DOCX/PDF template, then runs a multi-step AI pipeline to:

1. Analyze the topic and template style
2. Plan a chapter structure
3. Search literature via Crossref + Semantic Scholar
4. Write the body in academic style
5. Generate introduction, conclusion, bibliography
6. Render the final document as DOCX (and PDF via LibreOffice)

## Tech stack

| Layer       | Stack                                                                 |
|-------------|-----------------------------------------------------------------------|
| Frontend    | Next.js 15 (App Router), TypeScript, TailwindCSS, ShadCN UI, Framer   |
| Backend     | Node.js, Express, Prisma, PostgreSQL                                  |
| AI          | OpenAI API, multi-step pipeline, RAG over fetched sources             |
| Docs        | `mammoth`, `pdf-parse`, `docx`, LibreOffice (DOCX → PDF)              |
| Realtime    | WebSocket progress channel (Socket.IO)                                |
| Auth        | JWT + Google OAuth, rate limiting, hCaptcha                           |
| Billing     | Stripe subscriptions (Free / Premium)                                 |
| Storage     | Local `/uploads` with pluggable cloud adapter                         |
| Deployment  | Docker, docker-compose, Vercel (frontend), Railway (backend)          |

## Repository layout

```
.
├── backend/        Express API, Prisma schema, AI services, DOCX engine
├── frontend/       Next.js 15 app (Landing, Dashboard, Generate, Admin, etc.)
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick start (local dev)

```bash
# 1. Copy env files and fill them in
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Bring up Postgres + backend + frontend
docker compose up -d --build

# Or run pieces directly:
cd backend && npm install && npx prisma migrate dev && npm run dev
cd frontend && npm install && npm run dev
```

The frontend runs on http://localhost:3000 and the backend on http://localhost:4000.

## Required environment variables

See `.env.example` files. The minimum to generate a real essay end-to-end:

- `OPENAI_API_KEY`
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_API_URL`

Stripe / Google OAuth / hCaptcha are optional but enable monetization, social login,
and bot protection respectively.

## Deployment

- **Frontend (Vercel):** import `frontend/` as a Next.js project, set `NEXT_PUBLIC_API_URL` to your backend URL.
- **Backend (Railway):** deploy from `backend/` with `Dockerfile`, attach a Postgres plugin,
  set the env vars from `backend/.env.example`.
- **Self-hosted:** `docker compose up -d --build` brings up the full stack including Postgres.

## License

MIT
