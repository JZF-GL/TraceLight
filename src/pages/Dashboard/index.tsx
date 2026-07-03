import { Card, Row, Col, Statistic, List, Typography, Button } from 'antd'
import {
  DatabaseOutlined,
  CodeOutlined,
  FileTextOutlined,
  PlusOutlined
} from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface Stats {
  totalRepos: number
  totalCommits: number
  todayCommits: number
}

interface RecentCommit {
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
        getCommits: (filters: { repoId?: number; since?: string; until?: string }) => Promise<RecentCommit[]>
        getRepos: () => Promise<any[]>
      }
      stats: {
        getOverview: () => Promise<Stats>
      }
    }
  }
}

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ totalRepos: 0, totalCommits: 0, todayCommits: 0 })
  const [recentCommits, setRecentCommits] = useState<RecentCommit[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load stats
      const overview = await window.api.stats.getOverview()
      setStats(overview)

      // Load recent commits (today)
      const today = dayjs().format('YYYY-MM-DD')
      const commits = await window.api.git.getCommits({
        since: `${today}T00:00:00`,
        until: `${today}T23:59:59`
      })
      setRecentCommits(commits.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  return (
    <div>
      <Title level={3}>仪表盘</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日提交"
              value={stats.todayCommits}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#4F46E5' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总提交数"
              value={stats.totalCommits}
              prefix={<CodeOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="管理仓库"
              value={stats.totalRepos}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="快速操作"
        style={{ marginBottom: 24 }}
      >
        <Row gutter={16}>
          <Col>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => navigate('/daily')}
            >
              生成日报
            </Button>
          </Col>
          <Col>
            <Button
              icon={<PlusOutlined />}
              onClick={() => navigate('/repos')}
            >
              添加仓库
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="最近提交">
        <List
          dataSource={recentCommits}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Text code style={{ fontSize: 12 }}>
                    {item.hash?.substring(0, 7)}
                  </Text>
                }
                description={
                  <div>
                    <div>{item.message}</div>
                    <Text type="secondary">
                      {item.repo_name} · {dayjs(item.date).format('HH:mm')}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default Dashboard
