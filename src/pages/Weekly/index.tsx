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
import { useState } from 'react'
import dayjs from 'dayjs'

const { Title, Paragraph, Text } = Typography
const { TextArea } = Input
const { WeekPicker } = DatePicker

interface CommitSummary {
  hash: string
  message: string
  repo_name: string
  date: string
  additions: number
  deletions: number
}

function Weekly() {
  const [selectedWeek, setSelectedWeek] = useState<dayjs.Dayjs>(dayjs())
  const [loading, setLoading] = useState(false)
  const [aiGenerated, setAiGenerated] = useState(false)
  const [reportContent, setReportContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [template, setTemplate] = useState<'technical' | 'concise' | 'detailed'>('technical')

  const [commits] = useState<CommitSummary[]>([
    { hash: 'abc123', message: 'feat: 新增用户登录模块', repo_name: 'TraceLight', date: '周一', additions: 150, deletions: 20 },
    { hash: 'def456', message: 'fix: 修复分页查询Bug', repo_name: 'Backend', date: '周二', additions: 10, deletions: 5 },
    { hash: 'ghi789', message: 'refactor: 重构缓存逻辑', repo_name: 'TraceLight', date: '周三', additions: 80, deletions: 40 },
    { hash: 'jkl012', message: 'feat: 添加数据导出功能', repo_name: 'TraceLight', date: '周四', additions: 200, deletions: 30 },
    { hash: 'mno345', message: 'fix: 修复时区问题', repo_name: 'Backend', date: '周五', additions: 15, deletions: 8 }
  ])

  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0)
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0)

  const generateReport = async () => {
    setLoading(true)
    try {
      // IPC call: api.ai.summarize(commits, 'weekly')
      setTimeout(() => {
        setReportContent(`本周工作总结：

一、功能开发
1. 完成用户登录模块，支持 Token 刷新和密码加密
2. 实现数据导出功能，支持 CSV/Excel 格式

二、Bug 修复
1. 修复分页查询在大数据量下的性能问题
2. 解决跨时区日期显示错误

三、代码优化
1. 重构缓存层，引入 LRU 淘汰策略，内存占用降低 30%

下周计划：
1. 完成用户权限管理模块
2. 优化搜索功能性能
3. 编写单元测试覆盖核心模块`)
        setAiGenerated(true)
        setLoading(false)
      }, 1500)
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
                  <Text code>{item.hash.substring(0, 7)}</Text>
                  <Text>{item.message}</Text>
                  <Text type="secondary">{item.date}</Text>
                  <Tag color="green">+{item.additions}</Tag>
                  <Tag color="red">-{item.deletions}</Tag>
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
