# 예제 설정

## env
- **env.local.example** — 로컬 개발 / Docker 로컬 프로필용. 복사 후 `OPENCLAW_GATEWAY_URL`, Supabase 등만 바꿔서 사용.
- **env.server.example** — 서버(배포)용. `OPENCLAW_GATEWAY_TOKEN` 등 보안 값 반드시 설정.

## Docker
- 프로젝트 루트의 `docker-compose.yml` 사용.
- `--profile local`: 대시보드 + OpenClaw Gateway.
- `--profile server`: 동일 구성, 배포 시 env만 서버용으로.

## OpenClaw 연동 확인
- 대시보드 띄운 뒤 `curl http://localhost:3000/api/openclaw/status` 로 Gateway 연동 여부 확인 (서버에서만 Gateway 호출).
