import { Card, Button, DatePicker, Space, Typography, List, Tag, Spin, message, Input, Radio, Select, Tooltip } from 'antd'
import {
  CopyOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../../stores/app'

const { Paragraph, Text } = Typography
const { TextArea } = Input

const messageLineStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  wordBreak: 'break-all'
}

interface CommitSummary {
  id: number
  hash: string
  message: string
  repo_name: string
  date: string
}

interface Account {
  id: number
  username: string
  type: string
}

function Daily() {
  const isDarkMode = useAppStore((s) => s.theme === 'dark')
  const { dailyPage, setDailyPage } = useAppStore()
  const { selectedDate, selectedAuthor, reportContent, commits } = dailyPage
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [template, setTemplate] = useState<'technical' | 'concise' | 'detailed'>('technical')
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    loadCommits()
  }, [selectedDate, selectedAuthor])

  const loadAccounts = async () => {
    try {
      const data = await window.api.account.getAccounts()
      setAccounts(data || [])
      if (!selectedAuthor && data && data.length > 0) {
        setDailyPage({ selectedAuthor: data[0].username })
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }

  const loadCommits = async () => {
    setLoading(true)
    try {
      const date = selectedDate.format('YYYY-MM-DD')
      const result = await window.api.report.generateDaily(date, selectedAuthor)
      setDailyPage({
        commits: result?.commits || [],
        reportContent: result?.content || reportContent
      })
    } catch (error) {
      console.error('Failed to load commits:', error)
      setDailyPage({ commits: [] })
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      const commitMessages = commits.map((c: any) => c.message)
      const content = await window.api.ai.summarize(commitMessages, template === 'technical' ? 'daily' : 'daily')
      setDailyPage({ reportContent: content })

      const date = selectedDate.format('YYYY-MM-DD')
      await window.api.report.saveReport({
        type: 'daily',
        date,
        content
      })

      message.success('日报生成成功')
    } catch {
      message.error('生成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportContent)
      message.success('已复制到剪贴板')
    } catch {
      message.error('复制失败')
    }
  }

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      message.error('无法打开打印窗口')
      return
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>日报 ${selectedDate.format('YYYY-MM-DD')}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; line-height: 1.6; }
          h1 { color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 20px; }
          pre { background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-family: inherit; }
          .footer { margin-top: 40px; color: #999; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <pre>${reportContent}</pre>
        <div class="footer">由 TraceLight 生成</div>
      </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <div>
      <Card
        title="日报"
        extra={
          <Space>
            <Select
              placeholder="选择账号"
              style={{ width: 160 }}
              allowClear
              value={selectedAuthor}
              onChange={(value) => setDailyPage({ selectedAuthor: value })}
            >
              {accounts.map(account => (
                <Select.Option key={account.id} value={account.username}>
                  {account.username}
                </Select.Option>
              ))}
            </Select>
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setDailyPage({ selectedDate: date })}
            />
            <Button onClick={() => setDailyPage({ selectedDate: selectedDate.subtract(1, 'day') })}>
              ← 前一天
            </Button>
            <Button onClick={() => setDailyPage({ selectedDate: selectedDate.add(1, 'day') })}>
              后一天 →
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>今日提交摘要（来自 {new Set(commits.map((c: any) => c.repo_name)).size} 个仓库）</Text>
          <List
            size="small"
            dataSource={commits}
            renderItem={(item) => (
              <List.Item style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}>
                  <Tag style={{ flexShrink: 0 }}>{item.repo_name}</Tag>
                  <Text code style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{item.hash?.substring(0, 7)}</Text>
                  <Tooltip title={item.message} placement="topLeft">
                    <div style={{ ...messageLineStyle, flex: 1, minWidth: 0 }}>{item.message}</div>
                  </Tooltip>
                  <Text type="secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{dayjs(item.date).format('HH:mm')}</Text>
                </div>
              </List.Item>
            )}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 8 }}>
            <Text strong>AI 生成总结</Text>
            <Radio.Group
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              size="small"
            >
              <Radio.Button value="technical">技术向</Radio.Button>
              <Radio.Button value="concise">简洁向</Radio.Button>
              <Radio.Button value="detailed">详细向</Radio.Button>
            </Radio.Group>
          </Space>

          <Spin spinning={loading}>
            {isEditing ? (
              <TextArea
                value={reportContent}
                onChange={(e) => setDailyPage({ reportContent: e.target.value })}
                rows={6}
              />
            ) : (
              <Card size="small" style={{ background: isDarkMode ? '#2a2a2a' : '#f5f5f5' }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {reportContent || '点击"重新生成"按钮生成日报'}
                </Paragraph>
              </Card>
            )}
          </Spin>
        </div>

        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={generateReport}
            loading={loading}
          >
            重新生成
          </Button>
          <Button
            icon={isEditing ? <CheckOutlined /> : <EditOutlined />}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? '完成编辑' : '手动编辑'}
          </Button>
          <Button icon={<CopyOutlined />} onClick={handleCopy}>
            复制
          </Button>
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>
            导出 PDF
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default Daily
