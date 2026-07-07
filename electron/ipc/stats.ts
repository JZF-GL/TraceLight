import { ipcMain } from 'electron'
import { getDatabaseService } from '../services/db'

export function registerStatsHandlers(): void {
  ipcMain.handle('stats:overview', async () => {
    return getDatabaseService().getStats()
  })

  ipcMain.handle('stats:trend', async (_, days: number) => {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const commits = getDatabaseService().getCommits({ since })

    const trend: Record<string, number> = {}
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      trend[dateStr] = 0
    }

    commits.forEach((commit) => {
      const dateStr = commit.date.split('T')[0]
      if (trend[dateStr] !== undefined) {
        trend[dateStr]++
      }
    })

    return {
      labels: Object.keys(trend),
      values: Object.values(trend)
    }
  })

  ipcMain.handle('stats:repo-contributions', async () => {
    const commits = getDatabaseService().getCommits({})
    const repoMap: Record<string, number> = {}
    commits.forEach((c) => {
      const name = (c as any).repo_name || 'Unknown'
      repoMap[name] = (repoMap[name] || 0) + 1
    })
    return Object.entries(repoMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })
}
