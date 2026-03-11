# OpenClaw Dashboard

> A custom control UI for using OpenClaw properly.  
> Separates Supabase app auth from OpenClaw Gateway tokens, and manages agents, sessions, and chat in one place.

[![CI](https://github.com/hellowin1230/openclawdashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/hellowin1230/openclawdashboard/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](tsconfig.json)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)

**Read this in other languages:**
[🇰🇷 한국어](README.ko.md) · [🇯🇵 日本語](README.ja.md) · [🇨🇳 简体中文](README.zh.md)

---

## Purpose

**This UI is built to use OpenClaw the right way.**

| Principle | Description |
|-----------|-------------|
| Token separation | Gateway token stays server-side only. Never exposed to the browser. |
| Server relay | All Gateway communication goes through Next.js API Routes only. |
| Minimal scope | Every feature must answer: "Is this required for the OpenClaw workflow?" |

---

## Build & Test

| Check | Result |
|-------|--------|
| TypeScript (`npm run typecheck`) | ✅ No errors |
| ESLint (`npm run lint`) | ✅ No warnings or errors |
| Unit & API tests (`npm run test`) | ✅ 71 tests passing |
| Production build (`npm run build`) | ✅ All routes built successfully |
| Docker Compose | ✅ `local` and `server` profiles |

### Routes

```
/                             Home — agent overview
/login                        Login (Supabase or env-auth)
/agents                       Agent list
/agents/new                   Create agent
/agents/[id]                  Agent detail & edit
/sessions                     Session list (live data when Gateway connected)
/settings                     Settings
/api/agents                   Agent CRUD API
/api/agents/[id]              Agent single-item API
/api/auth/sign-in             Sign-in (Supabase or env-auth)
/api/auth/sign-out            Sign-out
/api/auth/callback            OAuth / email confirmation callback
/api/openclaw/status          Gateway status relay (auth required)
/api/openclaw/sessions        Gateway session list relay (auth required)
/api/openclaw/chat            Gateway chat relay (auth required)
/api/health/live              Liveness probe
/api/health/ready             Readiness probe (Gateway & Supabase checks)
```

---

## Stack

| Area | Choice |
|------|--------|
| Framework | Next.js 15 (App Router, standalone output) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS + **shadcn/ui** + **DaisyUI** |
| i18n | next-intl (ko · en · ja · zh, env-configurable timezone) |
| Auth | Supabase Auth **or** env-auth (AUTH_USERS) |
| Testing | Vitest + Testing Library / Playwright (E2E) |
| Agent store | JSON file (`AGENT_STORE_PATH`) or in-memory |
| Gateway | Server-only WebSocket relay (`ws` package) |
| Validation | Zod |
| Container | Docker · Docker Compose (local / server profiles) |

---

## Screenshots

> Run `npm run dev` or `docker compose --profile local up -d`, then capture screenshots here.

| Page | Path |
|------|------|
| Login | `/login` |
| Agent list | `/agents` |
| Create agent | `/agents/new` |
| Sessions | `/sessions` |
| Settings | `/settings` |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

```bash
cp examples/env.local.example .env.local
# Edit .env.local with your values
```

### 3. Dev server

```bash
npm run dev
# http://localhost:3000
```

### 4. Docker Compose (with Gateway)

```bash
# Local dev (dashboard + OpenClaw Gateway)
docker compose --profile local up -d

# Server deployment
docker compose --profile server up -d
```

---

## What's In / What's Out

### In (essential for using OpenClaw)

| Feature | Details | Status |
|---------|---------|--------|
| Gateway relay | Server-only calls, no token leak | ✅ status · chat · sessions |
| Agent management | CRUD, RBAC, Zod validation | ✅ |
| i18n · themes | ko/en/ja/zh, DaisyUI theme switching | ✅ |
| Login · RBAC | Supabase email/password + viewer/operator/admin | ✅ |
| Chat relay | User ↔ API ↔ Gateway | ✅ `/api/openclaw/chat` |
| Session list | Live data from Gateway | ✅ auto-loads when Gateway connected |

### Out (excluded for now)

| Feature | Reason |
|---------|--------|
| Gateway token in browser | Security — never allowed |
| Full replication of official Controller UI | Device approval etc. added only when needed |
| Heavy dashboard widgets | Cost charts, cron jobs added only when directly needed |
| Direct client→Gateway calls | All communication must go through the server |

---

## API Reference

### Agent list
```http
GET /api/agents
```

### Create agent
```http
POST /api/agents
Content-Type: application/json

{
  "name": "my-agent",
  "kind": "assistant",
  "config": { "model": "gpt-4o" }
}
```

### Update agent
```http
PATCH /api/agents/:id
Content-Type: application/json

{ "name": "updated-name" }
```

### Delete agent
```http
DELETE /api/agents/:id
```

### Chat relay
```http
POST /api/openclaw/chat
Content-Type: application/json

{
  "message": "Hello",
  "agent_id": "agt_xxx",
  "session_id": "optional"
}
```

### Gateway status
```http
GET /api/openclaw/status
# → { "ok": true, "status": { ... } }
```

---

## Agent Store

Controlled by the `AGENT_STORE_PATH` env var:

```bash
# Persistent JSON file
AGENT_STORE_PATH=./data/agents.json

# No value → in-memory (reset on restart, for development)
```

Can be migrated to a Supabase `agents` table with RLS later.

---

## i18n

- **Locales**: `ko` (default) · `en` · `ja` · `zh`
- **Translation files**: `src/messages/{ko,en,ja,zh}.json`
- **Timezone**: Set via `I18N_TIMEZONE` env var (default: `Asia/Seoul`)
- **Switching**: Locale dropdown in the nav bar — same path, different locale

---

## RBAC

| Role | View agents | Create / Edit / Delete |
|------|:-----------:|:----------------------:|
| viewer | ✅ | ❌ |
| operator | ✅ | ✅ |
| admin | ✅ | ✅ |

Role is read from the Supabase session (`user.app_metadata.role`).  
Falls back to the `x-app-role` header when Supabase is not configured (dev).

---

## Docker Compose

### Local dev

```bash
cp examples/env.local.example .env
docker compose --profile local up -d
```

- Dashboard: http://localhost:3000
- Gateway: ws://localhost:18789

### Server deployment

```bash
cp examples/env.server.example .env
# Replace values with real credentials, then:
docker compose --profile server up -d
```

Set `OPENCLAW_GATEWAY_TOKEN` to enable Gateway authentication.

---

## Security

- `OPENCLAW_GATEWAY_URL` and `OPENCLAW_GATEWAY_TOKEN` are **server-only** env vars. Never prefix them with `NEXT_PUBLIC_`.
- All WebSocket connections to the Gateway are made exclusively in `src/lib/openclaw/gateway-client.ts`.
- Only the Supabase anon key is exposed to the browser via `NEXT_PUBLIC_*`.

---

## Directory Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agents/           Agent CRUD API
│   │   ├── auth/             Sign-in / sign-out / callback
│   │   └── openclaw/         Gateway relay APIs
│   ├── agents/               Agent UI pages
│   ├── login/                Login page
│   ├── sessions/             Sessions page
│   └── settings/             Settings page
├── components/
│   ├── ui/                   shadcn base components
│   ├── app-nav.tsx           Navbar (locale & theme switcher)
│   ├── auth-menu.tsx         Auth status + sign-out
│   ├── locale-switcher.tsx
│   └── theme-switcher.tsx
├── i18n/
│   ├── routing.ts            next-intl routing config
│   ├── navigation.ts         Type-safe Link · useRouter
│   └── request.ts            Server i18n config (timezone)
├── lib/
│   ├── agent/
│   │   ├── schema.ts         Zod schemas
│   │   ├── store.ts          Store facade
│   │   ├── store-file.ts     JSON file store
│   │   └── store-memory.ts   In-memory store
│   ├── auth/
│   │   ├── get-role.ts       RBAC helpers
│   │   └── session.ts        Supabase session utilities
│   ├── openclaw/
│   │   └── gateway-client.ts Gateway WebSocket relay
│   └── supabase/
│       ├── client.ts         Browser Supabase client
│       └── server.ts         Server Supabase client (SSR)
├── messages/                 Translation files (ko/en/ja/zh)
└── types/                    Agent · RBAC type definitions
examples/
├── env.local.example         Local dev env sample
├── env.server.example        Server deployment env sample
└── README.md                 Example usage guide
docker-compose.yml            local / server profiles
Dockerfile                    Multi-stage (standalone)
LICENSE                       AGPL-3.0
```

---

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
If you deploy a modified version as a network service, you must make the source code available to users.
