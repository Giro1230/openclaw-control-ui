# OpenClaw Control UI (Custom)

## Goal
- Supabase login/auth
- Custom dashboard pages (sessions, agents, settings)
- Korean i18n support
- Safe separation between app auth and OpenClaw gateway auth

## Recommended Stack
- Next.js + TypeScript + Tailwind + shadcn/ui
- Supabase (Auth + Postgres + RLS)
- OpenClaw Gateway relay (server-side)
- Caddy/Nginx for HTTPS

## Security
- Never expose gateway token in browser.
- Keep gateway token server-side only.
- RBAC: viewer/operator/admin.

## MVP
1) Login
2) Session list
3) Chat relay
4) Agent/settings page
5) ko/en i18n
