# 보안 정책 (Security Policy)

## 지원 버전 (Supported Versions)

| 버전 | 보안 패치 지원 |
|------|--------------|
| 최신 main | ✅ 지원 |
| 이전 릴리즈 | ❌ 미지원 |

---

## 취약점 신고 방법 (Reporting a Vulnerability)

보안 취약점을 발견하신 경우 **GitHub Issues에 공개하지 마세요**.

대신 아래 방법으로 신고해 주세요:

1. **GitHub Security Advisories**: 저장소 > Security > Report a vulnerability
2. **이메일**: (담당자 이메일 기입)

신고 후 **48시간 이내** 초기 응답, **7일 이내** 패치 또는 진행 상황 공유를 목표로 합니다.

---

## 위협 모델 (Threat Model)

### 보호 대상 자산

| 자산 | 민감도 | 보호 방법 |
|------|--------|----------|
| `OPENCLAW_GATEWAY_TOKEN` | 🔴 최고 | 서버 전용 env, 클라이언트 노출 없음 |
| `AUTH_SECRET` (세션 서명키) | 🔴 최고 | 서버 전용 env, 최소 32자 랜덤 권장 |
| `AUTH_USERS` / `AUTH_TOKEN` | 🔴 최고 | 서버 전용 env |
| Supabase 세션 쿠키 | 🟠 높음 | HttpOnly, Secure, SameSite=Lax |
| 에이전트 데이터 (JSON) | 🟡 중간 | 파일 시스템 권한, owner_id 격리 |

### 신뢰 경계

```
[브라우저/클라이언트]
        │ HTTPS만 허용
        ▼
[Next.js API Routes] ← 토큰 검증, RBAC 적용
        │ 서버 전용 네트워크
        ▼
[OpenClaw Gateway] ← 토큰은 절대 클라이언트에 노출 안 됨
```

### 주요 위협 및 대응

| 위협 | 대응 방법 |
|------|----------|
| Gateway 토큰 탈취 | 서버 전용 env, 클라이언트 번들에 포함 불가 |
| 세션 토큰 위조 | HMAC-SHA256 서명, timing-safe 비교 |
| 브루트포스 로그인 | Rate limit (IP당 10분 10회) |
| 클릭재킹 | `X-Frame-Options: DENY` |
| XSS | CSP 헤더, React 기본 이스케이프 |
| CSRF | `SameSite=Lax` 쿠키 정책 |
| 타이밍 공격 | `crypto.timingSafeEqual` 사용 |
| 권한 상승 | RBAC: viewer < operator < admin |
| 정보 노출 (`/api/openclaw/status`) | 인증 필수 (패치됨) |
| 비밀키 커밋 | Gitleaks CI 스캔, `.env` gitignore |
| 의존성 취약점 | npm audit CI, Dependabot |

---

## 보안 설정 가이드

### 필수 환경변수 (프로덕션)

```bash
# 최소 32자 랜덤 시크릿 (생성: openssl rand -hex 32)
AUTH_SECRET=<your-strong-random-secret>

# Gateway 토큰 (절대 클라이언트에 노출 금지)
OPENCLAW_GATEWAY_TOKEN=<gateway-token>
```

### 권장 설정

```bash
# 세션 TTL (기본 7일)
# AUTH_SESSION_TTL_MS=604800000

# 로그 레벨
LOG_LEVEL=info  # 프로덕션은 info 이상

# Sentry (선택)
SENTRY_DSN=https://...
```

### AUTH_SECRET 미설정 위험

`AUTH_SECRET`이 기본값(`openclaw-dev-secret-CHANGE-IN-PRODUCTION`)인 경우:
- 서버 로그에 `[SECURITY]` 경고가 출력됩니다
- 세션 토큰이 위조될 수 있습니다
- **프로덕션 배포 전 반드시 변경하세요**

---

## 쿠키 보안 설정

| 속성 | 값 | 설명 |
|------|----|------|
| `HttpOnly` | `true` | JS 접근 불가 |
| `Secure` | 프로덕션: `true` | HTTPS 전송만 허용 |
| `SameSite` | `lax` | CSRF 기본 방어 |
| `Max-Age` | `604800` (7일) | 세션 만료 |

---

## 라이선스 및 책임 범위

이 프로젝트는 AGPL-3.0 라이선스입니다.

- 네트워크를 통해 제공하는 경우 소스 코드 공개 의무가 있습니다
- OpenClaw Gateway의 보안은 Gateway 자체의 책임 범위입니다
- 이 대시보드는 Gateway 토큰을 중계할 뿐, 토큰 자체의 보안은 운영자 책임입니다
