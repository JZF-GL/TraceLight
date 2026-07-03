import { ipcMain } from 'electron'
import { getDatabaseService } from '../services/db'

export function registerAccountHandlers(): void {
  ipcMain.handle('account:add-account', async (_, account) => {
    return getDatabaseService().addAccount(account)
  })

  ipcMain.handle('account:remove-account', async (_, id) => {
    return getDatabaseService().removeAccount(id)
  })

  ipcMain.handle('account:get-accounts', async () => {
    return getDatabaseService().getAccounts()
  })
}
