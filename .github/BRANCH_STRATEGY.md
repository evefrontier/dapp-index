# Dapp-Index Branch & Release Strategy

## Branch Structure

### Primary Branches

| Branch | Purpose | Protection | Auto-Deploy |
|--------|---------|------------|-------------|
| **main** | Integration point for all PRs | ✓ Require review, CI pass | No |
| **staging** | Showcase/demo environment | - Allow direct push | Yes to staging.dapps.evefrontier.com |
| **dev** | Development environment | CI pass required | Yes to dev.dapps.evefrontier.com |
| **test** | QA testing with game servers | CI pass required | Yes to test.dapps.evefrontier.com |
| **uat** | Final validation before production | CI pass required | Yes to uat.dapps.evefrontier.com |
| **live** | Production | ✓ Require review, CI pass | Yes to dapps.evefrontier.com |

## Development Workflow

### 1. Feature Development (PR-based)

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feat/my-feature

# Make changes, commit with conventional commits
git commit -m "feat: add new functionality"

# Push and create PR
git push origin feat/my-feature
# Create PR on GitHub
```

**PR Preview:** Amplify automatically generates a preview link for your branch. URL format: `pr-<number>.<hash>.amplifyapp.com`

**Review & Merge:**
1. Code review required (at least 1 approval)
2. CI checks must pass (tests, build, typecheck)
3. Merge to main using PR interface
4. Delete feature branch

### 2. Release to Dev

When code on main is ready for dev environment:

```bash
git fetch origin
git checkout dev
git rebase origin/main  # or cherry-pick specific commits if needed
git push origin dev
```

Amplify detects the push to `dev` and auto-deploys.

### 3. QA Approval → Move to Test/UAT

When QA approves dev environment, promote to test:

```bash
git fetch origin
git checkout test
git rebase origin/dev
git push origin test
```

Similar process for uat:

```bash
git checkout uat
git rebase origin/test
git push origin uat
```

### 4. Release to Production

#### Option A: Automated Release (Recommended)

Use the GitHub Actions release workflow:

1. Go to Actions tab → select "Release" workflow
2. Click "Run workflow"
3. Enter version number (e.g., `0.2.0`) - must follow semantic versioning
4. Workflow executes:
   - Creates git tag `v0.2.0`
   - Generates release notes from PRs merged since last tag
   - Creates GitHub Release
   - Bumps `package.json` version to `0.3.0-dev` on main
   - Merges release to `live` branch
   - Amplify detects live push and deploys to production

#### Option B: Manual Release (if automation fails)

```bash
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0

# Create GitHub Release manually from tag

# Bump version on main
npm pkg set version="0.3.0-dev"
git add package.json
git commit -m "chore: bump version to 0.3.0-dev"
git push origin main

# Merge to live
git fetch origin live
git checkout live
git merge v0.2.0
git push origin live
```

### 5. Hotfixes (Critical Production Issues)

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b fix/critical-issue

# Make fix and test locally
git commit -m "fix: critical issue"

# Create PR, review, merge to main
# (same PR workflow as features)

# Once merged to main, cherry-pick to live
git fetch origin live
git checkout live
git cherry-pick <commit-hash>
git push origin live
```

## Versioning

### Version Format

- **Production releases:** Semantic versioning `v1.0.0`, `v1.1.0`, `v2.0.0`
- **Dev versions:** `1.1.0-dev` (in `package.json` between releases)
- **Sui Move registry:** Manual update after publishing (see below)

### Release Cadence

- Target: Monthly releases (adjust as needed)
- Trigger: Manual via GitHub Actions workflow_dispatch
- Release notes: Auto-generated from PR titles/commits since last tag

## Manual Steps After Release

### Sui Move Package Publishing

**⚠️ Important:** This is a wallet-funded transaction and must be done manually.

1. Wait for live environment to be fully deployed and verified
2. Test live environment thoroughly
3. When ready, publish the Move package:

```bash
cd registry/move
sui move publish --gas-budget 100000000
```

4. Copy the new package ID from the output
5. Update docs with the new package ID:
   - `docs/MOVE_PUBLISH.md`
   - Any env var files that reference the old package ID
6. Create a follow-up commit on main:

```bash
git checkout main
git pull origin main
git commit -am "docs: update Sui Move package ID to <new-id> [release v1.1.0]"
git push origin main
```

## Branch Protection Rules

### Main & Live Branches

```
- Require pull request reviews before merging (1+ approval)
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Include administrators in restrictions (optional)
- Dismiss stale PR approvals when new commits are pushed
- Require CODEOWNERS review (if CODEOWNERS file exists)
```

### Dev, Test, UAT Branches

```
- Require status checks to pass before merging
- Allow force pushes (for rebase workflow)
- Allow dismissal of stale reviews
```

### Staging Branch

```
- No protection (fast-moving, showcase)
```

## PR Discipline

From `AGENTS.md`:
- One concern per PR (separate Move, schema, frontend, Walrus, docs)
- Prefer small, reviewable diffs
- Stack PRs only when dependency is real
- No unrelated fixes attached to feature branches

## Verification Commands

Before and after each release, run:

```bash
# Frontend
bun run site:test
bun run site:typecheck
bun run site:build

# Sui Move
bun run move:build
bun run move:test

# Full CI
bun run ci
```

## FAQ

**Q: Can I push directly to staging?**
A: Yes, staging is a showcase branch without protection. Use for demos, quick iterations.

**Q: What if the release workflow fails?**
A: The workflow creates a GitHub Issue if live merge fails. Follow manual steps in the issue.

**Q: Can I release from a branch other than main?**
A: No. All releases come from main to ensure predictability. Use main as the integration point.

**Q: How do I revert a release?**
A: Create a new fix on main, then release a new version (e.g., `0.2.1`). Do not try to delete release tags.

**Q: What if I need to cherry-pick specific commits to dev/test/uat?**
A: Use `git cherry-pick <commit-hash>` instead of rebase. Useful when dev needs a fix main doesn't have yet.
