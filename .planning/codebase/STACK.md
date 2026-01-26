# Technology Stack

**Analysis Date:** 2026-01-24

## Languages

**Primary:**
- TypeScript 5.6.2 - Frontend application code in `src/`
- Rust (Edition 2021) - Backend/Tauri application in `src-tauri/`
- JavaScript - Build scripts and configuration files

**Secondary:**
- HTML5 - UI markup in `index.html`
- CSS - Styling via Tailwind CSS

## Runtime

**Environment:**
- Node.js/Bun - JavaScript/TypeScript execution for frontend build and dev server
- Tauri 2.7.1 - Desktop application framework wrapping the web app

**Package Manager:**
- npm (npm-lock.json present)
- pnpm (pnpm-lock.yaml present)
- bun (bun.lock and bun.lockb present)
- Cargo - Rust package management (`src-tauri/Cargo.toml`)

## Frameworks

**Core Frontend:**
- React 18.3.1 - UI component framework
- Vite 6.0.3 - Build tool and dev server with HMR

**Desktop/Native:**
- Tauri 2.7.1 - Cross-platform desktop app framework
- Tauri Plugins:
  - `tauri-plugin-shell` 2.0.1 - Execute shell commands
  - `tauri-plugin-dialog` 2.0.2 - File/dialog interactions
  - `tauri-plugin-fs` 2 - Filesystem access
  - `tauri-plugin-process` 2 - Process management
  - `tauri-plugin-updater` 2 - Auto-update functionality
  - `tauri-plugin-notification` 2 - Desktop notifications
  - `tauri-plugin-clipboard-manager` 2 - Clipboard access
  - `tauri-plugin-global-shortcut` 2.0.0 - Global keyboard shortcuts
  - `tauri-plugin-opener` 2 - Open external applications
  - `tauri-plugin-http` 2 - HTTP requests

**Backend/Web Server:**
- Axum 0.8 - Async web framework (Rust)
- Tower 0.5 - HTTP middleware framework
- Tokio 1 (full features) - Async runtime

**UI/Component Libraries:**
- Radix UI - Accessible headless components:
  - `@radix-ui/react-dialog` 1.1.4
  - `@radix-ui/react-dropdown-menu` 2.1.15
  - `@radix-ui/react-label` 2.1.1
  - `@radix-ui/react-popover` 1.1.4
  - `@radix-ui/react-radio-group` 1.3.7
  - `@radix-ui/react-select` 2.1.3
  - `@radix-ui/react-switch` 1.1.3
  - `@radix-ui/react-tabs` 1.1.3
  - `@radix-ui/react-toast` 1.2.3
  - `@radix-ui/react-tooltip` 1.1.5
- Tailwind CSS 4.1.8 - Utility-first CSS framework
- Tailwind plugins:
  - `@tailwindcss/cli` 4.1.8
  - `@tailwindcss/vite` 4.1.8

**Form & Validation:**
- React Hook Form 7.54.2 - Performant form library
- `@hookform/resolvers` 3.9.1 - Form validation resolvers
- Zod 3.24.1 - Schema validation library

**State Management:**
- Zustand 5.0.6 - Lightweight state management
- React Context API - For local state

**Editor & Markdown:**
- `@uiw/react-md-editor` 4.0.7 - Markdown editor
- React Markdown 9.0.3 - Markdown rendering
- `remark-gfm` 4.0.0 - GitHub-flavored markdown support
- React Syntax Highlighter 15.6.1 - Code highlighting

**Data Visualization:**
- Recharts 2.14.1 - Composable charting library

**Utilities:**
- Date-fns 3.6.0 - Date manipulation and formatting
- clsx 2.1.1 - Conditional className utility
- tailwind-merge 2.6.0 - Merge Tailwind classes
- class-variance-authority 0.7.1 - Component variant management
- Diff 8.0.2 - Text diffing
- html2canvas 1.4.1 - Screenshot/canvas rendering
- framer-motion 12.0.0-alpha.1 - Animation library
- Lucide React 0.468.0 - Icon library
- ansi-to-html 0.7.2 - ANSI terminal color to HTML

**Analytics:**
- PostHog 1.258.3 - Product analytics and event tracking

## Rust Dependencies

**Core:**
- Serde 1 (with derive) - Serialization/deserialization
- serde_json 1 - JSON parsing
- serde_yaml 0.9 - YAML parsing

**Async & Concurrency:**
- Tokio 1 (full features) - Async runtime
- Futures 0.3 - Future combinators
- Async-trait 0.1 - Async trait support
- Futures-util 0.3 - Future utilities

**Networking:**
- Reqwest 0.12 (with JSON and native-tls-vendored) - HTTP client for API requests

**Database:**
- Rusqlite 0.32 (with bundled sqlite) - SQLite database driver

**Utilities:**
- Chrono 0.4 (with serde) - Date/time handling
- UUID 1.6 (with v4 and serde) - UUID generation
- Base64 0.22 - Base64 encoding/decoding
- Regex 1 - Regular expressions
- Glob 0.3 - Glob patterns
- Walkdir 2 - Directory traversal
- Which 7 - Find executables in PATH
- Dirs 5 - Cross-platform user directories
- Tempfile 3 - Temporary files
- Anyhow 1 - Error handling
- Log 0.4 - Logging facade
- Env_logger 0.11 - Logging implementation

**Compression & Cryptography:**
- Zstd 0.13 - Zstandard compression
- SHA2 0.10 - SHA-256 hashing

**macOS Specific:**
- Cocoa 0.26 - macOS/Cocoa FFI
- Objc 0.2 - Objective-C runtime
- Window-vibrancy 0.5 - macOS window effects

**Image Processing:**
- Image 0.25.1 (pinned) - Image format support
- Sharp 0.34.2 (optional) - Image processing (dev dependency)

## Configuration

**Environment:**
- Vite environment variables via `import.meta.env`:
  - `VITE_PUBLIC_POSTHOG_KEY` - PostHog API key
  - `VITE_PUBLIC_POSTHOG_HOST` - PostHog server host
  - Mode detection: `development` vs other modes

**Build:**
- TypeScript config: `tsconfig.json`
- Vite config: `vite.config.ts`
- Tauri config: `src-tauri/tauri.conf.json`
- Tauri Info.plist: `src-tauri/Info.plist`
- Cargo config: `src-tauri/Cargo.toml`

**Database:**
- SQLite bundled with Rusqlite
- Database location: Auto-initialized via `init_database()` (likely in `~/.claude/`)
- Tables for agents and agent runs managed through `storage_*` commands

## Platform Requirements

**Development:**
- Node.js or Bun package manager
- Rust toolchain (for Tauri desktop builds)
- TypeScript compiler (tsc)
- Git (for version control)

**Production:**
- Tauri desktop app:
  - macOS 10.13+ (desktop)
  - Windows 10+ (desktop)
  - Linux with GTK support (desktop)
- Web mode:
  - Modern browser with WebSocket support (for real-time communication)
  - Available at `http://0.0.0.0:{port}` when running web server

**Architecture:**
- Desktop app (Tauri): Webpack/Vite frontend + Rust backend via IPC
- Web mode: Vite SPA + Axum web server with WebSocket support

---

*Stack analysis: 2026-01-24*
