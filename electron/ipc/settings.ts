import { ipcMain, app, dialog } from 'electron'
import { getDatabaseService } from '../services/db'
import fs from 'fs'
import path from 'path'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:clear-all-data', async () => {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: '确认清除',
      message: '确定要清除所有应用数据吗？',
      detail: '此操作将删除所有仓库、账号、提交记录和报告数据，且无法恢复。',
      buttons: ['取消', '确认清除'],
      defaultId: 0,
      cancelId: 0
    })

    if (result.response === 0) {
      return { cancelled: true }
    }

    try {
      const db = getDatabaseService()
      db.clearAllData()

      localStorage.removeItem('settings')
      localStorage.removeItem('theme')

      return { success: true }
    } catch (error) {
      console.error('Failed to clear data:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('settings:clear-cache', async () => {
    try {
      const cachePath = path.join(app.getPath('userData'), 'cache')
      if (fs.existsSync(cachePath)) {
        fs.rmSync(cachePath, { recursive: true, force: true })
      }

      const session = require('electron').session
      if (session && session.defaultSession) {
        await session.defaultSession.clearCache()
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to clear cache:', error)
      return { success: false, error: String(error) }
    }
  })

  ipcMain.handle('settings:get-storage-info', async () => {
    try {
      const dbPath = path.join(app.getPath('userData'), 'tracelight.db')
      let dbSize = 0
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath)
        dbSize = stats.size
      }

      const cachePath = path.join(app.getPath('userData'), 'cache')
      let cacheSize = 0
      if (fs.existsSync(cachePath)) {
        const walkDir = (dir: string) => {
          const files = fs.readdirSync(dir)
          for (const file of files) {
            const filePath = path.join(dir, file)
            const stat = fs.statSync(filePath)
            if (stat.isDirectory()) {
              walkDir(filePath)
            } else {
              cacheSize += stat.size
            }
          }
        }
        walkDir(cachePath)
      }

      return {
        database: dbSize,
        cache: cacheSize,
        localStorage: 0,
        total: dbSize + cacheSize
      }
    } catch (error) {
      console.error('Failed to get storage info:', error)
      return { database: 0, cache: 0, localStorage: 0, total: 0 }
    }
  })
}
