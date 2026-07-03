import { Card, Row, Col, Statistic, List, Typography, Button } from 'antd'
import {
  DatabaseOutlined,
  CommitOutlined,
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
  hash: string
  message: string
  repo_name: string
  date: string
}

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ totalRepos: 0, totalCommits: 0, todayCommits: 0 })
  const [recentCommits, setRecentCommits] = useState<RecentCommit[]>([])

  useEffect(() => {
    // Load stats and recent commits
    const loadData = async () => {
      try {
        // These would be IPC calls in the real app
        // For now, use mock data
        setStats({
          totalRepos: 5,
          totalCommits: 1234,
          todayCommits: 12
        })
        setRecentCommits([
          {
            hash: 'abc123',
            message: 'feat: 新增用户登录模块',
            repo_name: 'TraceLight',
            date: dayjs().subtract(1, 'hour').toISOString()
          },
          {
            hash: 'def456',
            message: 'fix: 修复分页查询Bug',
            repo_name: 'Backend',
            date: dayjs().subtract(3, 'hour').toISOString()
          },
          {
            hash: 'ghi789',
            message: 'refactor: 重构缓存逻辑',
            repo_name: 'TraceLight',
            date: dayjs().subtract(5, 'hour').toISOString()
          }
        ])
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      }
    }
    loadData()
  }, [])

  return (
    <div>
      <Title level={3}>仪表盘</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="今日提交"
              value={stats.todayCommits}
              prefix={<CommitOutlined />}
              valueStyle={{ color: '#4F46E5' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总提交数"
              value={stats.totalCommits}
              prefix={<CommitOutlined />}
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
                    {item.hash.substring(0, 7)}
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
