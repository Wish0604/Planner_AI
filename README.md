# Deployment & Ops (Phase 7 GitHub/DevOps)

## Environment variables
- GEMINI_API_KEY
- GITHUB_TOKEN (PAT or GitHub App installation token)
- GITHUB_REPO_OWNER (e.g., your-org)
- GITHUB_REPO_NAME (e.g., your-repo)
- REPO_HEALTH_SECRET (shared secret header for scheduler → service)
- DRY_RUN=true (optional; logs instead of creating GitHub issues)

## Cloud Run deployment (github-monitor-service)
```
gcloud run deploy github-monitor-service \
	--source backend \
	--allow-unauthenticated \
	--region us-central1 \
	--set-env-vars GEMINI_API_KEY=...,GITHUB_TOKEN=...,GITHUB_REPO_OWNER=...,GITHUB_REPO_NAME=...,REPO_HEALTH_SECRET=...,DRY_RUN=false
```

## Cloud Scheduler (every 5 minutes)
```
gcloud scheduler jobs create http github-monitor-cron \
	--schedule="*/5 * * * *" \
	--uri="https://<cloud-run-url>/monitor" \
	--http-method=POST \
	--oauth-service-account-email=<service-account>@<project>.iam.gserviceaccount.com \
	--headers="x-cron-secret:$(REPO_HEALTH_SECRET)"
```

## Endpoints
- POST /monitor — cron entry point; checks repo health and (unless DRY_RUN) opens issues for blockers.
- GET /api/repo-health — returns current failing workflows, stale PRs, blockers.
- POST /api/github/issues — create issue with { title, body, labels }.

## Dry-run mode
Set DRY_RUN=true to log would-be GitHub actions without creating issues (useful for demos and testing).

## Failure recovery hints
- If /monitor is 401, ensure x-cron-secret matches REPO_HEALTH_SECRET.
- If GitHub calls fail, verify GITHUB_TOKEN scopes: repo, workflow.
- Cron can be retried manually via `gcloud scheduler jobs run github-monitor-cron`.
