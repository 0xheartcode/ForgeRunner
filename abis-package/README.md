# `@0xheartcode/forgerunner-abis` – Smart Contract ABIs Package

[![GitHub Workflow](https://img.shields.io/badge/workflow-publish--abis-green)](https://github.com/0xheartcode/ForgeRunner/actions/workflows/publish-abis.yml)  
[![npm (scoped)](https://img.shields.io/badge/npm-@0xheartcode%2Fforgerunner--abis-blue)](https://github.com/0xheartcode/ForgeRunner/pkgs/npm/forgerunner-abis)

Automatically generated ABIs for ForgeRunner smart contracts, versioned alongside deployments.

---

## Installation

```bash
# Configure npm to use GitHub Package Registry for @0xheartcode scope
echo "@0xheartcode:registry=https://npm.pkg.github.com" >> .npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT_TOKEN" >> .npmrc

# Install the package
npm install @0xheartcode/forgerunner-abis
```

> **Note**: You need a [GitHub Personal Access Token](https://github.com/settings/tokens) with `read:packages` permission. Replace `YOUR_GITHUB_PAT_TOKEN` with your actual token.

---

## GitHub Packages Authentication

GitHub Packages **always requires authentication**, even for packages from public repositories. This is different from npmjs.com where public packages can be installed without authentication.

### Public Repository (Current Setup)
- **Repository**: Public on GitHub
- **Package Access**: Requires authentication
- **Required Token**: GitHub PAT with `read:packages` permission
- **Cost**: Free

### Private Personal Repository
- **Repository**: Private under personal account
- **Package Access**: Requires authentication
- **Required Token**: GitHub PAT with `read:packages` + repository access
- **Cost**: Free up to storage limits

### Private Organization Repository
- **Repository**: Private under organization
- **Package Access**: Requires authentication  
- **Required Token**: GitHub PAT with `read:packages` + organization access
- **Cost**: Depends on organization plan

### Alternative: npmjs.com
If you prefer a simpler setup without authentication for public packages:
- Change registry in package.json to npmjs.com
- Remove scope from package name or use your npm username
- Public packages are free and require no authentication to install

---

## Usage

```typescript
import { 
  CounterABI,
  deployments 
} from '@0xheartcode/forgerunner-abis';

// With ethers.js
const counter = new ethers.Contract(
  deployments["Testnet"].CounterCA,
  CounterABI,
  provider
);
```

---

## Branch-Based Versioning

This package uses **automatic git-history-based versioning**:

- **`main` branch**: Uses clean version numbers (e.g., `0.0.1`, `0.0.2`)
- **Feature branches**: Increment from git history + branch suffix (e.g., `0.0.2-feature-branch`)

### How Versioning Works:
1. **Find baseline**: Latest version tag in current branch's git history
2. **Increment**: Add +1 to patch version  
3. **Add suffix**: Append branch name (except for main)

**Example Flow**:
- Main: `0.0.1` → `0.0.2` → `0.0.3`
- Feature branch from `0.0.2`: `0.0.3-feature` → `0.0.4-feature`
- Another branch from `0.0.3`: `0.0.4-other-feature`

```bash
# Install main branch version (using @latest tag)
npm install @0xheartcode/forgerunner-abis@latest

# Install specific branch version (using branch tag)
npm install @0xheartcode/forgerunner-abis@feature-branch

# Install specific version number  
npm install @0xheartcode/forgerunner-abis@0.0.3-feature-branch

# Install with alias for side-by-side testing
npm install feature-abis@npm:@0xheartcode/forgerunner-abis@feature-branch
```

### NPM Dist Tags

The package uses **npm dist tags** for easy installation:

- **`main` branch**: Uses `@latest` tag
- **Other branches**: Use `@{branch-name}` tag (e.g., `@feature-branch`)

This allows you to:
- Always get the stable version with `@latest`
- Test specific branches with `@{branch-name}`
- Install different versions side-by-side

### Side-by-Side Usage

In package.json:
```json
{
  "dependencies": {
    "@0xheartcode/forgerunner-abis": "0.0.2",
    "feature-abis": "npm:@0xheartcode/forgerunner-abis@0.0.3-feature-branch",
    "test-abis": "npm:@0xheartcode/forgerunner-abis@0.0.4-test-branch"
  }
}
```

Then import them separately:
```typescript
// Main version
import { CounterABI as MainCounterABI } from '@0xheartcode/forgerunner-abis';

// Feature branch version  
import { CounterABI as FeatureCounterABI } from 'feature-abis';

// Test branch version
import { CounterABI as TestCounterABI } from 'test-abis';

// Use different versions for comparison/testing
const mainContract = new ethers.Contract(address, MainCounterABI, provider);
const testContract = new ethers.Contract(address, FeatureCounterABI, provider);
```

---

## Versioning Strategy

| Change Type         | Trigger Method                  | Version Bump | Recommended Command                      |
|---------------------|---------------------------------|--------------|------------------------------------------|
| Breaking Changes    | Create GitHub Release `vX.0.0`  | Major        | `npm version major && git push --follow-tags` |
| New Features        | Create GitHub Release `v1.X.0`  | Minor        | `npm version minor && git push --follow-tags` |
| ABI/Address Updates | Create GitHub Release `v1.2.X`  | Patch        | `npm version patch && git push --follow-tags` |
| Emergency Fixes     | Manual Workflow Dispatch        | Patch*       | Trigger via GitHub Actions UI           |

> *Manual dispatch auto-increments patch version.

---

## When to Trigger What

| Scenario          | How to Trigger            | Version Behavior                      |
|-------------------|---------------------------|---------------------------------------|
| Production Release| Create GitHub Release     | Uses release tag (e.g., `v1.2.3 → 1.2.3`) |
| Test/Dev Publish  | Click "Run workflow" button | Auto-increments patch (e.g., `1.2.3 → 1.2.4`) |
| Hotfix            | Manually tag `v1.2.4` and push | Respects exact tag                   |


## Configuration

Contract and deployment configuration is managed in [`build-config.js`](./build-config.js):

```javascript
// Default: Use wildcard to scan src/ for ALL contracts
const CONTRACT_NAMES = ['*'];

// Alternative: List specific contracts
// const CONTRACT_NAMES = ['Counter'];
```

### Wildcard Mode

Setting `CONTRACT_NAMES = ['*']` will:
- Recursively scan the `src/` directory for all `.sol` files
- Exclude interface files (starting with 'I' or in 'interfaces' directory)
- Only include contracts that have compiled artifacts in `out/`

### Failed Contracts

If any contracts fail to process during build, they will be:
- Excluded from the generated package
- Listed in the generated README under "Failed Contracts" section
- Logged with error details during build

## Development Workflow

### For Contract Developers

After modifying contracts:

```bash
forge build
cd abis-package
npm run build
```

To publish:

```bash
# For production releases
npm version [major|minor|patch]
git push --follow-tags

# For testing (manual trigger)
git tag v1.2.3-test && git push origin v1.2.3-test
```

### For Consumers

```bash
# Get compatible updates
npm update @0xheartcode/forgerunner-abis

# Pin specific version
npm install @0xheartcode/forgerunner-abis@1.2.3
```

> **Note**: Ensure your `.npmrc` is configured with GitHub PAT token (see Installation section above).

---

## Workflow Details

The [`publish-abis.yml`](.github/workflows/publish-abis.yml) workflow:

1. **Triggers:**
   - On new GitHub releases (`vX.Y.Z`)
   - Manual dispatch (test deployments)

2. **Process:**
   - Extracts clean ABIs from `out/`
   - Packages with deployment addresses
   - Publishes to GitHub Packages

---

## Frontend Update Rules

| Install Command                           | Behavior                                      |
|-------------------------------------------|-----------------------------------------------|
| `npm install @0xheartcode/forgerunner-abis`         | Installs exact version (won't auto-update)    |
| `npm install @0xheartcode/forgerunner-abis@^1.0.0`  | Updates to newest minor/patch version         |
| `npm update @0xheartcode/forgerunner-abis`          | Respects semver in `package.json`             |

---
