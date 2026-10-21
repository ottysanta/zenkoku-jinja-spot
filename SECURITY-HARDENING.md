# Security hardening candidate (not deployed)

Base: ba417a20fe54b683983034ae9e142aca06954aec, 2026-10-21.

## Changes
- All 14 Next admin route files authenticate a server-side session before parsing bodies or touching files/data. Bulk/maintenance routes require admin. Submission review preserves existing admin/moderator and server-configured ADMIN_EMAILS access. Browser cross-origin mutations are denied.
- FastAPI's three main admin routes and all admin_sources router operations require the current, non-suspended authenticated administrator.
- Missing push secret or VAPID configuration fails closed; shared secrets use constant-time comparison. Notification URLs must be local paths.
- `/admin` development forwarding is excluded in production.
- Next 15.5.28, sharp 0.35.5, Auth.js beta.32/core 0.41.3, eslint-config-next 15.5.28 are pinned. The lockfile resolves these versions, including Next's nested sharp.
- Paid palm/unmei requests require authentication, bounded request bodies, and a durable atomic quota. Defaults disable paid processing. Per UTC day: 3 requests per user and 100 total; concurrent: 1 per user, 3 total. Failed requests also consume quota. Provider retries disabled and timeouts bounded.

## Compatibility and rollout blockers
This is a REVIEW CANDIDATE, not evidence that the deployed service is protected.

1. The AI change intentionally returns 503 unless AI_FEATURES_ENABLED=true, AI_USAGE_STORAGE_MODE=single-host-durable, AI_USAGE_DB_PATH is an absolute durable path shared by all processes on a single host, and the existing provider credential is configured. Vercel/Lambda is rejected even if these flags are set. A shared transactional quota backend is needed for serverless/multi-host deployment. Do not deploy this AI change to the existing Vercel service without an explicitly approved suspension or implementation of that backend. No live environment variables or keys were inspected/changed.
2. Unmei now returns a bounded final text response, not incremental streaming. UI error and response compatibility needs a staging check. No real provider requests were made.
3. Admin web role checks use existing authenticated Auth.js session roles. Existing ADMIN_EMAILS fallback behavior is unchanged. Immediate revocation of stale JWT roles is NOT established; adding mandatory FastAPI /me verification would break standalone deployment, so it is not included. Production identity architecture and administrative account configuration remain unverified.
4. The original 13 TypeScript diagnostics were repaired without any/ignore suppression: precise SQLite parameter types, Omit of the string URL page parameter before numeric pagination, removal of an unsupported MapLibre option, and returning rather than assigning the application numeric Auth session ID. Generated Next route checks additionally required making the unused WORRIES value export private. The unchanged source reproduced the original 13 diagnostics with updated dependencies; original-dependency baseline was not separately installed. Numeric session ID and moderator-role behavior has a dedicated regression test.
5. A direct isolated production build is tested against an empty synthetic SQLite database and disabled external API destination, bypassing the normal prebuild database fetch. Browser workflows, actual database persistence, configured authorization, and deployment topology remain unverified. Backups/seed/user data separation was not inspected.

## Staged acceptance plan
- Review the narrow type-compatibility fixes and repeat the isolated build before deployment. Verify original-dependency history if needed; no claim of original build health is made.
- Apply dependency/security and admin/push changes as a separate reviewed candidate, preserving existing reviewer roles. Test login, authorized review/import and denied anonymous/user requests, cross-origin mutations, disabled accounts and logout/revocation behavior.
- For paid AI, either obtain approval for temporary disablement or implement/test a durable shared quota for the actual hosting topology first. Test authenticated requests, concurrent requests across workers, quota persistence, provider failure and UI 401/429/503 handling without spending against production accounts.
- Verify push denial and authorized sending against a synthetic recipient only. No live notification send belongs in acceptance without approval.
- Deployment, secrets/settings, access expansion, production databases and live payments are outside this local patch.

## Local verification
Node 24.19.0 and Python 3.12.14. Registry dependencies installed with scripts disabled.

- `node --experimental-strip-types --test apps/web/tests/security/*.test.ts`: policy, bounded body, durable synthetic SQLite quota tests.
- `node --test apps/web/tests/security/routes.test.cjs`: actual route modules transpiled in a VM with synthetic principals and mocked side effects; no live database/network.
- `python -m unittest discover -s apps/api/tests -v` (isolated venv with fastapi/sqlalchemy/httpx/python-dotenv): dependency authorization and route-attachment checks, memory database URL only.
- `npm ls next next-auth @auth/core sharp --all`: exact resolved versions verified.
- `npm run typecheck --workspace apps/web`: rerun after narrow compatibility corrections; no type errors are intentionally suppressed. Build type-error ignoring is disabled.

Revert this candidate by discarding only the listed local patch files, or reverse the review patch on its matching base. No remote branch was changed.

## Ordered patch application

Use the exact clean base above. These commands are for review/staging, not authorization to deploy.

1. `git apply --check zenkoku-jinja-spot-stage1.patch`, then `git apply zenkoku-jinja-spot-stage1.patch`. Stage 1 contains dependencies, authorization, push protections, compatible type fixes and test/helper files. Paid AI route behavior is deliberately UNCHANGED; dormant quota helper modules alone do not protect those routes.
2. Run dependency installation with scripts disabled, all local tests, TypeScript checking, and a direct Next build with a synthetic database. Do not run the database-fetch prebuild against production data. Verify authenticated reviewer and admin workflows in staging.
3. Only after resolving shared hosting quota requirements or receiving explicit approval for AI suspension, `git apply --check zenkoku-jinja-spot-stage2-ai.patch`, then apply it. Stage 2 wires palm/unmei to the protection and changes unmei streaming to final text. Re-run all tests/build plus staging UI scenarios.
4. Both patch files are checked sequentially against an isolated Git index of the base. This checks patch application, not production deployment acceptance.

## Final local results (2026-10-21)

- Stage 1 TypeScript check: PASS. Combined TypeScript check, including generated Next route types: PASS.
- Type-validating direct Next production build: PASS, 52 static pages generated. Lint is still skipped by the existing project configuration; no lint pass is claimed. Empty synthetic spots database only, provider/remote API credentials absent, API destination loopback closed port.
- 31 automated tests PASS: 19 route/auth/push/AI guard tests, 10 policy/body/quota tests, 2 Python dependency/attachment tests.
- Built application HTTP smoke checks on 127.0.0.1: PASS for six cases: anonymous admin stats/import/submission, palm and unmei returned 401; unconfigured push send returned 503. This is actual local HTTP execution, not deployed-site validation. No authenticated production identity, provider spend or notification delivery was tested.
- Both staged patches apply in order to the exact base in an isolated Git index. Stage 1 and stage 2 must not be confused with deployment approval.
- Generated service-worker output was restored to baseline and is not included.
- Non-blocking build warnings: stale Browserslist data, unset metadataBase, and edge runtime static-generation notice.
