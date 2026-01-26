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

## License

AGPL-3.0 - see LICENSE file in the repository
