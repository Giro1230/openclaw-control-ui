# examples/

Environment variable example files for the OpenClaw Dashboard.

| File | Purpose |
|------|---------|
| `env.local.example` | Local development (`.env.local`) |
| `env.server.example` | Server/Docker deployment (`.env`) |

## Quick start

```bash
# Local development
cp examples/env.local.example .env.local

# Server deployment
cp examples/env.server.example .env
```

## Verification

After configuring the environment, use these endpoints to confirm the service is running correctly.

```bash
# Liveness probe (no auth required)
curl http://localhost:3000/api/health/live

# Readiness probe — checks Gateway and Supabase connectivity
curl http://localhost:3000/api/health/ready

# Gateway status — authentication required (sign in first)
curl -b cookie.jar http://localhost:3000/api/openclaw/status

# Agent list — authentication required
curl -b cookie.jar http://localhost:3000/api/agents
```

> `GET /api/openclaw/status` requires a valid session cookie.  
> Unauthenticated requests return `401 Unauthorized`.
