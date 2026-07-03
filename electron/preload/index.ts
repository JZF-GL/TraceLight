import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  // Git operations
  git: {
    addRepo: (repo: { name: string; remote_url: string; local_path: string; branch: string }) =>
      ipcRenderer.invoke('git:add-repo', repo),
    updateRepo: (id: number, repo: { name: string; remote_url: string; local_path: string; branch: string }) =>
      ipcRenderer.invoke('git:update-repo', id, repo),
    removeRepo: (id: number) => ipcRenderer.invoke('git:remove-repo', id),
    getRepos: () => ipcRenderer.invoke('git:get-repos'),
    getRemoteBranches: (localPath: string) =>
      ipcRenderer.invoke('git:get-remote-branches', localPath),
    syncLocal: (repoId: number, since: string) =>
      ipcRenderer.invoke('git:sync-local', repoId, since),
    syncRemote: (repoId: number, since: string, auth?: { username?: string; password?: string; token?: string }) =>
      ipcRenderer.invoke('git:sync-remote', repoId, since, auth),
    getCommits: (filters: { repoId?: number; since?: string; until?: string }) =>
      ipcRenderer.invoke('git:get-commits', filters)
  },

  // Account operations
  account: {
    addAccount: (account: { username: string; password?: string; token?: string; ssh_key?: string; type: string; method: string }) =>
      ipcRenderer.invoke('account:add-account', account),
    removeAccount: (id: number) => ipcRenderer.invoke('account:remove-account', id),
    getAccounts: () => ipcRenderer.invoke('account:get-accounts')
  },

  // Report operations
  report: {
    generateDaily: (date: string) => ipcRenderer.invoke('report:generate-daily', date),
    generateWeekly: (date: string) => ipcRenderer.invoke('report:generate-weekly', date),
    getReport: (type: string, date: string) => ipcRenderer.invoke('report:get-report', type, date),
    saveReport: (report: { type: string; date: string; content: string }) =>
      ipcRenderer.invoke('report:save-report', report)
  },

  // AI operations
  ai: {
    summarize: (commits: string[], type: 'daily' | 'weekly') =>
      ipcRenderer.invoke('ai:summarize', commits, type),
    configure: (config: { provider: string; apiKey?: string; model?: string }) =>
      ipcRenderer.invoke('ai:configure', config)
  },

  // Stats operations
  stats: {
    getOverview: () => ipcRenderer.invoke('stats:overview'),
    getTrend: (days: number) => ipcRenderer.invoke('stats:trend', days)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-expect-error electronAPI is not typed
  window.electron = electronAPI
  // @ts-expect-error api is not typed
  window.api = api
}
