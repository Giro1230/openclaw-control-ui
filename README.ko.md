# OpenClaw Dashboard

> OpenClaw를 올바르게 사용하기 위한 커스텀 제어 UI.  
> Supabase 앱 인증과 OpenClaw Gateway 토큰을 분리하고, 에이전트·세션·채팅을 한 곳에서 관리한다.

[![Build](https://img.shields.io/badge/build-passing-brightgreen)](#빌드--테스트)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](tsconfig.json)
[![License](https://img.shields.io/badge/license-AGPL--3.0-blue)](LICENSE)

**다른 언어로 읽기:**
[🇺🇸 English](README.md) · [🇯🇵 日本語](README.ja.md) · [🇨🇳 简体中文](README.zh.md)

---

## 목적

**이 UI는 OpenClaw를 제대로 사용하기 위해 만든다.**

| 원칙 | 설명 |
|------|------|
| 토큰 분리 | Gateway 토큰은 서버 전용. 브라우저에 절대 노출하지 않는다. |
| 서버 릴레이 | 모든 Gateway 통신은 Next.js API Route를 통해서만 수행한다. |
| 최소 구현 | "OpenClaw 사용 흐름에 꼭 필요한가?"를 기준으로 기능을 추가한다. |

---

## 빌드 · 테스트

| 항목 | 결과 |
|------|------|
| TypeScript 타입 체크 (`tsc --noEmit`) | ✅ 오류 없음 |
| ESLint (`next lint`) | ✅ 경고·오류 없음 |
| 프로덕션 빌드 (`next build`) | ✅ 16개 페이지/라우트 정상 생성 |
| Docker Compose 구성 | ✅ local / server 프로필 |

### 라우트 목록

```
/                             홈 — 에이전트 현황
/login                        로그인 (Supabase 이메일/비밀번호)
/agents                       에이전트 목록
/agents/new                   에이전트 생성
/agents/[id]                  에이전트 상세 · 수정
/sessions                     세션 목록 (Gateway 연결 시 실데이터)
/settings                     설정
/api/agents                   에이전트 CRUD API
/api/agents/[id]              에이전트 단건 API
/api/auth/sign-in             Supabase 로그인
/api/auth/sign-out            Supabase 로그아웃
/api/auth/callback            OAuth / 이메일 확인 콜백
/api/openclaw/status          Gateway 상태 릴레이
/api/openclaw/sessions        Gateway 세션 목록 릴레이
/api/openclaw/chat            Gateway 채팅 릴레이
```

---

## 스택

| 영역 | 선택 |
|------|------|
| 프레임워크 | Next.js 15 (App Router, standalone) |
| 언어 | TypeScript (strict) |
| UI | Tailwind CSS + **shadcn/ui** + **DaisyUI** |
| i18n | next-intl (ko · en · ja · zh, 타임존 env 설정) |
| 인증 | Supabase Auth + SSR 클라이언트 |
| 에이전트 저장소 | JSON 파일(`AGENT_STORE_PATH`) 또는 인메모리 |
| Gateway 통신 | 서버 전용 WebSocket 릴레이 (`ws` 패키지) |
| 검증 | Zod |
| 컨테이너 | Docker · Docker Compose (local / server 프로필) |

---

## 스크린샷

> `npm run dev` 또는 `docker compose --profile local up -d` 로 실행한 뒤 스크린샷을 추가하세요.

| 페이지 | 경로 |
|--------|------|
| 로그인 | `/login` |
| 에이전트 목록 | `/agents` |
| 에이전트 생성 | `/agents/new` |
| 세션 목록 | `/sessions` |
| 설정 | `/settings` |

---

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp examples/env.local.example .env.local
# .env.local을 열어 값 확인 · 수정
```

### 3. 개발 서버

```bash
npm run dev
# http://localhost:3000
```

### 4. Docker Compose (Gateway 포함)

```bash
# 로컬 개발
docker compose --profile local up -d

# 서버 배포
docker compose --profile server up -d
```

---

## 필요한 것 / 필요 없는 것

### 필요한 것

| 구분 | 내용 | 구현 상태 |
|------|------|-----------|
| Gateway 릴레이 | 서버에서만 Gateway 호출, 토큰 노출 금지 | ✅ status · chat · sessions |
| 에이전트 관리 | 생성·수정·삭제·RBAC·Zod 검증 | ✅ |
| i18n · 테마 | ko/en/ja/zh, 테마 전환(DaisyUI) | ✅ |
| 로그인 · 권한 | Supabase 이메일/비밀번호 + viewer/operator/admin | ✅ |
| 채팅 릴레이 | 사용자 ↔ 서버 API ↔ Gateway | ✅ `/api/openclaw/chat` |
| 세션 목록 | Gateway 세션 실데이터 표시 | ✅ Gateway 연결 시 자동 표시 |

### 필요 없는 것

| 구분 | 이유 |
|------|------|
| 브라우저에 Gateway 토큰 | 보안상 절대 불가 |
| 공식 Controller UI 완전 복제 | 디바이스 승인 등은 필요 시에만 선택 추가 |
| 과한 대시보드 위젯 | OpenClaw 사용에 직결될 때만 추가 |
| 클라이언트 직접 Gateway 호출 | 모든 통신은 서버 경유 |

---

## API 참조

### 채팅 릴레이
```http
POST /api/openclaw/chat
Content-Type: application/json

{
  "message": "안녕하세요",
  "agent_id": "agt_xxx",
  "session_id": "선택사항"
}
```

### Gateway 상태
```http
GET /api/openclaw/status
# → { "ok": true, "status": { ... } }
# Gateway 토큰은 서버에서만 사용됨
```

### 에이전트 생성
```http
POST /api/agents
Content-Type: application/json

{
  "name": "내 에이전트",
  "kind": "assistant",
  "config": { "model": "gpt-4o" }
}
```

---

## 에이전트 저장소

`AGENT_STORE_PATH` 환경 변수로 선택:

```bash
# JSON 파일 저장 (재시작해도 유지)
AGENT_STORE_PATH=./data/agents.json

# 설정 없음 → 인메모리 (재시작 시 초기화, 개발용)
```

추후 Supabase `agents` 테이블 + RLS로 교체 가능.

---

## RBAC

| 역할 | 에이전트 조회 | 에이전트 생성·수정·삭제 |
|------|:---:|:---:|
| viewer | ✅ | ❌ |
| operator | ✅ | ✅ |
| admin | ✅ | ✅ |

역할은 Supabase 세션(`user.app_metadata.role`)에서 읽습니다.  
Supabase 미설정 시 `x-app-role` 헤더로 폴백 (개발용).

---

## Docker Compose

### 로컬 개발

```bash
cp examples/env.local.example .env
docker compose --profile local up -d
```

- 대시보드: http://localhost:3000
- Gateway: ws://localhost:18789

### 서버 배포

```bash
cp examples/env.server.example .env
# 실제 값으로 교체 후:
docker compose --profile server up -d
```

---

## 보안 원칙

- `OPENCLAW_GATEWAY_URL` · `OPENCLAW_GATEWAY_TOKEN` 은 서버 전용 env. `NEXT_PUBLIC_` 접두사 절대 금지.
- 모든 Gateway WebSocket 연결은 `src/lib/openclaw/gateway-client.ts`에서만 수행.
- Supabase anon key만 `NEXT_PUBLIC_*` 으로 브라우저에 전달.

---

## 라이선스

이 프로젝트는 [GNU Affero General Public License v3.0](LICENSE) 라이선스를 따릅니다.  
수정된 버전을 네트워크 서비스로 배포하는 경우, 사용자에게 소스 코드를 공개해야 합니다.
