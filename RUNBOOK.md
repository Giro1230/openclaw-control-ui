# 운영 런북 (Runbook)

장애 대응, 운영 절차, 트러블슈팅 가이드

---

## 헬스체크 엔드포인트

```bash
# Liveness: 프로세스 살아있는지 (쿠버네티스 livenessProbe)
curl http://localhost:3000/api/health/live

# Readiness: 의존 서비스 준비 상태 (쿠버네티스 readinessProbe)
curl http://localhost:3000/api/health/ready
```

예상 응답:
```json
// /api/health/live
{ "status": "ok", "uptime": 3600, "timestamp": "2026-03-11T00:00:00.000Z" }

// /api/health/ready
{
  "status": "ok",
  "timestamp": "...",
  "checks": [
    { "name": "gateway", "status": "ok", "latencyMs": 42 },
    { "name": "supabase", "status": "ok", "latencyMs": 18 }
  ]
}
```

---

## 장애 시나리오 대응

### 시나리오 1: 로그인 불가

**증상**: 로그인 시 401 또는 503 응답

**진단**:
```bash
# 1. 인증 환경변수 확인
echo $AUTH_EMAIL $AUTH_USERS
# (또는 Supabase URL 확인)
echo $NEXT_PUBLIC_SUPABASE_URL

# 2. AUTH_SECRET 기본값 여부 확인 (서버 로그에서)
grep "SECURITY" /var/log/app.log

# 3. Rate limit 여부 확인 (연속 실패 후)
# 429 응답 시 Retry-After 헤더 확인
```

**해결**:
```bash
# env-auth 재설정
AUTH_EMAIL=admin@example.com
AUTH_TOKEN=$(openssl rand -hex 32)
AUTH_ROLE=admin

# AUTH_SECRET 재생성 (기존 세션 무효화 주의)
AUTH_SECRET=$(openssl rand -hex 32)
# → 컨테이너 재시작 필요
```

---

### 시나리오 2: Gateway 연결 실패 (502/504)

**증상**: `/api/openclaw/*` 502 또는 504 응답

**진단**:
```bash
# 1. Gateway 상태 직접 확인 (인증 후)
curl -H "Cookie: __openclaw_session=<token>" \
  http://localhost:3000/api/openclaw/status

# 2. Readiness probe에서 gateway 상태 확인
curl http://localhost:3000/api/health/ready | jq '.checks[] | select(.name=="gateway")'

# 3. Gateway URL/토큰 확인
echo $OPENCLAW_GATEWAY_URL
```

**해결**:
```bash
# Gateway 컨테이너 재시작
docker compose restart openclaw-gateway

# URL 설정 확인
OPENCLAW_GATEWAY_URL=http://gateway:8080  # 컨테이너 네임 확인
OPENCLAW_GATEWAY_TOKEN=<valid-token>
```

---

### 시나리오 3: 에이전트 데이터 손실

**증상**: 에이전트 목록이 비어있거나 특정 에이전트 사라짐

**진단**:
```bash
# AGENT_STORE_PATH 파일 확인
ls -la $AGENT_STORE_PATH
cat $AGENT_STORE_PATH | jq 'length'

# 임시 파일 잔재 확인 (비정상 종료 시)
ls -la $(dirname $AGENT_STORE_PATH)/*.tmp.*
```

**해결**:
```bash
# 백업 복구 (사전 백업 필요)
cp $AGENT_STORE_PATH.bak $AGENT_STORE_PATH

# 임시 파일 정리
rm $(dirname $AGENT_STORE_PATH)/*.tmp.*

# 파일 권한 확인 (nextjs 사용자, UID 1001)
chown 1001:1001 $AGENT_STORE_PATH
chmod 644 $AGENT_STORE_PATH
```

---

### 시나리오 4: 메모리/CPU 급증

**진단**:
```bash
# 컨테이너 리소스 확인
docker stats openclaw-dashboard

# 프로세스 확인
docker exec openclaw-dashboard ps aux
```

**해결**:
```bash
# 재시작 (graceful)
docker compose restart openclaw-dashboard

# rate limiter 메모리 확인 (in-memory 저장소)
# → 대규모 트래픽 시 Redis 기반 rate limiter로 교체 권장
```

---

### 시나리오 5: 보안 경고 (Sentry/로그)

**증상**: `[SECURITY] AUTH_SECRET이 기본값` 경고

**즉시 조치**:
```bash
# 강력한 시크릿 생성
openssl rand -hex 32

# 환경변수 업데이트 후 재시작
# ⚠️ 재시작 시 기존 세션 토큰 무효화 (사용자 재로그인 필요)
```

---

## 정기 운영 체크리스트

### 매일
- [ ] Sentry 대시보드에서 신규 에러 확인
- [ ] `/api/health/ready` 200 응답 확인

### 매주
- [ ] `npm audit` 실행 및 high/critical 취약점 패치
- [ ] 에이전트 데이터 파일 백업 확인
- [ ] 로그 볼륨 확인 (디스크 공간)

### 매월
- [ ] 의존성 업데이트 검토 (Dependabot PR)
- [ ] AUTH_SECRET 교체 고려 (선택사항)
- [ ] 접근 로그 감사 (비정상 패턴 확인)

---

## 롤백 절차

### Docker 이미지 롤백

```bash
# 1. 이전 이미지 태그 확인
docker images openclaw-dashboard

# 2. 이전 버전으로 롤백
docker compose down
docker tag openclaw-dashboard:previous openclaw-dashboard:latest
docker compose up -d

# 3. 헬스체크 확인
sleep 5 && curl http://localhost:3000/api/health/live
```

### 에이전트 데이터 롤백

```bash
# 배포 전 백업본 복구
cp /backup/agents.$(date +%Y%m%d).json $AGENT_STORE_PATH
```

---

## 유용한 명령어

```bash
# 로그 실시간 모니터링 (JSON 형식)
docker logs -f openclaw-dashboard | jq .

# 특정 requestId 추적
docker logs openclaw-dashboard | jq 'select(.requestId == "abc-123")'

# 에러 로그만 필터
docker logs openclaw-dashboard | jq 'select(.level == "error")'

# 에이전트 수 확인
cat $AGENT_STORE_PATH | jq 'length'

# 현재 세션 쿠키 디버그 (개발환경)
curl -c cookies.txt http://localhost:3000/api/auth/sign-in \
  -d '{"email":"admin@test.com","password":"test-token"}' \
  -H "Content-Type: application/json"
```

---

## 연락처 및 에스컬레이션

| 레벨 | 조건 | 조치 |
|------|------|------|
| P1 (서비스 중단) | 헬스체크 실패 5분 이상 | 즉시 재시작 + 담당자 호출 |
| P2 (기능 장애) | Gateway 502/504 연속 | Gateway 재시작, 로그 확인 |
| P3 (보안 경고) | AUTH_SECRET 기본값 사용 | 다음 배포 시 변경 |
| P4 (성능 저하) | p95 latency > 2s | 번들 분석, 캐싱 검토 |
