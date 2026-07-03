import git from 'isomorphic-git'
import http from 'isomorphic-git/http/node'
import fs from 'fs'
import { execSync } from 'child_process'

interface CommitInfo {
  hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  files_changed: number
}

interface AuthOptions {
  username?: string
  password?: string
  token?: string
}

function detectPlatform(url: string): 'github' | 'gitlab' | 'gitee' | 'other' {
  if (url.includes('github.com')) return 'github'
  if (url.includes('gitlab')) return 'gitlab'
  if (url.includes('gitee.com')) return 'gitee'
  return 'other'
}

function makeOnAuth(auth?: AuthOptions, url?: string) {
  if (!auth) return undefined
  const platform = url ? detectPlatform(url) : 'other'
  return () => {
    if (auth.token) {
      if (platform === 'github') {
        return { username: 'x-access-token', password: auth.token }
      }
      if (platform === 'gitlab') {
        return { username: 'oauth2', password: auth.token }
      }
      return { username: auth.token, password: 'x-oauth-basic' }
    }
    return { username: auth.username || '', password: auth.password || '' }
  }
}

export class GitService {
  async getRemoteBranches(localPath: string): Promise<string[]> {
    if (!fs.existsSync(localPath) || !fs.existsSync(`${localPath}/.git`)) {
      throw new Error('本地仓库不存在')
    }
    const branches = await git.listBranches({ fs, dir: localPath })
    return branches.filter(b => b !== 'HEAD')
  }

  async getLocalCommits(localPath: string, branch: string, since: string): Promise<CommitInfo[]> {
    if (!fs.existsSync(localPath) || !fs.existsSync(`${localPath}/.git`)) {
      throw new Error('本地仓库不存在，请先同步远程仓库')
    }
    return this.readCommits(localPath, branch, since)
  }

  async getRemoteCommits(localPath: string, remoteUrl: string, branch: string, since: string, auth?: AuthOptions): Promise<CommitInfo[]> {
    if (!fs.existsSync(localPath) || !fs.existsSync(`${localPath}/.git`)) {
      if (!auth) throw new Error('本地仓库不存在，请配置账号认证后重试')
      await git.clone({
        fs,
        http,
        dir: localPath,
        url: remoteUrl,
        onAuth: makeOnAuth(auth, remoteUrl),
        onProgress: (p) => console.log(`Cloning: ${p.loaded}/${p.total}`)
      })
    } else {
      if (auth) {
        await git.fetch({ fs, http, dir: localPath, url: remoteUrl, onAuth: makeOnAuth(auth, remoteUrl), ref: branch })
      }
    }
    return this.readCommits(localPath, branch, since)
  }

  private async readCommits(localPath: string, branch: string, since: string): Promise<CommitInfo[]> {
    try {
      return await this.readCommitsIso(localPath, branch, since)
    } catch (error) {
      console.warn('isomorphic-git failed, falling back to system git:', error)
      return this.readCommitsCli(localPath, branch, since)
    }
  }

  private async readCommitsIso(localPath: string, branch: string, since: string): Promise<CommitInfo[]> {
    const sinceDate = new Date(since)
    const commits: CommitInfo[] = []

    await git.log({
      fs,
      dir: localPath,
      ref: branch || 'HEAD',
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
  }

  private readCommitsCli(localPath: string, branch: string, since: string): CommitInfo[] {
    const sinceDate = new Date(since)
    const format = '%H|%s|%an|%aI'
    const cmd = `git -C "${localPath}" log ${branch || 'HEAD'} --since="${since}" --format="${format}" --no-merges`
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 })

    if (!output.trim()) return []

    return output.trim().split('\n').map(line => {
      const [hash, message, author, date] = line.split('|')
      return {
        hash,
        message,
        author,
        date,
        additions: 0,
        deletions: 0,
        files_changed: 0
      }
    })
  }

  async getStatus(localPath: string) {
    return git.statusMatrix({ fs, dir: localPath })
  }
}
