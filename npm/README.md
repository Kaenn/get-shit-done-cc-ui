# get-shit-done-cc-ui

> GSD-UI: Visual panel for Claude Code terminal workflows

## Installation

Run directly with npx (no installation needed):

```bash
npx get-shit-done-cc-ui
```

Or install globally:

```bash
npm install -g get-shit-done-cc-ui
get-shit-done-cc-ui
```

**First-run note:** The first time you run this command, it will download the platform-specific binary (~15MB). After the download completes, run the command again to start the application.

## Usage

```bash
# Start the GSD panel
npx get-shit-done-cc-ui

# The panel will open in your default browser at http://localhost:6942
```

## Requirements

- Node.js 16 or higher
- Internet connection (for first-run download only)

## Supported Platforms

- Linux x64
- macOS Intel (x64)
- macOS Apple Silicon (arm64)
- Windows x64
- WSL (uses Linux binary)

## Environment Variables

- `GSD_UI_PLATFORM` - Override platform detection (e.g., `darwin-arm64`, `linux-x64`, `win32-x64`)
- `NO_COLOR` - Disable colored output

## Links

- [GitHub Repository](https://github.com/glennin-codes/get-shit-done-cc-ui)
- [Issue Tracker](https://github.com/glennin-codes/get-shit-done-cc-ui/issues)

## Release Process (Maintainers)

### Prerequisites

1. **Create NPM_TOKEN:**
   - Go to [npmjs.com](https://www.npmjs.com/) > Account > Access Tokens
   - Click "Generate New Token" > "Automation" (for CI/CD)
   - Copy the token value

2. **Configure GitHub secret:**
   - Go to GitHub repo > Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: paste the token from step 1

### Releasing a new version

```bash
# Update version in npm/package.json
./scripts/bump-version.sh X.Y.Z

# Commit the version bump
git commit -am "chore: bump version to vX.Y.Z"

# Create and push tag
git tag vX.Y.Z
git push && git push --tags
```

This triggers the release pipeline:
1. Build binaries for all platforms
2. Upload binaries to GitHub Releases
3. Publish npm package

## License

AGPL-3.0 - see LICENSE file in the repository
