import { Card, Button, DatePicker, Space, Typography, List, Tag, Spin, message, Input, Radio } from 'antd'
import {
  CopyOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined
} from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input

interface CommitSummary {
  hash: string
  message: string
  repo_name: string
  date: string
}

function Daily() {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [reportContent, setReportContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [template, setTemplate] = useState<'technical' | 'concise' | 'detailed'>('technical')

  const [commits] = useState<CommitSummary[]>([
    { hash: 'abc123', message: 'feat: 新增用户登录模块', repo_name: 'TraceLight', date: '14:32' },
    { hash: 'def456', message: 'fix: 修复分页查询Bug', repo_name: 'Backend', date: '11:20' },
    { hash: 'ghi789', message: 'refactor: 重构缓存逻辑', repo_name: 'TraceLight', date: '09:45' }
  ])

  const generateReport = async () => {
    setLoading(true)
    try {
      // IPC call: api.ai.summarize(commits, 'daily')
      // Simulate AI generation
      setTimeout(() => {
        setReportContent(`今日主要工作：

1. 完成用户登录模块的开发，包括 Token 刷新机制和密码加密存储
2. 修复分页查询在大数据量下的性能问题
3. 重构缓存层逻辑，引入 LRU 淘汰策略`)
        setAiGenerated(true)
        setLoading(false)
      }, 1000)
    } catch (error) {
      message.error('生成失败')
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportContent)
      message.success('已复制到剪贴板')
    } catch (error) {
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
                  <Text code>{item.hash.substring(0, 7)}</Text>
                  <Text>{item.message}</Text>
                  <Text type="secondary">{item.date}</Text>
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
