import { ipcMain } from 'electron'
import { GitService } from '../services/git.service'
import { getDatabaseService } from '../services/db'

const gitService = new GitService()

export function registerGitHandlers(): void {
  ipcMain.handle('git:add-repo', async (_, repo) => {
    return getDatabaseService().addRepo(repo)
  })

  ipcMain.handle('git:remove-repo', async (_, id) => {
    return getDatabaseService().removeRepo(id)
  })

  ipcMain.handle('git:get-repos', async () => {
    return getDatabaseService().getRepos()
  })

  ipcMain.handle('git:sync-commits', async (_, repoId, since) => {
    const db = getDatabaseService()
    const repo = db.getRepoById(repoId)
    if (!repo) throw new Error('Repo not found')
    const commits = await gitService.getCommits(repo.local_path, repo.remote_url, since)
    db.saveCommits(repoId, commits)
    return commits
  })

  ipcMain.handle('git:get-commits', async (_, filters) => {
    return getDatabaseService().getCommits(filters)
  })
}
