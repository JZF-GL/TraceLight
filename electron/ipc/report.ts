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

    const reportContent = `# 日报 ${date}

## 今日提交 (${commits.length} 次)

${commits.map(c => `- ${c.message} (${c.hash.substring(0, 7)})`).join('\n')}

---
*自动生成于 ${formatTime(new Date())}*`

    return { content: reportContent, commits }
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

    const repoCommits = commits.reduce((acc, commit) => {
      const repoName = (commit as any).repo_name || 'Unknown'
      if (!acc[repoName]) acc[repoName] = []
      acc[repoName].push(commit)
      return acc
    }, {} as Record<string, typeof commits>)

    let reportContent = `# 周报 ${formatDate(startDate)} ~ ${formatDate(endDate)}\n\n`
    reportContent += `## 本周提交汇总 (${commits.length} 次)\n\n`

    for (const [repo, repoCommitList] of Object.entries(repoCommits)) {
      reportContent += `### ${repo}\n`
      reportContent += repoCommitList.map(c => `- ${c.message}`).join('\n') + '\n\n'
    }

    reportContent += `---\n*自动生成于 ${formatTime(new Date())}*`

    return { content: reportContent, commits }
  })

  ipcMain.handle('report:get-report', async (_, type, date) => {
    return getDatabaseService().getReport(type, date)
  })

  ipcMain.handle('report:save-report', async (_, report) => {
    return getDatabaseService().saveReport(report)
  })
}
