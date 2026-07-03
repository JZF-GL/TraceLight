import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import fs from 'fs'

interface CommitInfo {
  hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  files_changed: number
}

export class GitService {
  async getCommits(localPath: string, remoteUrl: string, since: string): Promise<CommitInfo[]> {
    try {
      // Check if repo exists, if not clone it
      if (!fs.existsSync(localPath)) {
        await git.clone({
          fs,
          http,
          dir: localPath,
          url: remoteUrl,
          onProgress: (progress) => {
            console.log(`Cloning: ${progress.loaded}/${progress.total}`)
          }
        })
      }

      // Get commits
      const sinceDate = new Date(since)
      const commits: CommitInfo[] = []

      await git.log({
        fs,
        dir: localPath,
        ref: 'HEAD',
        depth: 1000
      }).then(log => {
        for (const commit of log) {
          const commitDate = new Date(commit.commit.committer.timestamp * 1000)
          if (commitDate >= sinceDate) {
            commits.push({
              hash: commit.oid,
              message: commit.commit.message,
              author: commit.commit.author.name,
              date: commitDate.toISOString(),
              additions: 0,
              deletions: 0,
              files_changed: 0
            })
          }
        }
      })

      return commits
    } catch (error) {
      console.error('Error getting commits:', error)
      throw error
    }
  }

  async getStatus(localPath: string) {
    return git.statusMatrix({ fs, dir: localPath })
  }
}
