import { ipcMain } from 'electron'
import { getDatabaseService } from '../services/db'

export function registerReportHandlers(): void {
  ipcMain.handle('report:generate-daily', async (_, date) => {
    const db = getDatabaseService()
    const commits = db.getCommits({
      since: `${date}T00:00:00`,
      until: `${date}T23:59:59`
    })

    const reportContent = `# 日报 ${date}

## 今日提交 (${commits.length} 次)

${commits.map(c => `- ${c.message} (${c.hash.substring(0, 7)})`).join('\n')}

---
*自动生成于 ${new Date().toISOString()}*`

    return { content: reportContent, commits }
  })

  ipcMain.handle('report:generate-weekly', async (_, date) => {
    const db = getDatabaseService()
    const startDate = new Date(date)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)

    const commits = db.getCommits({
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0]
    })

    const repoCommits = commits.reduce((acc, commit) => {
      const repoName = (commit as any).repo_name || 'Unknown'
      if (!acc[repoName]) acc[repoName] = []
      acc[repoName].push(commit)
      return acc
    }, {} as Record<string, typeof commits>)

    let reportContent = `# 周报 ${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]}\n\n`
    reportContent += `## 本周提交汇总 (${commits.length} 次)\n\n`

    for (const [repo, repoCommitList] of Object.entries(repoCommits)) {
      reportContent += `### ${repo}\n`
      reportContent += repoCommitList.map(c => `- ${c.message}`).join('\n') + '\n\n'
    }

    reportContent += `---\n*自动生成于 ${new Date().toISOString()}*`

    return { content: reportContent, commits }
  })

  ipcMain.handle('report:get-report', async (_, type, date) => {
    return getDatabaseService().getReport(type, date)
  })

  ipcMain.handle('report:save-report', async (_, report) => {
    return getDatabaseService().saveReport(report)
  })
}
