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
    generateDaily: (date: string) => Promise<{ content: string; commits: any[] }>
    generateWeekly: (date: string) => Promise<{ content: string; commits: any[] }>
    getReport: (type: string, date: string) => Promise<any>
    saveReport: (report: { type: string; date: string; content: string }) => Promise<any>
  }

  // AI operations
  ai: {
    summarize: (commits: string[], type: 'daily' | 'weekly') => Promise<string>
    configure: (config: { provider: string; apiKey?: string; model?: string }) => Promise<void>
  }

  // Stats operations
  stats: {
    getOverview: () => Promise<{ totalRepos: number; totalCommits: number; todayCommits: number }>
    getTrend: (days: number) => Promise<{ labels: string[]; values: number[] }>
  }
}

interface Window {
  api: ElectronAPI
}
