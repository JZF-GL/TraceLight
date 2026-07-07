import { ipcMain } from 'electron'
import { getDatabaseService } from '../services/db'

function formatTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function registerReportHandlers(): void {
  ipcMain.handle('report:generate-daily', async (_, date, author) => {
    const db = getDatabaseService()
    const commits = db.getCommits({
      since: date,
      until: date,
      author
    })

    const savedReports = db.getReportsByDate('daily', date)
    const summaries: Record<string, string> = {}
    for (const r of savedReports) {
      if (r.template && r.content) {
        summaries[r.template] = r.content
      }
    }

    return { commits, summaries }
  })

  ipcMain.handle('report:generate-weekly', async (_, date, author) => {
    const db = getDatabaseService()
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)

    const formatDate = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const commits = db.getCommits({
      since: formatDate(startDate),
      until: formatDate(endDate),
      author
    })

    const savedReports = db.getReportsByDate('weekly', formatDate(startDate))
    const summaries: Record<string, string> = {}
    for (const r of savedReports) {
      if (r.template && r.content) {
        summaries[r.template] = r.content
      }
    }

    return { commits, summaries }
  })

  ipcMain.handle('report:get-report', async (_, type, date, template) => {
    return getDatabaseService().getReport(type, date, template)
  })

  ipcMain.handle('report:get-reports', async (_, type, date) => {
    return getDatabaseService().getReportsByDate(type, date)
  })

  ipcMain.handle('report:save-report', async (_, report) => {
    return getDatabaseService().saveReport(report)
  })
}
