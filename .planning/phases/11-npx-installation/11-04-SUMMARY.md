---
phase: 11-npx-installation
plan: 04
subsystem: infra
tags: [npm, github-actions, ci-cd, publishing, automation]

# Dependency graph
requires:
  - phase: 11-03
    provides: GitHub Actions workflow uploading binaries to releases
provides:
  - npm publish workflow with NPM_TOKEN authentication
  - Release pipeline integration (builds -> release -> npm publish)
  - Maintainer documentation for NPM_TOKEN setup
affects: [11-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - workflow_call for reusable GitHub Actions workflows
    - Chained job dependencies (needs: [create-release])
    - secrets: inherit for passing repository secrets

key-files:
  created:
    - .github/workflows/publish-npm.yml
  modified:
    - .github/workflows/release.yml
    - npm/README.md

key-decisions:
  - "publish-npm job depends on create-release to ensure binaries available before npm publish"
  - "NPM_TOKEN as Automation token type for CI/CD compatibility"
  - "secrets: inherit passes NPM_TOKEN without explicit mapping"

patterns-established:
  - "Release sequence: build -> create-release -> publish-npm"
  - "Maintainer docs in package README for release process"

# Metrics
duration: 1min
completed: 2026-01-26
---

# Phase 11 Plan 04: npm Publishing Workflow Summary

**Automated npm publishing workflow triggered after GitHub Release creation with NPM_TOKEN authentication**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-26T19:39:34Z
- **Completed:** 2026-01-26T19:40:30Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created publish-npm.yml workflow with Node 20 and npm registry authentication
- Wired npm publishing into release.yml after create-release job completes
- Documented NPM_TOKEN setup and release process for maintainers

## Task Commits

Each task was committed atomically:

1. **Task 1: Create npm publish workflow** - `8049ba4` (feat)
2. **Task 2: Wire npm publishing into release pipeline** - `6af17dc` (feat)
3. **Task 3: Document NPM_TOKEN secret requirement** - `e50f957` (docs)

## Files Created/Modified

- `.github/workflows/publish-npm.yml` - npm publish workflow with NPM_TOKEN authentication
- `.github/workflows/release.yml` - Added publish-npm job after create-release
- `npm/README.md` - Release process documentation for maintainers

## Decisions Made

- **publish-npm after create-release:** Ensures binaries are uploaded to GitHub Releases before npm publish, so postinstall can download immediately
- **NPM Automation token:** Required for CI/CD publishing (not Publish or Read-only)
- **secrets: inherit:** Simpler than explicit secret mapping, passes all repository secrets

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** Before publishing:
1. Create NPM_TOKEN at npmjs.com (Automation type)
2. Add NPM_TOKEN as GitHub repository secret

See npm/README.md "Release Process (Maintainers)" section for detailed steps.

## Next Phase Readiness

- npm publishing workflow complete and integrated into release pipeline
- Ready for Plan 05: version bump script and final integration testing
- NPM_TOKEN must be configured before first release

---
*Phase: 11-npx-installation*
*Completed: 2026-01-26*
