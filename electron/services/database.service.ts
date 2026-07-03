import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'

interface Repo {
  id: number
  name: string
  remote_url: string
  local_path: string
  branch: string
  created_at: string
}

interface Account {
  id: number
  username: string
  token?: string
  ssh_key?: string
  type: string
}

interface Commit {
  id: number
  repo_id: number
  hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  files_changed: number
  repo_name?: string
}

interface Report {
  id: number
  type: string
  date: string
  content: string
  ai_summary?: string
  created_at: string
}

export class DatabaseService {
  private db: Database.Database

  constructor() {
    const dbPath = join(app.getPath('userData'), 'tracelight.db')
    this.db = new Database(dbPath)
    this.initTables()
  }

  private initTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS repos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        remote_url TEXT NOT NULL,
        local_path TEXT NOT NULL,
        branch TEXT DEFAULT 'main',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        token TEXT,
        ssh_key TEXT,
        type TEXT DEFAULT 'github'
      );

      CREATE TABLE IF NOT EXISTS commits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_id INTEGER REFERENCES repos(id),
        hash TEXT NOT NULL UNIQUE,
        message TEXT NOT NULL,
        author TEXT NOT NULL,
        date DATETIME NOT NULL,
        additions INTEGER DEFAULT 0,
        deletions INTEGER DEFAULT 0,
        files_changed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        date DATE NOT NULL,
        content TEXT NOT NULL,
        ai_summary TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)
  }

  addRepo(repo: Omit<Repo, 'id' | 'created_at'>): Repo {
    const stmt = this.db.prepare(
      'INSERT INTO repos (name, remote_url, local_path, branch) VALUES (?, ?, ?, ?)'
    )
    const result = stmt.run(repo.name, repo.remote_url, repo.local_path, repo.branch)
    return { id: result.lastInsertRowid as number, ...repo, created_at: new Date().toISOString() }
  }

  removeRepo(id: number): void {
    this.db.prepare('DELETE FROM repos WHERE id = ?').run(id)
  }

  getRepos(): Repo[] {
    return this.db.prepare('SELECT * FROM repos').all() as Repo[]
  }

  getRepoById(id: number): Repo | undefined {
    return this.db.prepare('SELECT * FROM repos WHERE id = ?').get(id) as Repo | undefined
  }

  saveCommits(repoId: number, commits: Omit<Commit, 'id' | 'repo_id'>[]): void {
    const stmt = this.db.prepare(
      'INSERT OR IGNORE INTO commits (repo_id, hash, message, author, date, additions, deletions, files_changed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    const insertMany = this.db.transaction((items: Omit<Commit, 'id' | 'repo_id'>[]) => {
      for (const item of items) {
        stmt.run(repoId, item.hash, item.message, item.author, item.date, item.additions, item.deletions, item.files_changed)
      }
    })
    insertMany(commits)
  }

  getCommits(filters: { repoId?: number; since?: string; until?: string }): (Commit & { repo_name: string })[] {
    let query = 'SELECT c.*, r.name as repo_name FROM commits c JOIN repos r ON c.repo_id = r.id WHERE 1=1'
    const params: (string | number)[] = []

    if (filters.repoId) {
      query += ' AND c.repo_id = ?'
      params.push(filters.repoId)
    }
    if (filters.since) {
      query += ' AND c.date >= ?'
      params.push(filters.since)
    }
    if (filters.until) {
      query += ' AND c.date <= ?'
      params.push(filters.until)
    }

    query += ' ORDER BY c.date DESC'
    return this.db.prepare(query).all(...params) as (Commit & { repo_name: string })[]
  }

  addAccount(account: Omit<Account, 'id'>): Account {
    const stmt = this.db.prepare(
      'INSERT INTO accounts (username, token, ssh_key, type) VALUES (?, ?, ?, ?)'
    )
    const result = stmt.run(account.username, account.token, account.ssh_key, account.type)
    return { id: result.lastInsertRowid as number, ...account }
  }

  removeAccount(id: number): void {
    this.db.prepare('DELETE FROM accounts WHERE id = ?').run(id)
  }

  getAccounts(): Account[] {
    return this.db.prepare('SELECT * FROM accounts').all() as Account[]
  }

  saveReport(report: Omit<Report, 'id' | 'created_at'>): Report {
    const stmt = this.db.prepare(
      'INSERT INTO reports (type, date, content, ai_summary) VALUES (?, ?, ?, ?)'
    )
    const result = stmt.run(report.type, report.date, report.content, report.ai_summary)
    return { id: result.lastInsertRowid as number, ...report, created_at: new Date().toISOString() }
  }

  getReport(type: string, date: string): Report | undefined {
    return this.db.prepare('SELECT * FROM reports WHERE type = ? AND date = ?').get(type, date) as Report | undefined
  }

  getStats(): { totalRepos: number; totalCommits: number; todayCommits: number } {
    const totalRepos = (this.db.prepare('SELECT COUNT(*) as count FROM repos').get() as { count: number }).count
    const totalCommits = (this.db.prepare('SELECT COUNT(*) as count FROM commits').get() as { count: number }).count
    const today = new Date().toISOString().split('T')[0]
    const todayCommits = (this.db.prepare('SELECT COUNT(*) as count FROM commits WHERE date LIKE ?').get(`${today}%`) as { count: number }).count
    return { totalRepos, totalCommits, todayCommits }
  }
}
