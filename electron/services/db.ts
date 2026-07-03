import { DatabaseService } from './database.service'

let instance: DatabaseService | null = null

export function getDatabaseService(): DatabaseService {
  if (!instance) {
    instance = new DatabaseService()
  }
  return instance
}
