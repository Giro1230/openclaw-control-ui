# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Dependabot weekly auto-updates for npm packages and GitHub Actions
- Gitleaks pre-commit hook via Husky to prevent secret leaks
- Security regression tests: auth bypass, privilege escalation, owner isolation, input injection
- Playwright trace and video artifacts uploaded on test failure
- JUnit reporter for Playwright (CI integration)
- `CHANGELOG.md` for release tracking

### Changed
- `/api/health/ready` now returns `207` for degraded state (was `200`)
- `/api/health/ready` returns `503` for error state (was `200`)
- `npm audit` in CI no longer uses `continue-on-error` (fails hard on high severity)
- Playwright config: `trace: "retain-on-failure"` (was `"on-first-retry"`)

---

## [0.3.0] - 2026-03-11

### Added
- All code comments and JSDoc converted to English
- `README.ko.md` unified to polite Korean style (합니다 체)
- `README.md` build table updated with 71 passing tests
- `examples/README.md` updated to note auth requirement on `/api/openclaw/status`

### Fixed
- CODEOWNERS: replaced email placeholder with GitHub username `@Giro1230`
- CI badge URLs updated to `Giro1230/openclaw-control-ui`
- CodeQL `actions: read` permission added for SARIF upload

---

## [0.2.0] - 2026-03-10

### Added
- CI/CD pipeline: quality-gate, security-scan (CodeQL), gitleaks, E2E (Playwright)
- Vitest unit and API test suite — 71 tests, 70%+ coverage threshold
- Pino structured logging with request-scoped child loggers
- Sentry error tracking (client, server, edge configs)
- Rate limiting on `POST /api/auth/sign-in` (10 req / 10 min per IP)
- Atomic file writes in `store-file.ts` (crash-safe)
- `/api/health/live` liveness probe
- `/api/health/ready` readiness probe (Gateway + Supabase checks)
- HMAC-SHA256 signed session cookies with timing-safe comparison
- `AUTH_SECRET` enforcement with production warning
- `GET /api/openclaw/status` now requires authentication
- ARCHITECTURE.md, SECURITY.md, RUNBOOK.md
- Docker Compose `local` and `server` profiles

### Changed
- Next.js 15.1.0 → 15.5.12 (security patches)

---

## [0.1.0] - 2026-03-01

### Added
- Initial release
- Next.js 15 App Router with i18n (ko/en/ja/zh)
- Supabase Auth + env-auth (AUTH_USERS) dual authentication
- Agent CRUD with Zod validation and RBAC (viewer/operator/admin)
- Gateway WebSocket relay — token never exposed to browser
- JSON file store with in-memory fallback
- Docker multi-stage build with non-root user
- DaisyUI theme switcher, locale switcher

[Unreleased]: https://github.com/Giro1230/openclaw-control-ui/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/Giro1230/openclaw-control-ui/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Giro1230/openclaw-control-ui/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Giro1230/openclaw-control-ui/releases/tag/v0.1.0
