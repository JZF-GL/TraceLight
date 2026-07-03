# Project Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a fully runnable Electron + React + TypeScript + Vite desktop app for TraceLight with all core dependencies configured and dev server working.

**Architecture:** electron-vite manages three Electron processes (main, preload, renderer) with a single config file. Renderer uses React + Ant Design + React Router. Main process runs better-sqlite3 and isomorphic-git. Communication via typed IPC through a context-isolated preload script.

**Tech Stack:** electron-vite, Electron 33+, React 19, TypeScript 5.x, Vite 6.x, Ant Design 5.x, Zustand 5.x, React Router 6.x, better-sqlite3, isomorphic-git, ESLint 9.x (flat config), Prettier

## Global Constraints

- Package manager: **pnpm** (strict hoisting, fast)
- Node.js: **>=18.0.0**
- TypeScript strict mode enabled
- React 19 + ReactDOM 19
- Ant Design 5.x with `colorPrimary: #4F46E5`
- All electron main/preload code runs in Node context (ESM output)
- Renderer code is browser-targeted (DOM APIs only)
- Path alias: `@/` → `src/`
- README.md must NOT be overwritten
- `prisma/` directory from README §9 is dropped (incompatible with better-sqlite3)
- No `scripts/` directory — build tooling handled by electron-vite

---

### Task 1: Initialize project and install dependencies

**Covers:** S1, S15

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Modify: (none)

**Interfaces:**
- Consumes: (none)
- Produces: `package.json` with all dependencies, `.gitignore`, git repo initialized

- [ ] **Step 1: Initialize git repo**

```powershell
cd E:\code\TraceLight
git init
```

- [ ] **Step 2: Create .gitignore**

```
node_modules/
dist/
dist-electron/
out/
*.db
.env
.env.local
.DS_Store
Thumbs.db
*.log
```

- [ ] **Step 3: Create package.json**

```json
{
  "name": "tracelight",
  "version": "0.1.0",
  "description": "Git Commit 日报/周报生成器",
  "main": "dist-electron/main.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "lint": "eslint .",
    "format": "prettier --write \"src/**/*.{ts,tsx,css}\" \"electron/**/*.ts\""
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 4: Install all dependencies**

```powershell
cd E:\code\TraceLight

# Core
pnpm add electron@^33.0.0 react@^19.0.0 react-dom@^19.0.0

# Build tooling
pnpm add -D electron-vite vite@^6.0.0 @vitejs/plugin-react typescript@^5.7.0

# UI
pnpm add antd@^5.23.0 @ant-design/icons@^5.6.0

# State management
pnpm add zustand@^5.0.0

# Routing
pnpm add react-router-dom@^6.28.0

# Database
pnpm add better-sqlite3@^11.0.0
pnpm add -D @types/better-sqlite3

# Git
pnpm add isomorphic-git

# ESLint + Prettier
pnpm add -D eslint@^9.0.0 @eslint/js typescript-eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier

# Types
pnpm add -D @types/node @types/react @types/react-dom
```

- [ ] **Step 5: Commit**

```powershell
cd E:\code\TraceLight
git add -A
git commit -m "chore: initialize project with all dependencies"
```

---

### Task 2: TypeScript configuration

**Covers:** S13

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.web.json`

**Interfaces:**
- Consumes: (none)
- Produces: Three tsconfig files that other tasks reference for type checking

- [ ] **Step 1: Create base tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

- [ ] **Step 2: Create tsconfig.node.json (Electron main + preload)**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022"],
    "outDir": "./dist-electron",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["node"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["electron/**/*.ts", "electron.vite.config.ts"]
}
```

- [ ] **Step 3: Create tsconfig.web.json (React renderer)**

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.d.ts"]
}
```

- [ ] **Step 4: Commit**

```powershell
cd E:\code\TraceLight
git add tsconfig.json tsconfig.node.json tsconfig.web.json
git commit -m "chore: add TypeScript configuration"
```

---

### Task 3: Create directory structure

**Covers:** S14

**Files:**
- Create: (all directories, plus placeholder files to ensure git tracks them)

**Interfaces:**
- Consumes: (none)
- Produces: All directories from README §9

- [ ] **Step 1: Create all directories**

```powershell
cd E:\code\TraceLight
mkdir electron\ipc
mkdir electron\db
mkdir electron\git
mkdir src\components
mkdir src\services
mkdir src\hooks
mkdir src\utils
mkdir src\styles
mkdir src\pages\Dashboard
mkdir src\pages\Repos
mkdir src\pages\Commits
mkdir src\pages\Daily
mkdir src\pages\Weekly
mkdir src\pages\Stats
mkdir src\pages\Settings
```

- [ ] **Step 2: Create .gitkeep files**

Create empty `.gitkeep` in each directory that has no other files:
- `electron/ipc/.gitkeep`
- `electron/db/.gitkeep`
- `electron/git/.gitkeep`
- `src/components/.gitkeep`
- `src/services/.gitkeep`
- `src/hooks/.gitkeep`
- `src/utils/.gitkeep`
- `src/styles/.gitkeep`

- [ ] **Step 3: Commit**

```powershell
cd E:\code\TraceLight
git add -A
git commit -m "chore: create project directory structure"
```

---

### Task 4: Electron main process and preload

**Covers:** S3, S4

**Files:**
- Create: `electron/main.ts`
- Create: `electron/preload.ts`
- Create: `src/renderer.d.ts`

**Interfaces:**
- Consumes: tsconfig.node.json from Task 2
- Produces: `electron/main.ts` exports nothing (runs as entry), `electron/preload.ts` exposes `window.electronAPI`

- [ ] **Step 1: Create electron/main.ts**

```typescript
import { app, BrowserWindow, shell } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

- [ ] **Step 2: Create electron/preload.ts**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
}

const electronAPI: ElectronAPI = {
  invoke: (channel: string, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
```

- [ ] **Step 3: Create src/renderer.d.ts**

```typescript
interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
}

interface Window {
  electronAPI: ElectronAPI;
}
```

- [ ] **Step 4: Commit**

```powershell
cd E:\code\TraceLight
git add electron/main.ts electron/preload.ts src/renderer.d.ts
git commit -m "feat: add Electron main process and preload script"
```

---

### Task 5: Vite configuration (electron-vite)

**Covers:** S2

**Files:**
- Create: `electron.vite.config.ts`

**Interfaces:**
- Consumes: Task 3 (directory structure), Task 4 (electron entry points)
- Produces: Vite build config used by `electron-vite dev` and `electron-vite build`

- [ ] **Step 1: Create electron.vite.config.ts**

```typescript
import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['better-sqlite3'],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src'),
      },
    },
    plugins: [react()],
  },
});
```

- [ ] **Step 2: Commit**

```powershell
cd E:\code\TraceLight
git add electron.vite.config.ts
git commit -m "feat: add electron-vite configuration"
```

---

### Task 6: React renderer entry and App shell

**Covers:** S5, S6

**Files:**
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`

**Interfaces:**
- Consumes: Task 5 (Vite config with `@/` alias)
- Produces: React app root rendered into `#root`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TraceLight</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Create src/main.tsx**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Create src/App.tsx (minimal, no router yet)**

```tsx
import { ConfigProvider } from 'antd';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4F46E5',
        },
      }}
    >
      <div style={{ padding: 24 }}>
        <h1>TraceLight</h1>
        <p>Git Commit 日报/周报生成器</p>
      </div>
    </ConfigProvider>
  );
}

export default App;
```

- [ ] **Step 4: Commit**

```powershell
cd E:\code\TraceLight
git add index.html src/main.tsx src/App.tsx
git commit -m "feat: add React renderer entry and App shell"
```

---

### Task 7: Zustand store setup

**Covers:** S7

**Files:**
- Create: `src/stores/app.ts`
- Create: `src/stores/index.ts`

**Interfaces:**
- Consumes: Task 6 (App shell)
- Produces: `useAppStore` hook exported from `src/stores/index.ts`

- [ ] **Step 1: Create src/stores/app.ts**

```typescript
import { create } from 'zustand';

interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
}));
```

- [ ] **Step 2: Create src/stores/index.ts**

```typescript
export { useAppStore } from './app';
```

- [ ] **Step 3: Commit**

```powershell
cd E:\code\TraceLight
git add src/stores/app.ts src/stores/index.ts
git commit -m "feat: add Zustand store setup"
```

---

### Task 8: React Router 6 and page stubs

**Covers:** S8, S9

**Files:**
- Create: `src/router.tsx`
- Create: `src/pages/Dashboard/index.tsx`
- Create: `src/pages/Repos/index.tsx`
- Create: `src/pages/Commits/index.tsx`
- Create: `src/pages/Daily/index.tsx`
- Create: `src/pages/Weekly/index.tsx`
- Create: `src/pages/Stats/index.tsx`
- Create: `src/pages/Settings/index.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: Task 6 (App shell), Task 7 (stores)
- Produces: Router with 7 routes, each rendering a stub page

- [ ] **Step 1: Create src/router.tsx**

```tsx
import { createHashRouter, Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import Repos from '@/pages/Repos';
import Commits from '@/pages/Commits';
import Daily from '@/pages/Daily';
import Weekly from '@/pages/Weekly';
import Stats from '@/pages/Stats';
import Settings from '@/pages/Settings';

const router = createHashRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/repos', element: <Repos /> },
  { path: '/commits', element: <Commits /> },
  { path: '/daily', element: <Daily /> },
  { path: '/weekly', element: <Weekly /> },
  { path: '/stats', element: <Stats /> },
  { path: '/settings', element: <Settings /> },
]);

export default router;
```

- [ ] **Step 2: Create page stubs**

Each page follows this pattern (replace `PAGE_NAME` with the actual name):

```tsx
import { Card } from 'antd';

function PAGE_NAME() {
  return (
    <Card title="PAGE_LABEL">
      <p>PAGE_LABEL 页面开发中...</p>
    </Card>
  );
}

export default PAGE_NAME;
```

Create these 7 files:

- `src/pages/Dashboard/index.tsx` — title: "仪表盘"
- `src/pages/Repos/index.tsx` — title: "仓库管理"
- `src/pages/Commits/index.tsx` — title: "提交记录"
- `src/pages/Daily/index.tsx` — title: "日报"
- `src/pages/Weekly/index.tsx` — title: "周报"
- `src/pages/Stats/index.tsx` — title: "统计"
- `src/pages/Settings/index.tsx` — title: "设置"

- [ ] **Step 3: Update src/App.tsx to use router**

```tsx
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import router from './router';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4F46E5',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
```

- [ ] **Step 4: Commit**

```powershell
cd E:\code\TraceLight
git add src/router.tsx src/pages/ src/App.tsx
git commit -m "feat: add React Router 6 with 7 page stubs"
```

---

### Task 9: better-sqlite3 database layer

**Covers:** S10

**Files:**
- Create: `electron/db/schema.ts`
- Create: `electron/db/index.ts`
- Modify: `electron/main.ts`

**Interfaces:**
- Consumes: Task 3 (electron/db/ directory), tsconfig.node.json from Task 2
- Produces: `getDatabase()` function returning a Database instance, `initializeDatabase()` for table creation

- [ ] **Step 1: Create electron/db/schema.ts**

```typescript
export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS repos (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    remote_url TEXT NOT NULL,
    local_path TEXT NOT NULL,
    branch     TEXT DEFAULT 'main',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    token    TEXT,
    ssh_key  TEXT,
    type     TEXT DEFAULT 'github'
  );

  CREATE TABLE IF NOT EXISTS commits (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id        INTEGER REFERENCES repos(id),
    hash           TEXT NOT NULL UNIQUE,
    message        TEXT NOT NULL,
    author         TEXT NOT NULL,
    date           DATETIME NOT NULL,
    additions      INTEGER DEFAULT 0,
    deletions      INTEGER DEFAULT 0,
    files_changed  INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS reports (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    type       TEXT NOT NULL,
    date       DATE NOT NULL,
    content    TEXT NOT NULL,
    ai_summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;
```

- [ ] **Step 2: Create electron/db/index.ts**

```typescript
import Database from 'better-sqlite3';
import { join } from 'path';
import { app } from 'electron';
import { SCHEMA_SQL } from './schema';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const dbPath = join(app.getPath('userData'), 'tracelight.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  return db;
}

export function initializeDatabase(): void {
  const database = getDatabase();
  database.exec(SCHEMA_SQL);
}
```

- [ ] **Step 3: Update electron/main.ts to initialize database**

Add at the top of `app.whenReady().then(...)` before `createWindow()`:

```typescript
import { initializeDatabase } from './db';

app.whenReady().then(() => {
  initializeDatabase();
  createWindow();
  // ... rest unchanged
});
```

- [ ] **Step 4: Commit**

```powershell
cd E:\code\TraceLight
git add electron/db/ electron/main.ts
git commit -m "feat: add better-sqlite3 database layer with schema"
```

---

### Task 10: isomorphic-git placeholder

**Covers:** S11

**Files:**
- Create: `electron/git/index.ts`

**Interfaces:**
- Consumes: Task 3 (electron/git/ directory)
- Produces: `listCommits(repoPath, since)` function signature (returns empty array)

- [ ] **Step 1: Create electron/git/index.ts**

```typescript
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web/index.js';

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

export async function listCommits(
  repoPath: string,
  since?: Date,
): Promise<GitCommit[]> {
  // Placeholder — full implementation in a future task
  // Will use git.log() to read commits from the local repo
  void git;
  void http;
  return [];
}
```

- [ ] **Step 2: Commit**

```powershell
cd E:\code\TraceLight
git add electron/git/index.ts
git commit -m "feat: add isomorphic-git placeholder module"
```

---

### Task 11: ESLint + Prettier configuration

**Covers:** S12

**Files:**
- Create: `eslint.config.js`
- Create: `.prettierrc`
- Create: `.prettierignore`

**Interfaces:**
- Consumes: Task 1 (dependencies installed)
- Produces: Linting and formatting config

- [ ] **Step 1: Create .prettierrc**

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

- [ ] **Step 2: Create .prettierignore**

```
node_modules
dist
dist-electron
out
*.db
```

- [ ] **Step 3: Create eslint.config.js**

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'react-refresh': reactRefreshPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    ignores: ['dist/**', 'dist-electron/**', 'node_modules/**'],
  },
);
```

- [ ] **Step 4: Commit**

```powershell
cd E:\code\TraceLight
git add eslint.config.js .prettierrc .prettierignore
git commit -m "chore: add ESLint and Prettier configuration"
```

---

### Task 12: Verify dev server and build

**Covers:** S2 (validation)

**Files:**
- Modify: (none — verification only)

**Interfaces:**
- Consumes: All previous tasks
- Produces: Confirmed working dev server and build

- [ ] **Step 1: Run dev server**

```powershell
cd E:\code\TraceLight
pnpm dev
```

Expected: Electron window opens showing "TraceLight" with Ant Design styling. Vite HMR active.

- [ ] **Step 2: Verify build**

Stop the dev server, then:

```powershell
cd E:\code\TraceLight
pnpm build
```

Expected: `dist-electron/` and `dist/` directories created without errors.

- [ ] **Step 3: Run lint**

```powershell
cd E:\code\TraceLight
pnpm lint
```

Expected: No errors (warnings acceptable).

- [ ] **Step 4: Final commit**

```powershell
cd E:\code\TraceLight
git add -A
git commit -m "chore: verify dev environment works end-to-end"
```

---

## Dependency Graph

```
Task 1 (init) ──────────┬──→ Task 2 (tsconfig) ──→ Task 4 (electron main/preload)
                        │                            ↓
                        ├──→ Task 3 (directories) ──→ Task 5 (vite config)
                        │                            ↓
                        │                         Task 6 (react entry)
                        │                            ↓
                        │                         Task 7 (zustand)
                        │                            ↓
                        │                         Task 8 (router + pages)
                        │
                        ├──→ Task 9 (sqlite) ──→ depends on Task 3
                        │
                        ├──→ Task 10 (isomorphic-git) ──→ depends on Task 3
                        │
                        ├──→ Task 11 (eslint/prettier)
                        │
                        └──→ Task 12 (verify) ──→ depends on ALL above
```

**Parallelizable groups:**
- After Task 1: Tasks 2, 3, 9, 10, 11 can run in parallel
- After Task 3: Tasks 4, 5, 9, 10 can run in parallel
- After Task 5: Task 6 can start
- Task 12 is always last
