import { ipcMain } from 'electron'

interface AIConfig {
  provider: 'local' | 'openai' | 'ollama'
  apiKey?: string
  model?: string
  baseUrl?: string
}

let _aiConfig: AIConfig = {
  provider: 'local',
  model: 'gpt-3.5-turbo'
}

export function registerAIHandlers(): void {
  ipcMain.handle('ai:configure', async (_, config: AIConfig) => {
    _aiConfig = config
    return { success: true }
  })

  ipcMain.handle('ai:summarize', async (_, commits: string[], type: 'daily' | 'weekly') => {
    // For now, implement a simple local summarization
    // In production, this would call OpenAI/Ollama API
    const summarized = commits
      .filter(msg => msg && msg.trim())
      .map(msg => {
        // Clean up conventional commit prefixes
        const cleaned = msg
          .replace(/^(feat|fix|refactor|docs|style|test|chore|perf|ci|build)(\(.+\))?:\s*/i, '')
          .trim()
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      })

    if (type === 'daily') {
      return generateDailySummary(summarized)
    } else {
      return generateWeeklySummary(summarized)
    }
  })
}

function generateDailySummary(commits: string[]): string {
  if (commits.length === 0) {
    return '今日暂无提交记录。'
  }

  const summary = `今日主要工作：

${commits.map((c, i) => `${i + 1}. ${c}`).join('\n')}

---
*自动生成于 ${new Date().toLocaleString('zh-CN')}*`

  return summary
}

function generateWeeklySummary(commits: string[]): string {
  if (commits.length === 0) {
    return '本周暂无提交记录。'
  }

  // Categorize commits
  const features = commits.filter(c => c.toLowerCase().includes('feat') || c.toLowerCase().includes('新'))
  const fixes = commits.filter(c => c.toLowerCase().includes('fix') || c.toLowerCase().includes('修复'))
  const refactors = commits.filter(c => c.toLowerCase().includes('refactor') || c.toLowerCase().includes('重构'))

  let summary = `本周工作总结：

`

  if (features.length > 0) {
    summary += `一、功能开发\n${features.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`
  }
  if (fixes.length > 0) {
    summary += `二、Bug 修复\n${fixes.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`
  }
  if (refactors.length > 0) {
    summary += `三、代码优化\n${refactors.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`
  }

  // Add uncategorized
  const categorized = [...features, ...fixes, ...refactors]
  const others = commits.filter(c => !categorized.includes(c))
  if (others.length > 0) {
    summary += `四、其他\n${others.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`
  }

  summary += `---
*自动生成于 ${new Date().toLocaleString('zh-CN')}*`

  return summary
}
