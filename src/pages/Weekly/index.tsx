import { Card, Button, DatePicker, Space, Typography, List, Tag, Spin, message, Input, Radio, Row, Col, Statistic, Select, Tooltip } from 'antd'
import {
  CopyOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  StopOutlined
} from '@ant-design/icons'
import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../../stores/app'

const { Paragraph, Text } = Typography
const { TextArea } = Input
const { WeekPicker } = DatePicker

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
  additions: number
  deletions: number
}

interface Account {
  id: number
  username: string
  type: string
}

function Weekly() {
  const isDarkMode = useAppStore((s) => s.theme === 'dark')
  const { weeklyPage, setWeeklyPage } = useAppStore()
  const { selectedWeek, selectedAuthor, template, summaries, currentContent, commits, loading, generating } = weeklyPage
  const [isEditing, setIsEditing] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    setWeeklyPage({ generating: false })
    loadAccounts()
  }, [])

  useEffect(() => {
    return () => {
      cleanupRef.current?.()
      cleanupRef.current = null
    }
  }, [])

  useEffect(() => {
    loadCommits()
  }, [selectedWeek, selectedAuthor])

  useEffect(() => {
    if (summaries && summaries[template] !== undefined) {
      setWeeklyPage({ currentContent: summaries[template] })
    }
  }, [template])

  const loadAccounts = async () => {
    try {
      const data = await window.api.account.getAccounts()
      setAccounts(data || [])
      if (!selectedAuthor && data && data.length > 0) {
        setWeeklyPage({ selectedAuthor: data[0].username })
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }

  const getWeekStart = (date: dayjs.Dayjs) => date.startOf('week')

  const loadCommits = async () => {
    if (generating) return
    setWeeklyPage({ loading: true })
    try {
      const date = getWeekStart(selectedWeek).format('YYYY-MM-DD')
      const result = await window.api.report.generateWeekly(date, selectedAuthor)
      const newSummaries = result?.summaries || {}
      setWeeklyPage({
        commits: result?.commits || [],
        summaries: newSummaries,
        currentContent: newSummaries[template] || ''
      })
    } catch (error) {
      console.error('Failed to load commits:', error)
    } finally {
      setWeeklyPage({ loading: false })
    }
  }

  const totalAdditions = commits.reduce((sum: number, c: any) => sum + (c.additions || 0), 0)
  const totalDeletions = commits.reduce((sum: number, c: any) => sum + (c.deletions || 0), 0)

  const generateReport = async () => {
    if (commits.length === 0) {
      message.warning('本周没有提交记录，无法生成周报')
      return
    }

    setWeeklyPage({ generating: true, loading: true })
    try {
      const commitMessages = commits.map((c: any) => c.message)
      const date = getWeekStart(selectedWeek).format('YYYY-MM-DD')

      cleanupRef.current?.()
      setWeeklyPage({ currentContent: '' })
      let fullContent = ''
      cleanupRef.current = window.api.ai.summarizeStream(
        commitMessages,
        'weekly',
        template,
        date,
        selectedAuthor || '',
        (chunk) => {
          fullContent += chunk
          setWeeklyPage({ currentContent: fullContent })
        },
        async () => {
          const newSummaries = { ...summaries, [template]: fullContent }
          setWeeklyPage({ summaries: newSummaries, currentContent: fullContent, generating: false, loading: false })
          message.success('周报生成成功')
        }
      )
    } catch {
      message.error('生成失败')
      setWeeklyPage({ generating: false, loading: false })
    }
  }

  const abortGenerate = () => {
    window.api.ai.abortStream()
    cleanupRef.current?.()
    cleanupRef.current = null
    setWeeklyPage({ generating: false, loading: false })
    message.info('已中止生成')
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentContent)
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
        <title>周报 ${selectedWeek.format('YYYY-[W]ww')}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; line-height: 1.6; }
          h1 { color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
          h2 { color: #333; margin-top: 20px; }
          pre { background: #f5f5f5; padding: 16px; border-radius: 8px; white-space: pre-wrap; font-family: inherit; }
          .footer { margin-top: 40px; color: #999; font-size: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <pre>${currentContent}</pre>
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
        title="周报"
        extra={
          <Space>
            <Select
              placeholder="选择账号"
              style={{ width: 160 }}
              allowClear
              value={selectedAuthor}
              onChange={(value) => setWeeklyPage({ selectedAuthor: value })}
              disabled={generating}
            >
              {accounts.map(account => (
                <Select.Option key={account.id} value={account.username}>
                  {account.username}
                </Select.Option>
              ))}
            </Select>
            <WeekPicker
              value={selectedWeek}
              onChange={(date) => date && setWeeklyPage({ selectedWeek: date })}
              disabled={generating}
            />
          </Space>
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="本周提交"
              value={commits.length}
              suffix="次"
              valueStyle={{ whiteSpace: 'nowrap' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="新增代码"
              value={totalAdditions}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600', whiteSpace: 'nowrap' }}
              suffix="行"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="删除代码"
              value={totalDeletions}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322', whiteSpace: 'nowrap' }}
              suffix="行"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="涉及仓库"
              value={new Set(commits.map((c: any) => c.repo_name)).size}
              suffix="个"
              valueStyle={{ whiteSpace: 'nowrap' }}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Text strong>本周提交记录</Text>
          <List
            size="small"
            dataSource={commits}
            renderItem={(item: any) => (
              <List.Item style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}>
                  <Tag style={{ flexShrink: 0 }}>{item.repo_name}</Tag>
                  <Text code style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{item.hash?.substring(0, 7)}</Text>
                  <Tooltip title={item.message} placement="topLeft">
                    <div style={{ ...messageLineStyle, flex: 1, minWidth: 0 }}>{item.message}</div>
                  </Tooltip>
                  <Text type="secondary" style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>{dayjs(item.date).format('MM-DD')}</Text>
                  {item.additions !== undefined && <Tag color="green" style={{ flexShrink: 0 }}>+{item.additions}</Tag>}
                  {item.deletions !== undefined && <Tag color="red" style={{ flexShrink: 0 }}>-{item.deletions}</Tag>}
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
              onChange={(e) => setWeeklyPage({ template: e.target.value })}
              size="small"
              disabled={loading}
            >
              <Radio.Button value="technical">技术向</Radio.Button>
              <Radio.Button value="concise">简洁向</Radio.Button>
              <Radio.Button value="detailed">详细向</Radio.Button>
            </Radio.Group>
          </Space>

          <Spin spinning={generating}>
            {isEditing ? (
              <TextArea
                value={currentContent}
                onChange={(e) => setWeeklyPage({ currentContent: e.target.value })}
                rows={12}
              />
            ) : (
              <Card size="small" style={{ background: isDarkMode ? '#2a2a2a' : '#f5f5f5' }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {currentContent || '点击"重新生成"按钮生成周报'}
                </Paragraph>
              </Card>
            )}
          </Spin>
        </div>

        <Space>
          {generating ? (
            <Button
              danger
              icon={<StopOutlined />}
              onClick={abortGenerate}
            >
              中止生成
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={generateReport}
              loading={loading}
            >
              重新生成
            </Button>
          )}
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

export default Weekly
