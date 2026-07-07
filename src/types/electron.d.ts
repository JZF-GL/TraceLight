interface ElectronAPI {
  // Git operations
  git: {
    addRepo: (repo: { name: string; remote_url: string; local_path: string; branch: string }) => Promise<any>
    updateRepo: (id: number, repo: { name: string; remote_url: string; local_path: string; branch: string }) => Promise<void>
    removeRepo: (id: number) => Promise<void>
    getRepos: () => Promise<Array<{
      id: number
      name: string
      remote_url: string
      local_path: string
      branch: string
      created_at: string
    }>>
    syncCommits: (repoId: number, since: string, auth?: { username?: string; password?: string; token?: string }) => Promise<any[]>
    getRemoteBranches: (localPath: string) => Promise<string[]>
    syncLocal: (repoId: number, since: string) => Promise<any[]>
    syncRemote: (repoId: number, since: string, auth?: { username?: string; password?: string; token?: string }) => Promise<any[]>
    getCommits: (filters: { repoId?: number; since?: string; until?: string }) => Promise<Array<{
      id: number
      hash: string
      message: string
      author: string
      date: string
      additions: number
      deletions: number
      files_changed: number
      repo_name: string
    }>>
  }

  // Account operations
  account: {
    addAccount: (account: { username: string; password?: string; token?: string; ssh_key?: string; type: string; method: string }) => Promise<{
      id: number
      username: string
      password?: string
      token?: string
      ssh_key?: string
      type: string
      method: string
    }>
    updateAccount: (id: number, account: { username: string; password?: string; token?: string; ssh_key?: string; type: string; method: string }) => Promise<void>
    removeAccount: (id: number) => Promise<void>
    getAccounts: () => Promise<Array<{
      id: number
      username: string
      password?: string
      token?: string
      ssh_key?: string
      type: string
      method: string
    }>>
  }

  // Report operations
  report: {
    generateDaily: (date: string, author?: string) => Promise<{ commits: any[]; summaries: Record<string, string> }>
    generateWeekly: (date: string, author?: string) => Promise<{ commits: any[]; summaries: Record<string, string> }>
    getReport: (type: string, date: string, template?: string) => Promise<any>
    getReports: (type: string, date: string) => Promise<any[]>
    saveReport: (report: { type: string; date: string; template: string; content: string }) => Promise<any>
  }

  // AI operations
  ai: {
    summarize: (commits: string[], type: 'daily' | 'weekly') => Promise<string>
    summarizeStream: (commits: string[], type: 'daily' | 'weekly', template: 'technical' | 'concise' | 'detailed', onChunk: (chunk: string) => void, onEnd: () => void) => () => void
    configure: (config: { provider: string; apiKey?: string; model?: string; baseUrl?: string }) => Promise<void>
    getConfig: () => Promise<{ provider: string; apiKey?: string; model?: string; baseUrl?: string }>
  }

  // Stats operations
  stats: {
    getOverview: () => Promise<{ totalRepos: number; totalCommits: number; todayCommits: number }>
    getTrend: (days: number) => Promise<{ labels: string[]; values: number[] }>
  }

  // Settings operations
  settings: {
    clearAllData: () => Promise<{ cancelled?: boolean; success?: boolean; error?: string }>
    clearCache: () => Promise<{ success: boolean; error?: string }>
    getStorageInfo: () => Promise<{ database: number; cache: number; localStorage: number; total: number }>
  }
}

interface Window {
  api: ElectronAPI
}
