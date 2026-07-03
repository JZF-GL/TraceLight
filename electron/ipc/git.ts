import { ipcMain } from 'electron'
import { GitService } from '../services/git.service'
import { DatabaseService } from '../services/database.service'

const gitService = new GitService()
const dbService = new DatabaseService()

export function registerGitHandlers(): void {
  ipcMain.handle('git:add-repo', async (_, repo) => {
    return dbService.addRepo(repo)
  })

  ipcMain.handle('git:remove-repo', async (_, id) => {
    return dbService.removeRepo(id)
  })

  ipcMain.handle('git:get-repos', async () => {
    return dbService.getRepos()
  })

  ipcMain.handle('git:sync-commits', async (_, repoId, since) => {
    const repo = dbService.getRepoById(repoId)
    if (!repo) throw new Error('Repo not found')
    const commits = await gitService.getCommits(repo.localPath, repo.remoteUrl, since)
    dbService.saveCommits(repoId, commits)
    return commits
  })

  ipcMain.handle('git:get-commits', async (_, filters) => {
    return dbService.getCommits(filters)
  })
}
