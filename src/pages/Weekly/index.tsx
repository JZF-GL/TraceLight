import { Card, Button, DatePicker, Space, Typography, List, Tag, Spin, message, Input, Radio, Row, Col, Statistic } from 'antd'
import {
  CopyOutlined,
  FilePdfOutlined,
  ReloadOutlined,
  EditOutlined,
  CheckOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'

const { Paragraph, Text } = Typography
const { TextArea } = Input
const { WeekPicker } = DatePicker

interface CommitSummary {
  id: number
  hash: string
  message: string
  repo_name: string
  date: string
  additions: number
  deletions: number
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
        generateWeekly: (date: string) => Promise<{ content: string; commits: CommitSummary[] }>
        saveReport: (report: { type: string; date: string; content: string }) => Promise<any>
      }
    }
  }
}

function Weekly() {
  const [selectedWeek, setSelectedWeek] = useState<dayjs.Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [_aiGenerated, setAiGenerated] = useState(false)
  const [reportContent, setReportContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [template, setTemplate] = useState<'technical' | 'concise' | 'detailed'>('technical')
  const [commits, setCommits] = useState<CommitSummary[]>([])

  useEffect(() => {
    loadCommits()
  }, [selectedWeek])

  const loadCommits = async () => {
    try {
      const date = selectedWeek.format('YYYY-MM-DD')
      const result = await window.api.report.generateWeekly(date)
      setCommits(result.commits || [])
      if (result.content) {
        setReportContent(result.content)
        setAiGenerated(true)
      }
    } catch (error) {
      console.error('Failed to load commits:', error)
    }
  }

  const totalAdditions = commits.reduce((sum, c) => sum + (c.additions || 0), 0)
  const totalDeletions = commits.reduce((sum, c) => sum + (c.deletions || 0), 0)

  const generateReport = async () => {
    setLoading(true)
    try {
      const commitMessages = commits.map(c => c.message)
      const content = await window.api.ai.summarize(commitMessages, template === 'technical' ? 'weekly' : 'weekly')
      setReportContent(content)
      setAiGenerated(true)
      
      // Save report
      const date = selectedWeek.format('YYYY-MM-DD')
      await window.api.report.saveReport({
        type: 'weekly',
        date,
        content
      })
      
      message.success('周报生成成功')
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
        title="周报"
        extra={
          <Space>
            <WeekPicker
              value={selectedWeek}
              onChange={(date) => date && setSelectedWeek(date)}
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
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="新增代码"
              value={totalAdditions}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix="行"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="删除代码"
              value={totalDeletions}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
              suffix="行"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="涉及仓库"
              value={new Set(commits.map(c => c.repo_name)).size}
              suffix="个"
            />
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Text strong>本周提交记录</Text>
          <List
            size="small"
            dataSource={commits}
            renderItem={(item) => (
              <List.Item>
                <Space>
                  <Tag>{item.repo_name}</Tag>
                  <Text code>{item.hash?.substring(0, 7)}</Text>
                  <Text>{item.message}</Text>
                  <Text type="secondary">{dayjs(item.date).format('MM-DD')}</Text>
                  {item.additions !== undefined && <Tag color="green">+{item.additions}</Tag>}
                  {item.deletions !== undefined && <Tag color="red">-{item.deletions}</Tag>}
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
                rows={12}
              />
            ) : (
              <Card size="small" style={{ background: '#f5f5f5' }}>
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {reportContent || '点击"重新生成"按钮生成周报'}
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

export default Weekly
