# 아키텍처 문서 (Architecture)

## 시스템 개요

OpenClaw Dashboard는 OpenClaw Gateway를 안전하게 제어하기 위한 Next.js 기반 웹 대시보드입니다.
핵심 설계 원칙: **Gateway 토큰은 절대 클라이언트(브라우저)에 노출되지 않습니다.**

```
┌──────────────────────────────────────────────────────────────┐
│                        브라우저 (클라이언트)                    │
│  - React UI (Next.js App Router)                             │
│  - 세션 쿠키만 보유 (Gateway 토큰 없음)                         │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS (쿠키 기반 세션)
┌──────────────────────▼───────────────────────────────────────┐
│                   Next.js 서버 (API Routes)                   │
│  - 인증/인가 (Supabase 또는 env-auth)                          │
│  - RBAC (viewer / operator / admin)                          │
│  - Gateway 요청 릴레이 (OPENCLAW_GATEWAY_TOKEN 사용)           │
│  - 에이전트 CRUD (파일 또는 인메모리 저장소)                     │
│  - 구조화 로그 (pino), Sentry 에러 추적                         │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP (서버 전용 네트워크)
┌──────────────────────▼───────────────────────────────────────┐
│                  OpenClaw Gateway                             │
│  - AI 에이전트 실행 엔진                                        │
│  - WebSocket 스트리밍 (chat relay)                             │
└──────────────────────────────────────────────────────────────┘
```

---

## 주요 플로우 (Sequence Diagrams)

### 1. 로그인 플로우 (env-auth)

```
브라우저          Next.js API        env-auth 모듈
   │                  │                    │
   │ POST /api/auth/sign-in (email, token) │
   │─────────────────►│                    │
   │                  │ validateEnvCredentials(email, token)
   │                  │───────────────────►│
   │                  │                    │ timingSafeEqual 비교
   │                  │◄───────────────────│ EnvUser | null
   │                  │                    │
   │                  │ [성공] createSessionToken(user)
   │                  │ Set-Cookie: __openclaw_session (HttpOnly)
   │◄─────────────────│
   │ 200 { user }     │
```

### 2. 에이전트 생성 플로우

```
브라우저          Next.js API         Agent Store
   │                  │                    │
   │ POST /api/agents { name, kind }       │
   │─────────────────►│                    │
   │                  │ getSessionUser()    │
   │                  │ getAppRole() → operator
   │                  │ hasRole(operator, WRITE_MIN) → true
   │                  │ agentCreateSchema.safeParse(body) → ok
   │                  │                    │
   │                  │ createAgent(data, ownerId)
   │                  │───────────────────►│
   │                  │                    │ loadAll() → [...]
   │                  │                    │ 중복 slug 체크
   │                  │                    │ saveAll([...new]) ← atomic write
   │                  │◄───────────────────│ Agent
   │◄─────────────────│                    │
   │ 201 Agent        │
```

### 3. Gateway 채팅 릴레이 플로우

```
브라우저          Next.js API         Gateway
   │                  │                    │
   │ POST /api/openclaw/chat               │
   │─────────────────►│                    │
   │                  │ getSessionUser() → user
   │                  │ [미인증] → 401      │
   │                  │                    │
   │                  │ WebSocket connect (OPENCLAW_GATEWAY_TOKEN)
   │                  │───────────────────►│
   │                  │                    │ 인증 처리
   │                  │◄─── 스트림 응답 ───│
   │◄─── 스트림 ──────│
```

---

## 파일 구조 (핵심)

```
src/
├── app/
│   ├── api/
│   │   ├── agents/         # 에이전트 CRUD API
│   │   ├── auth/           # 로그인/로그아웃/OAuth callback
│   │   ├── health/         # liveness, readiness probe
│   │   └── openclaw/       # Gateway 릴레이 API
│   └── [locale]/           # 국제화 UI 라우트 (ko/en/ja/zh)
├── lib/
│   ├── agent/
│   │   ├── schema.ts       # Zod 검증 스키마
│   │   ├── store.ts        # 저장소 라우터 (파일 or 인메모리)
│   │   ├── store-file.ts   # JSON 파일 저장소 (atomic write)
│   │   └── store-memory.ts # 인메모리 저장소 (개발용)
│   ├── auth/
│   │   ├── env-auth.ts     # env 토큰 인증 (timingSafeEqual)
│   │   ├── get-role.ts     # RBAC 역할 추출
│   │   └── session.ts      # 세션 사용자 조회
│   ├── openclaw/
│   │   └── gateway-client.ts  # Gateway HTTP/WS 클라이언트
│   ├── logger.ts           # pino 구조화 로그
│   └── rate-limit.ts       # 인메모리 rate limiter
└── middleware.ts            # i18n + 인증 게이트
```

---

## 인증 체계

### 우선순위

1. **Supabase** (`NEXT_PUBLIC_SUPABASE_URL` 설정 시): 이메일/비밀번호 또는 OAuth
2. **env-auth** (`AUTH_USERS` 또는 `AUTH_EMAIL+AUTH_TOKEN`): HMAC-SHA256 서명 쿠키
3. **인증 없음** (아무것도 설정 안 된 경우): 개발 전용 우회 (모든 접근 허용)

### RBAC 역할

| 역할 | 에이전트 조회 | 에이전트 생성/수정/삭제 | 관리자 기능 |
|------|:------------:|:--------------------:|:---------:|
| `viewer` | ✅ | ❌ | ❌ |
| `operator` | ✅ | ✅ | ❌ |
| `admin` | ✅ | ✅ | ✅ |

---

## 데이터 저장소

### 에이전트 저장소 선택

| 환경변수 | 저장소 | 특성 |
|---------|--------|------|
| `AGENT_STORE_PATH=/path/agents.json` | JSON 파일 | 영속성, 단일 인스턴스 |
| 미설정 | 인메모리 | 재시작 시 초기화, 개발 편의 |

### 원자적 쓰기 보장

파일 저장소는 다음 순서로 원자적 쓰기를 보장합니다:

```
1. agents.json.tmp.{pid}.{timestamp} 에 먼저 쓰기
2. fs.renameSync(tmp, agents.json)  ← OS 레벨 원자적 교체
3. 실패 시 tmp 파일 삭제
```

### 마이그레이션 경로 (파일 → DB)

단일 Pod를 벗어나 수평 확장이 필요할 경우:

```bash
# 1. PostgreSQL/SQLite 마이그레이션 스크립트 (예정)
# node scripts/migrate-file-to-db.js --source ./data/agents.json --db postgres://...

# 2. 환경변수 변경
# AGENT_STORE_PATH 제거 후 DB_URL 설정

# 3. 스토어 구현체 교체 (store.ts에서 store-db.ts로 라우팅)
```

---

## 관측성 (Observability)

| 구성요소 | 구현 | 엔드포인트/설정 |
|---------|------|----------------|
| 구조화 로그 | pino | JSON (프로덕션), pretty (개발) |
| 에러 추적 | Sentry | `NEXT_PUBLIC_SENTRY_DSN` 설정 |
| Liveness probe | Next.js Route | `GET /api/health/live` |
| Readiness probe | Next.js Route | `GET /api/health/ready` |
| 커버리지 리포트 | Vitest + v8 | `npm run test:coverage` |

---

## 배포 아키텍처

### Docker (권장)

```yaml
# docker-compose.yml 프로파일
# local: 대시보드 + Gateway (로컬 개발)
# server: 동일, 실제 env 적용
```

### 환경변수 분류

| 분류 | 변수명 | 노출 범위 |
|------|--------|----------|
| 🔒 서버 전용 | `AUTH_SECRET`, `OPENCLAW_GATEWAY_TOKEN`, `AUTH_USERS` | 서버만 |
| 🌐 공개 가능 | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SENTRY_DSN` | 클라이언트 |
