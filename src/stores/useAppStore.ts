import { create } from 'zustand'

interface Repo {
  id: number
  name: string
  remote_url: string
  local_path: string
  branch: string
  created_at: string
}

interface Account {
  id: number
  username: string
  token?: string
  ssh_key?: string
  type: string
}

interface Commit {
  id: number
  repo_id: number
  hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  files_changed: number
  repo_name?: string
}

interface Report {
  id: number
  type: string
  date: string
  content: string
  ai_summary?: string
  created_at: string
}

interface AppState {
  repos: Repo[]
  accounts: Account[]
  commits: Commit[]
  reports: Report[]
  loading: boolean
  error: string | null

  setRepos: (repos: Repo[]) => void
  setAccounts: (accounts: Account[]) => void
  setCommits: (commits: Commit[]) => void
  setReports: (reports: Report[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  repos: [],
  accounts: [],
  commits: [],
  reports: [],
  loading: false,
  error: null,

  setRepos: (repos) => set({ repos }),
  setAccounts: (accounts) => set({ accounts }),
  setCommits: (commits) => set({ commits }),
  setReports: (reports) => set({ reports }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))
