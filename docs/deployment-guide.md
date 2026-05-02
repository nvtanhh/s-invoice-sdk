# Deployment Guide: Publishing to npm

## Overview

The `viettel-vinvoice-sdk` is distributed as an npm package. This guide covers building, testing, versioning, and publishing the SDK to the npm registry.

## Prerequisites

- **Node.js:** ≥18.18 (recommend 20.x LTS)
- **npm:** ≥8.0
- **npm Account:** Published account with permissions (for npm publish)
- **Git:** For tagging releases

## Build Pipeline

### 1. Local Development

```bash
# Clone the repository
git clone <repo-url>
cd invoice-sdk

# Install dependencies
npm install

# Make code changes
# (Edit src/, test/, docs/)
```

### 2. Code Quality Checks

```bash
# Format code (required before commit)
npm run format

# Lint code (required before publish)
npm run lint

# Run unit tests
npm test

# Check coverage (must meet thresholds)
# Output shows branch, function, line, statement coverage
```

**Coverage Thresholds (Enforced):**
- Branches: ≥75%
- Functions: ≥80%
- Lines: ≥80%
- Statements: ≥80%

If any threshold fails, `npm test` exits with code 1 and publish is blocked.

### 3. Generate OpenAPI Spec

```bash
# Generate openapi.yaml from Zod schemas
npm run openapi

# Verify openapi.yaml was updated
git diff openapi.yaml
```

This is optional for development but recommended to keep documentation in sync.

### 4. Compile TypeScript

```bash
# Compile src/ to dist/
npm run build

# Outputs:
# - dist/index.js (main entry point)
# - dist/index.d.ts (type definitions)
# - dist/**/*.d.ts (type maps)
# - dist/**/*.js (compiled code)
# - dist/**/*.js.map (source maps)
```

### 5. Verify Build Output

```bash
# Check that dist/ was created
ls -la dist/

# Verify main entry point
cat dist/index.js | head -20

# Verify types were generated
ls dist/index.d.ts
```

## Pre-Publication Checklist

### Code Readiness

- [ ] All tests pass: `npm test`
- [ ] No lint errors: `npm run lint`
- [ ] Code formatted: `npm run format`
- [ ] Build succeeds: `npm run build`
- [ ] Coverage thresholds met
- [ ] No `TODO` comments left in code
- [ ] All `@experimental` markers appropriate
- [ ] TypeScript strict mode enabled

### Documentation

- [ ] API documentation complete (JSDoc comments)
- [ ] README.md updated with latest features
- [ ] CHANGELOG.md updated with version notes
- [ ] docs/ folder current with code
- [ ] api-auth.md preserved (don't modify)
- [ ] Examples in README are functional

### Git State

- [ ] All changes committed
- [ ] No uncommitted files (`git status` is clean)
- [ ] No unstaged changes
- [ ] Ready to tag version

## Version Management

### Semantic Versioning

The SDK uses semver: `MAJOR.MINOR.PATCH`

**When to bump:**
- `MAJOR`: Breaking changes (removed exports, changed signatures, new error types)
- `MINOR`: New features (new methods, new services, new optional params)
- `PATCH`: Bug fixes, documentation, non-breaking internal refactors

**Examples:**
- Add new optional param to `ClientConfig` → MINOR
- Change `InvoiceService.createInvoice()` signature → MAJOR
- Fix token refresh bug → PATCH
- Update error message → PATCH

### Versioning Workflow

1. **Update Version in `package.json`**

```bash
# Option 1: Manual edit
# Edit package.json, change "version": "1.0.0" to "1.0.1"

# Option 2: npm command (creates git commit + tag)
npm version patch    # 1.0.0 → 1.0.1
npm version minor    # 1.0.0 → 1.1.0
npm version major    # 1.0.0 → 2.0.0
```

2. **Update CHANGELOG.md**

```markdown
## [1.0.1] - 2026-05-02

### Fixed
- Token refresh race condition in concurrent requests

### Changed
- Improved error logging for debugging

## [1.0.0] - 2026-04-30

### Added
- Initial stable release
- Invoice creation, cancellation, search
- USB token signing support
```

3. **Tag Release in Git**

```bash
# If using `npm version`, git tag is created automatically
git tag -l | grep v1.0.1

# Otherwise, create manually
git tag v1.0.1
git push origin v1.0.1
```

## Publishing to npm

### Step 1: Verify npm Account

```bash
# Check current npm user
npm whoami

# If not logged in, log in
npm login
# Enter username, password, OTP (if 2FA enabled)

# Verify you have publish permissions
npm access ls-packages
```

### Step 2: Final Pre-Publish Check

```bash
# Ensure dist/ is built
npm run build

# Run full test suite one more time
npm test

# Lint code
npm run lint

# Verify no uncommitted changes
git status
# Should output: "nothing to commit, working tree clean"
```

### Step 3: Publish to npm

```bash
# This command runs prepublishOnly hook:
# 1. npm run lint
# 2. npm test
# 3. npm run build
# 4. Then publishes to npm registry

npm publish

# If successful, output shows:
# npm notice
# npm notice 📦 viettel-vinvoice-sdk@1.0.1
# ...
# npm notice Please consider signing up for npm CodeSign to sign your packages.
# npm notice 📦
```

### Step 3b: Public Package (First Time)

If publishing for the first time:

```bash
# Configure as public (not private)
npm publish --access public

# Verify on npm registry
# Visit: https://www.npmjs.com/package/viettel-vinvoice-sdk
```

### Step 3c: Scoped Package (Optional)

If using npm organization/scope:

```bash
# Scope package name in package.json
# "name": "@your-org/viettel-vinvoice-sdk"

npm publish --access public

# Visit: https://www.npmjs.com/package/@your-org/viettel-vinvoice-sdk
```

### Step 4: Verify Published Version

```bash
# Check npm registry
npm view viettel-vinvoice-sdk@1.0.1

# Install from npm and test
npm install viettel-vinvoice-sdk@1.0.1

# Verify it works
node -e "const { ViettelInvoiceClient } = require('viettel-vinvoice-sdk'); console.log(ViettelInvoiceClient.name)"
```

## Post-Publication

### Step 1: Create GitHub Release

```bash
# Tag should already exist (from npm version)
git tag -l | grep v1.0.1

# Create release on GitHub (if using GitHub)
# Option 1: Via GitHub web UI
#   - Go to Releases → New Release
#   - Select tag v1.0.1
#   - Add release notes (copy from CHANGELOG.md)
#   - Publish

# Option 2: Via gh CLI
gh release create v1.0.1 --notes "$(cat CHANGELOG.md | head -50)"
```

### Step 2: Announce Release

- Update README.md with latest version
- Post on team Slack/Discord
- Email stakeholders (if applicable)
- Add to project board/tracking system

### Step 3: Document Release

- [ ] CHANGELOG.md reflects release
- [ ] docs/project-roadmap.md updated
- [ ] README.md shows latest features
- [ ] API docs updated if endpoints changed

## Installation & Usage (For Consumers)

Once published, users can install:

```bash
# Standard installation
npm install viettel-vinvoice-sdk

# Specific version
npm install viettel-vinvoice-sdk@1.0.1

# Latest version
npm install viettel-vinvoice-sdk@latest

# As dev dependency (unlikely for this SDK)
npm install --save-dev viettel-vinvoice-sdk
```

### Package.json Entry

```json
{
  "dependencies": {
    "viettel-vinvoice-sdk": "^1.0.1"
  }
}
```

### Usage in Consumer Code

```typescript
import { ViettelInvoiceClient } from 'viettel-vinvoice-sdk'

const client = new ViettelInvoiceClient({
  baseUrl: process.env.VIETTEL_BASE_URL!,
  taxCode: process.env.TAX_CODE!,
  username: process.env.VIETTEL_USERNAME!,
  password: process.env.VIETTEL_PASSWORD!
})

const response = await client.invoices.createInvoice({
  // ... invoice data
})
```

## Rollback Procedure

If a critical bug is discovered after publish:

### Option 1: Deprecate Version (Recommended)

```bash
# Mark version as deprecated on npm
npm deprecate viettel-vinvoice-sdk@1.0.1 "Critical bug: use @1.0.2 or @1.1.0"

# Users see warning on install
# npm WARN deprecated viettel-vinvoice-sdk@1.0.1: Critical bug: use @1.0.2 or @1.1.0

# Publish fix as patch version
npm version patch  # 1.0.1 → 1.0.2
npm publish
```

### Option 2: Unpublish Version (Not Recommended)

```bash
# Only use if package was published < 72 hours ago
npm unpublish viettel-vinvoice-sdk@1.0.1

# Note: npm discourages unpublishing; prefer deprecation
```

## Continuous Integration / CD

### Recommended CI Setup

```yaml
# .github/workflows/publish.yml (if using GitHub Actions)
name: Publish to npm

on:
  push:
    tags:
      - 'v*'  # Publish on version tags

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Manual Publishing (Current)

Since CI is not set up, follow the manual steps above.

## Environment & Secrets

### Local Development

No secrets needed for development (all mocked in tests).

### Before Publishing

Ensure:
- `.npmrc` configured with npm token (local machine only)
- No credentials in repository
- No `.env` files committed
- `.gitignore` includes node_modules/, dist/, .env

### npm Token Management

```bash
# Generate npm token
# 1. Go to https://www.npmjs.com/settings/~/tokens
# 2. Create new token (type: Automation or Publish)
# 3. Store securely

# Configure locally
npm config set //registry.npmjs.org/:_authToken="<token>"

# Verify (should show token)
npm config get //registry.npmjs.org/:_authToken

# For CI/CD, store as environment variable
# Never commit token to repository
```

## Troubleshooting

### Issue: "npm ERR! 403 Forbidden"

**Cause:** Not authenticated or no publish permissions

**Solution:**
```bash
npm login
npm whoami  # Verify logged in
npm access ls-packages  # Check permissions
```

### Issue: "npm ERR! 409 Conflict"

**Cause:** Version already published

**Solution:**
```bash
# Increment version
npm version patch

# Republish
npm publish
```

### Issue: "npm ERR! Invalid package name"

**Cause:** Package name format issue

**Solution:**
```bash
# Check package.json name field
cat package.json | grep '"name"'

# Should be lowercase, no spaces
# "name": "viettel-vinvoice-sdk"
```

### Issue: Build Fails After Publish

**Cause:** Code compiled before publish had errors

**Solution:**
```bash
# Verify build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Fix errors, commit, re-publish with new version
```

### Issue: Types Not Included in Published Package

**Cause:** `types` field in package.json missing or incorrect

**Solution:**
```bash
# Verify package.json
cat package.json | grep -A3 '"types"'

# Should reference declaration file
# "types": "./dist/index.d.ts"

# Rebuild and check dist/
npm run build
ls dist/index.d.ts  # Should exist
```

## Distribution Channels

### Primary Channel: npm Registry
- **URL:** https://www.npmjs.com/package/viettel-vinvoice-sdk
- **Command:** `npm install viettel-vinvoice-sdk`
- **Scope:** Public (or scoped if @org/viettel-vinvoice-sdk)

### Alternative: GitHub Packages

If using GitHub Packages registry (optional):

```bash
# Configure .npmrc
npm config set @tanhnv:registry https://npm.pkg.github.com

# Publish to GitHub
npm publish --registry=https://npm.pkg.github.com
```

## Security & Maintenance

### Keep Dependencies Updated

```bash
# Check for outdated packages
npm outdated

# Update dependencies (carefully)
npm update

# Audit for vulnerabilities
npm audit

# Fix known vulnerabilities
npm audit fix
```

### Security Patches

- Monitor npm security advisories
- Apply patches immediately if found in SDK dependencies
- Bump PATCH version and republish

### Maintenance Releases

Periodically (quarterly):
- Update Node.js version requirement if needed
- Update dependencies to latest stable
- Run full test suite on multiple Node.js versions

## Metrics & Monitoring

After publishing:

### npm Registry Metrics

```bash
# Check download stats
npm info viettel-vinvoice-sdk
# Shows: weekly/monthly downloads

# View version history
npm view viettel-vinvoice-sdk versions

# Check dependency graph
npm view viettel-vinvoice-sdk dependencies
```

### GitHub Metrics (If Open-Source)

- Stars count
- Clone count
- PR/Issue activity
- Release download stats

## Checklist: Full Release Process

```
Pre-Release
☐ Code changes complete
☐ Tests passing (npm test)
☐ No lint errors (npm run lint)
☐ Code formatted (npm run format)
☐ Coverage ≥ thresholds
☐ Documentation updated (docs/, README.md, CHANGELOG.md)
☐ CHANGELOG.md updated with version notes
☐ No uncommitted files (git status clean)

Version Bump
☐ Update package.json version (or npm version)
☐ Update CHANGELOG.md
☐ Commit version bump
☐ Tag release (git tag v1.x.x)
☐ Push tag (git push origin v1.x.x)

Build & Test
☐ npm run lint (final check)
☐ npm test (final check)
☐ npm run build (final check)
☐ dist/ created successfully

Publish
☐ npm login (verify logged in)
☐ npm whoami (verify user)
☐ npm publish (or npm publish --access public)
☐ Verify on npm registry (npmjs.com)

Post-Release
☐ Create GitHub release (if applicable)
☐ Announce release (Slack, email, etc.)
☐ Update README.md with latest version
☐ Close release issues/PRs
☐ Update project tracking system

Verify
☐ Install published version (npm install viettel-vinvoice-sdk@X.Y.Z)
☐ Test in separate project
☐ Verify types are available
☐ Check documentation links work
```

---

**Document Version:** 1.0 | **Last Updated:** 2026-05-02
