import { ipcMain } from 'electron'
import { getDatabaseService } from '../services/db'

export function registerStatsHandlers(): void {
  ipcMain.handle('stats:overview', async () => {
    return getDatabaseService().getStats()
  })

  ipcMain.handle('stats:trend', async (_, days: number) => {
    const commits = getDatabaseService().getCommits({
      since: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    })

    // Group by date
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
}
