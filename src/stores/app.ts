import { create } from 'zustand'
import dayjs from 'dayjs'

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
  repo_id?: number
  hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  files_changed: number
  repo_name: string
}

interface Report {
  id: number
  type: string
  date: string
  content: string
  ai_summary?: string
  created_at: string
}

interface CommitsPageState {
  dateRange: [dayjs.Dayjs | null, dayjs.Dayjs | null]
  selectedRepo: number | null
  quickRange: 'today' | 'week' | 'month' | null
  commits: Commit[]
}

interface DailyPageState {
  selectedDate: dayjs.Dayjs
  selectedAuthor: string | undefined
  summaries: Record<string, string>
  currentContent: string
  commits: any[]
}

interface WeeklyPageState {
  selectedWeek: dayjs.Dayjs
  selectedAuthor: string | undefined
  summaries: Record<string, string>
  currentContent: string
  commits: any[]
}

interface AppState {
  theme: 'light' | 'dark'
  repos: Repo[]
  accounts: Account[]
  commits: Commit[]
  reports: Report[]
  loading: boolean
  error: string | null

  commitsPage: CommitsPageState
  dailyPage: DailyPageState
  weeklyPage: WeeklyPageState

  setTheme: (theme: 'light' | 'dark') => void
  setRepos: (repos: Repo[]) => void
  setAccounts: (accounts: Account[]) => void
  setCommits: (commits: Commit[]) => void
  setReports: (reports: Report[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  setCommitsPage: (state: Partial<CommitsPageState>) => void
  setDailyPage: (state: Partial<DailyPageState>) => void
  setWeeklyPage: (state: Partial<WeeklyPageState>) => void
}

export const useAppStore = create<AppState>((set) => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  const savedCommitsPage = localStorage.getItem('commitsPage')
  let initCommitsPage = {
    dateRange: [dayjs().startOf('day'), dayjs().endOf('day')] as [dayjs.Dayjs, dayjs.Dayjs],
    selectedRepo: null as number | null,
    quickRange: 'today' as 'today' | 'week' | 'month' | null,
    commits: [] as Commit[]
  }
  if (savedCommitsPage) {
    try {
      const parsed = JSON.parse(savedCommitsPage)
      initCommitsPage = {
        ...parsed,
        dateRange: [dayjs(parsed.dateRange[0]), dayjs(parsed.dateRange[1])],
        commits: []
      }
    } catch { /* ignore */ }
  }

  return {
    theme: savedTheme || 'light',
    repos: [],
    accounts: [],
    commits: [],
    reports: [],
    loading: false,
    error: null,

    commitsPage: initCommitsPage,
    dailyPage: {
      selectedDate: dayjs(),
      selectedAuthor: undefined,
      summaries: {},
      currentContent: '',
      commits: []
    },
    weeklyPage: {
      selectedWeek: dayjs(),
      selectedAuthor: undefined,
      summaries: {},
      currentContent: '',
      commits: []
    },

    setTheme: (theme) => {
      localStorage.setItem('theme', theme)
      set({ theme })
    },
    setRepos: (repos) => set({ repos }),
    setAccounts: (accounts) => set({ accounts }),
    setCommits: (commits) => set({ commits }),
    setReports: (reports) => set({ reports }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    setCommitsPage: (state) => set((s) => {
      const next = { ...s.commitsPage, ...state }
      const toSave = {
        ...next,
        dateRange: [next.dateRange[0]?.toISOString(), next.dateRange[1]?.toISOString()]
      }
      localStorage.setItem('commitsPage', JSON.stringify(toSave))
      return { commitsPage: next }
    }),
    setDailyPage: (state) => set((s) => ({ dailyPage: { ...s.dailyPage, ...state } })),
    setWeeklyPage: (state) => set((s) => ({ weeklyPage: { ...s.weeklyPage, ...state } }))
  }
})
