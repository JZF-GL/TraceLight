import { ipcMain } from 'electron'
import https from 'https'
import http from 'http'

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

function formatTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function registerAIHandlers(): void {
  ipcMain.handle('ai:configure', async (_, config: AIConfig) => {
    _aiConfig = config
    return { success: true }
  })

  ipcMain.handle('ai:get-config', async () => {
    return _aiConfig
  })

  ipcMain.handle('ai:summarize', async (_, commits: string[], type: 'daily' | 'weekly') => {
    const summarized = commits
      .filter(msg => msg && msg.trim())
      .map(msg => {
        const cleaned = msg
          .replace(/^(feat|fix|refactor|docs|style|test|chore|perf|ci|build)(\(.+\))?:\s*/i, '')
          .trim()
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      })

    if (_aiConfig.provider === 'local' || !_aiConfig.apiKey) {
      if (type === 'daily') {
        return generateDailySummary(summarized)
      } else {
        return generateWeeklySummary(summarized)
      }
    }

    try {
      const prompt = type === 'daily'
        ? `请根据以下Git提交记录生成一份简洁的中文日报总结，列出主要工作内容：\n\n${summarized.map((c, i) => `${i + 1}. ${c}`).join('\n')}`
        : `请根据以下Git提交记录生成一份详细的中文周报总结，按功能开发、Bug修复、代码优化等分类：\n\n${summarized.map((c, i) => `${i + 1}. ${c}`).join('\n')}`

      const result = await callAIAPI(prompt)
      return result + `\n\n---\n*自动生成于 ${formatTime(new Date())}*`
    } catch (error) {
      console.error('AI API call failed:', error)
      if (type === 'daily') {
        return generateDailySummary(summarized)
      } else {
        return generateWeeklySummary(summarized)
      }
    }
  })
}

async function callAIAPI(prompt: string): Promise<string> {
  const baseUrl = _aiConfig.baseUrl || 'https://api.openai.com'
  const url = new URL(`${baseUrl}/v1/chat/completions`)

  const postData = JSON.stringify({
    model: _aiConfig.model || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: '你是一个专业的技术文档撰写助手，帮助开发者生成工作日报和周报。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  })

  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http
    const req = protocol.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${_aiConfig.apiKey}`
      }
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const response = JSON.parse(data)
          if (response.choices && response.choices[0]) {
            resolve(response.choices[0].message.content)
          } else {
            reject(new Error('Invalid API response'))
          }
        } catch (e) {
          reject(e)
        }
      })
    })

    req.on('error', reject)
    req.write(postData)
    req.end()
  })
}

function generateDailySummary(commits: string[]): string {
  if (commits.length === 0) {
    return '今日暂无提交记录。'
  }

  const summary = `今日主要工作：

${commits.map((c, i) => `${i + 1}. ${c}`).join('\n')}

---
*自动生成于 ${formatTime(new Date())}*`

  return summary
}

function generateWeeklySummary(commits: string[]): string {
  if (commits.length === 0) {
    return '本周暂无提交记录。'
  }

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

  const categorized = [...features, ...fixes, ...refactors]
  const others = commits.filter(c => !categorized.includes(c))
  if (others.length > 0) {
    summary += `四、其他\n${others.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n`
  }

  summary += `---
*自动生成于 ${formatTime(new Date())}*`

  return summary
}
