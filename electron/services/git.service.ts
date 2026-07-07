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
        try {
          await git.fetch({ fs, http, dir: localPath, url: remoteUrl, onAuth: makeOnAuth(auth, remoteUrl), ref: branch })
        } catch (fetchError: any) {
          if (fetchError.message?.includes('401') || fetchError.message?.includes('Unauthorized')) {
            throw new Error('认证失败，请检查账号的 Token 或密码是否正确')
          }
          throw fetchError
        }
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
    const commits: CommitInfo[] = []

    await git.log({
      fs,
      dir: localPath,
      ref: branch || 'HEAD',
      depth: 1000
    }).then(async (log) => {
      for (const item of log) {
        const commitDate = new Date(item.commit.committer.timestamp * 1000)
        const sinceDate = new Date(since)
        if (commitDate >= sinceDate) {
          const parentOid = item.commit.parent.length > 0 ? item.commit.parent[0] : null
          const stats = await this.getCommitStatsIso(localPath, item.oid, parentOid, item.commit.tree)
          commits.push({
            hash: item.oid,
            message: item.commit.message,
            author: item.commit.author.name,
            date: commitDate.toISOString(),
            additions: stats.additions,
            deletions: stats.deletions,
            files_changed: stats.files_changed
          })
        }
      }
    })

    return commits
  }

  private async getCommitStatsIso(
    localPath: string,
    _oid: string,
    parentOid: string | null,
    treeOid: string
  ): Promise<{ additions: number; deletions: number; files_changed: number }> {
    try {
      const collectBlobs = async (
        treeOid: string,
        prefix: string
      ): Promise<Map<string, string>> => {
        const blobs = new Map<string, string>()
        const tree = await git.readTree({ fs, dir: localPath, oid: treeOid })

        for (const entry of tree.tree) {
          const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name
          if (entry.type === 'blob') {
            blobs.set(fullPath, entry.oid)
          } else if (entry.type === 'tree') {
            const subBlobs = await collectBlobs(entry.oid, fullPath)
            for (const [key, val] of subBlobs) {
              blobs.set(key, val)
            }
          }
        }

        return blobs
      }

      const countLines = async (blobOid: string): Promise<number> => {
        const blob = await git.readBlob({ fs, dir: localPath, oid: blobOid })
        const text = new TextDecoder().decode(blob.blob as Uint8Array)
        if (!text) return 0
        return text.split('\n').length
      }

      if (!parentOid) {
        const currentBlobs = await collectBlobs(treeOid, '')
        let additions = 0
        for (const blobOid of currentBlobs.values()) {
          additions += await countLines(blobOid)
        }
        return { additions, deletions: 0, files_changed: currentBlobs.size }
      }

      const parentCommit = await git.readCommit({ fs, dir: localPath, oid: parentOid })
      const parentBlobs = await collectBlobs(parentCommit.commit.tree, '')
      const currentBlobs = await collectBlobs(treeOid, '')

      let additions = 0
      let deletions = 0
      let files_changed = 0

      for (const [path, currentBlobOid] of currentBlobs) {
        const parentBlobOid = parentBlobs.get(path)
        if (!parentBlobOid || parentBlobOid !== currentBlobOid) {
          additions += await countLines(currentBlobOid)
          if (parentBlobOid) {
            deletions += await countLines(parentBlobOid)
          }
          files_changed++
        }
      }

      for (const [path, parentBlobOid] of parentBlobs) {
        if (!currentBlobs.has(path)) {
          deletions += await countLines(parentBlobOid)
          files_changed++
        }
      }

      return { additions, deletions, files_changed }
    } catch (error) {
      console.warn(`Failed to get stats for commit ${_oid}:`, error)
      return { additions: 0, deletions: 0, files_changed: 0 }
    }
  }

  private readCommitsCli(localPath: string, branch: string, since: string): CommitInfo[] {
    const format = '%H|%s|%an|%aI'
    const cmd = `git -C "${localPath}" log ${branch || 'HEAD'} --since="${since}" --format="${format}" --no-merges`
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 30000 })

    if (!output.trim()) return []

    const commits: CommitInfo[] = []
    const lines = output.trim().split('\n')

    for (const line of lines) {
      const [hash, message, author, date] = line.split('|')
      const stats = this.getCommitStatsCli(localPath, hash)
      commits.push({
        hash,
        message,
        author,
        date,
        additions: stats.additions,
        deletions: stats.deletions,
        files_changed: stats.files_changed
      })
    }

    return commits
  }

  private getCommitStatsCli(localPath: string, hash: string): { additions: number; deletions: number; files_changed: number } {
    try {
      const cmd = `git -C "${localPath}" show --numstat --format="" ${hash}`
      const output = execSync(cmd, { encoding: 'utf-8', timeout: 10000 })

      let additions = 0
      let deletions = 0
      let files_changed = 0

      if (output.trim()) {
        const lines = output.trim().split('\n')
        files_changed = lines.length
        for (const line of lines) {
          const parts = line.split('\t')
          if (parts.length >= 2) {
            const add = parseInt(parts[0], 10)
            const del = parseInt(parts[1], 10)
            if (!isNaN(add)) additions += add
            if (!isNaN(del)) deletions += del
          }
        }
      }

      return { additions, deletions, files_changed }
    } catch {
      return { additions: 0, deletions: 0, files_changed: 0 }
    }
  }

  async getStatus(localPath: string) {
    return git.statusMatrix({ fs, dir: localPath })
  }
}
