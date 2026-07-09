# Project Setup Specification

> [!NOTE]
> This document may not reflect the current implementation.
> See the final report for up-to-date state:
> [Final Report](../reports/project-setup.md)

> Scope: Initialize a fully runnable Electron + React + TypeScript + Vite desktop application for TraceLight.

## S1. Project Initialization

Initialize the project with pnpm as the package manager. Create `package.json` with:
- `name`: "tracelight"
- `version`: "1.0.0"
- `description`: "Git Commit 日报/周报生成器"
- `main`: "dist-electron/main.js"
- `scripts`: `dev`, `build`, `preview`, `lint`, `format`
- `engines.node`: ">=18.0.0"

## S2. Electron + Vite Integration (electron-vite)

Use `electron-vite` as the build tooling. Configuration:
- `electron.vite.config.ts` at project root defining `main`, `preload`, and `renderer` build configs
- Main process entry: `electron/main.ts` → compiles to `dist-electron/main.js`
- Preload script: `electron/preload.ts` → compiles to `dist-electron/preload.js`
- Renderer entry: `index.html` → `src/main.tsx` → React app
- Dev mode: `electron-vite dev` launches Electron with Vite HMR
- Build mode: `electron-vite build` produces `dist-electron/` and `dist/`

## S3. Electron Main Process

Create `electron/main.ts`:
- Creates a `BrowserWindow` with `preload.ts` and `contextIsolation: true`
- Loads the Vite dev server URL in dev, or `dist/index.html` in production
- Window defaults: 1200x800, titleBarStyle for platform compatibility

## S4. Electron Preload Script

Create `electron/preload.ts`:
- Exposes a `window.electronAPI` via `contextBridge.exposeInMainWorld`
- Provides typed IPC invoke wrappers (initially empty, ready for future IPC channels)

## S5. React Renderer Entry

Create renderer files:
- `index.html` — minimal HTML shell loading `/src/main.tsx`
- `src/main.tsx` — renders `<App />` into `#root`
- `src/App.tsx` — React Router setup with Ant Design `ConfigProvider`

## S6. Ant Design 5.x Integration

- Install `antd` and `@ant-design/icons`
- Wrap app in `<ConfigProvider>` with theme: `{ token: { colorPrimary: '#4F46E5' } }`

## S7. Zustand State Management

- Install `zustand`
- Create `src/stores/app.ts` with `theme: 'light'` and `setTheme` action
- Create `src/stores/index.ts` — re-exports all stores

## S8. React Router 6

- Install `react-router-dom@6`
- Create `src/router.tsx` with routes for all 7 pages:
  - `/dashboard` → Dashboard
  - `/repos` → Repos
  - `/commits` → Commits
  - `/daily` → Daily
  - `/weekly` → Weekly
  - `/stats` → Stats
  - `/settings` → Settings
- Default redirect: `/` → `/dashboard`

## S9. Page Stubs

Create stub pages under `src/pages/`:
- Each page renders an `<antd Card>` with the page title
- Pages: Dashboard, Repos, Commits, Daily, Weekly, Stats, Settings
- Each is a directory with `index.tsx`

## S10. better-sqlite3 Integration

- Install `better-sqlite3` and `@types/better-sqlite3`
- Create `electron/db/schema.ts` — SQL for all 4 tables from README §4.2
- Create `electron/db/index.ts` — exports `getDatabase()` and `initializeDatabase()`
- Database file stored in `app.getPath('userData')/tracelight.db`

## S11. isomorphic-git Integration

- Install `isomorphic-git`
- Create `electron/git/index.ts` — placeholder module exporting `listCommits(repoPath, since)` (returns empty array initially)

## S12. ESLint + Prettier

- Install ESLint 9.x with flat config, TypeScript parser, React plugins, Prettier
- Create `eslint.config.js` (flat config format)
- Create `.prettierrc` with standard settings
- Create `.prettierignore`

## S13. TypeScript Configuration

- Create `tsconfig.json` — base config extending to both main and renderer
- Create `tsconfig.node.json` — for electron main/preload (Node environment)
- Create `tsconfig.web.json` — for renderer (DOM environment)
- Path alias: `@/` → `src/`

## S14. Directory Structure

Create all directories per README §9 (minus `prisma/` which conflicts with better-sqlite3):
```
electron/
electron/ipc/
electron/db/
electron/git/
src/
src/components/
src/pages/Dashboard/
src/pages/Repos/
src/pages/Commits/
src/pages/Daily/
src/pages/Weekly/
src/pages/Stats/
src/pages/Settings/
src/stores/
src/services/
src/hooks/
src/utils/
src/styles/
```

## S15. .gitignore and Git Init

Create `.gitignore` covering: `node_modules/`, `dist/`, `dist-electron/`, `.env`, `*.db`, `out/`.
Initialize git repository if not already one.

## S16. README.md Preservation

The existing `README.md` must NOT be overwritten. It is the canonical project specification.
