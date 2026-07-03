import { Card, Button, DatePicker, Space, Typography, List, Tag, Spin, message, Input, Radio } from 'antd'
import {
  CopyOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'

const { Paragraph, Text } = Typography
const { TextArea } = Input

interface CommitSummary {
  id: number
  hash: string
  message: string
  repo_name: string
  date: string
}

declare global {
  interface Window {
    api: {
      git: {
        getCommits: (filters: { since?: string; until?: string }) => Promise<CommitSummary[]>
      }
      ai: {
        summarize: (commits: string[], type: 'daily' | 'weekly') => Promise<string>
      }
      report: {
        generateDaily: (date: string) => Promise<{ content: string; commits: CommitSummary[] }>
        saveReport: (report: { type: string; date: string; content: string }) => Promise<unknown>
      }
    }
  }
}

function Daily() {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [, setAiGenerated] = useState(false)
  const [reportContent, setReportContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [template, setTemplate] = useState<'technical' | 'concise' | 'detailed'>('technical')
  const [commits, setCommits] = useState<CommitSummary[]>([])

  useEffect(() => {
    loadCommits()
  }, [selectedDate])

  const loadCommits = async () => {
    try {
      const date = selectedDate.format('YYYY-MM-DD')
      const result = await window.api.report.generateDaily(date)
      setCommits(result.commits || [])
      if (result.content) {
        setReportContent(result.content)
        setAiGenerated(true)
      }
    } catch {
      message.error('生成失败')
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    setLoading(true)
    try {
      const commitMessages = commits.map(c => c.message)
      const content = await window.api.ai.summarize(commitMessages, template === 'technical' ? 'daily' : 'daily')
      setReportContent(content)
      setAiGenerated(true)
      
      // Save report
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

  return (
    <div>
      <Card
        title="日报"
        extra={
          <Space>
            <DatePicker
              value={selectedDate}
              onChange={(date) => date && setSelectedDate(date)}
            />
            <Button onClick={() => setSelectedDate(selectedDate.subtract(1, 'day'))}>
              ← 前一天
            </Button>
            <Button onClick={() => setSelectedDate(selectedDate.add(1, 'day'))}>
              后一天 →
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>今日提交摘要（来自 {new Set(commits.map(c => c.repo_name)).size} 个仓库）</Text>
          <List
            size="small"
            dataSource={commits}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <Tag>{item.repo_name}</Tag>
                  <Text code>{item.hash?.substring(0, 7)}</Text>
                  <Text>{item.message}</Text>
                  <Text type="secondary">{dayjs(item.date).format('HH:mm')}</Text>
                </Space>
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
                onChange={(e) => setReportContent(e.target.value)}
                rows={6}
              />
            ) : (
              <Card size="small" style={{ background: '#f5f5f5' }}>
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
          <Button icon={<FilePdfOutlined />}>
            导出 PDF
          </Button>
        </Space>
      </Card>
    </div>
  )
}

export default Daily
