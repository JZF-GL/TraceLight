import { ipcMain, BrowserWindow, app } from 'electron'
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'

interface AIConfig {
  provider: 'local' | 'openai' | 'ollama'
  apiKey?: string
  model?: string
  baseUrl?: string
}

let _configPath = ''
let _aiConfig: AIConfig = { provider: 'local', model: 'gpt-3.5-turbo' }

function loadAIConfig(): AIConfig {
  try {
    if (fs.existsSync(_configPath)) {
      return JSON.parse(fs.readFileSync(_configPath, 'utf-8'))
    }
  } catch { /* ignore */ }
  return { provider: 'local', model: 'gpt-3.5-turbo' }
}

function saveAIConfig(config: AIConfig): void {
  fs.writeFileSync(_configPath, JSON.stringify(config, null, 2), 'utf-8')
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
  _configPath = path.join(app.getPath('userData'), 'ai-config.json')
  _aiConfig = loadAIConfig()

  ipcMain.handle('ai:configure', async (_, config: AIConfig) => {
    _aiConfig = config
    saveAIConfig(config)
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

  ipcMain.on('ai:summarize-stream', async (event, commits: string[], type: 'daily' | 'weekly', template: 'technical' | 'concise' | 'detailed') => {
    const summarized = commits
      .filter(msg => msg && msg.trim())
      .map(msg => {
        const cleaned = msg
          .replace(/^(feat|fix|refactor|docs|style|test|chore|perf|ci|build)(\(.+\))?:\s*/i, '')
          .trim()
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      })

    const win = BrowserWindow.fromWebContents(event.sender)
    const send = (channel: string, ...args: unknown[]) => {
      win?.webContents.send(channel, ...args)
    }

    const fallback = () => {
      const content = type === 'daily'
        ? generateDailySummary(summarized)
        : generateWeeklySummary(summarized)
      send('ai:stream-chunk', content)
      send('ai:stream-end')
    }

    if (_aiConfig.provider === 'local' || !_aiConfig.apiKey) {
      fallback()
      return
    }

    const commitList = summarized.map((c, i) => `${i + 1}. ${c}`).join('\n')
    const prompts: Record<string, string> = {
      technical_daily: `请根据以下Git提交记录，用中文整理出技术向的工作总结，只列出提交信息即可，不需要标题、时间等多余内容：\n\n${commitList}`,
      technical_weekly: `请根据以下Git提交记录，用中文整理出技术向的工作总结，只列出提交信息即可，不需要标题、时间等多余内容：\n\n${commitList}`,
      concise_daily: `请用简洁的中文生成一份日报总结，用要点形式列出今日主要工作内容，不要多余的描述：\n\n${commitList}`,
      concise_weekly: `请用简洁的中文生成一份周报总结，用要点形式按功能开发、Bug修复、代码优化等分类列出本周工作，不要多余的描述：\n\n${commitList}`,
      detailed_daily: `请用详细的中文生成一份日报总结，对每项工作进行适当展开描述，包括工作目的和完成情况：\n\n${commitList}`,
      detailed_weekly: `请用详细的中文生成一份周报总结，按功能开发、Bug修复、代码优化等分类，对每项工作进行展开描述，包括工作背景、完成情况和成果：\n\n${commitList}`
    }

    const prompt = prompts[`${template}_${type}`]
    const addFooter = template !== 'technical'

    try {
      await callAIAPIStreaming(prompt, send)
      if (addFooter) {
        send('ai:stream-chunk', `\n\n---\n*自动生成于 ${formatTime(new Date())}*`)
      }
      send('ai:stream-end')
    } catch (error) {
      console.error('AI streaming failed:', error)
      fallback()
    }
  })
}

async function callAIAPI(prompt: string): Promise<string> {
  const baseUrl = _aiConfig.baseUrl || 'https://api.openai.com'
  const url = new URL(`${baseUrl}/chat/completions`)

  const params = {
    model: _aiConfig.model || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: '你是一个专业的技术文档撰写助手，帮助开发者生成工作日报和周报。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  }
  const postData = JSON.stringify(params)

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

function callAIAPIStreaming(prompt: string, send: (channel: string, ...args: unknown[]) => void): Promise<void> {
  const baseUrl = _aiConfig.baseUrl || 'https://api.openai.com'
  const url = new URL(`${baseUrl}/chat/completions`)

  const params = {
    model: _aiConfig.model || 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: '你是一个专业的技术文档撰写助手，帮助开发者生成工作日报和周报。' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000,
    stream: true
  }
  const postData = JSON.stringify(params)

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
      let buffer = ''

      res.on('data', (chunk: Buffer) => {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content
            if (delta) {
              send('ai:stream-chunk', delta)
            }
          } catch {
            // skip malformed lines
          }
        }
      })

      res.on('end', () => {
        if (buffer.trim()) {
          const trimmed = buffer.trim()
          if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
            try {
              const parsed = JSON.parse(trimmed.slice(6))
              const delta = parsed.choices?.[0]?.delta?.content
              if (delta) {
                send('ai:stream-chunk', delta)
              }
            } catch { /* skip */ }
          }
        }
        resolve()
      })

      res.on('error', reject)
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
