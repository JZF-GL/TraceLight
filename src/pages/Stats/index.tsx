import { Card, Row, Col, Statistic, Typography, DatePicker } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DatabaseOutlined,
  CodeOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'

const { Text } = Typography
const { RangePicker } = DatePicker

const PIE_COLORS = ['#4F46E5', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6', '#EC4899', '#6366F1']

interface OverviewStats {
  totalRepos: number
  totalCommits: number
  todayCommits: number
}

interface TrendData {
  labels: string[]
  values: number[]
}

interface RepoContribution {
  name: string
  count: number
}

declare global {
  interface Window {
    api: {
      stats: {
        getOverview: () => Promise<OverviewStats>
        getTrend: (days: number) => Promise<TrendData>
        getRepoContributions: () => Promise<RepoContribution[]>
      }
    }
  }
}

function Stats() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week')
  ])
  const [overview, setOverview] = useState<OverviewStats>({
    totalRepos: 0,
    totalCommits: 0,
    todayCommits: 0
  })
  const [trend, setTrend] = useState<TrendData>({ labels: [], values: [] })
  const [repoContributions, setRepoContributions] = useState<RepoContribution[]>([])

  useEffect(() => {
    loadStats()
  }, [dateRange])

  const loadStats = async () => {
    try {
      const overviewData = await window.api.stats.getOverview()
      setOverview(overviewData)

      const days = dateRange[1].diff(dateRange[0], 'days') + 1
      const trendData = await window.api.stats.getTrend(days)
      setTrend(trendData)

      const repos = await window.api.stats.getRepoContributions()
      setRepoContributions(repos)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const totalCommits = trend.values.reduce((sum, v) => sum + v, 0)
  const topRepo = repoContributions.length > 0 ? repoContributions[0] : null

  return (
    <div>
      <Card
        title="数据统计"
        extra={
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setDateRange([dates[0], dates[1]])
              }
            }}
          />
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总提交数"
                value={overview.totalCommits}
                prefix={<CodeOutlined />}
                valueStyle={{ color: '#4F46E5' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="今日提交"
                value={overview.todayCommits}
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: '#3f8600' }}
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="区间提交"
                value={totalCommits}
                prefix={<ArrowDownOutlined />}
                valueStyle={{ color: '#cf1322' }}
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="管理仓库"
                value={overview.totalRepos}
                prefix={<DatabaseOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card title="提交趋势">
              <div style={{ height: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {trend.values.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: 180, gap: 4 }}>
                    {trend.values.map((value, index) => (
                      <div
                        key={index}
                        style={{
                          flex: 1,
                          height: `${Math.max((value / Math.max(...trend.values, 1)) * 100, 4)}%`,
                          backgroundColor: '#4F46E5',
                          borderRadius: '4px 4px 0 0',
                          minHeight: 4
                        }}
                        title={`${trend.labels[index]}: ${value} 次`}
                      />
                    ))}
                  </div>
                ) : (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text type="secondary">暂无数据</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="仓库贡献分布">
              {repoContributions.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, height: 200 }}>
                  <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      {(() => {
                        const total = repoContributions.reduce((s, r) => s + r.count, 0)
                        let acc = 0
                        return repoContributions.map((repo, i) => {
                          const pct = (repo.count / total) * 100
                          const dash = `${pct} ${100 - pct}`
                          const offset = -acc
                          acc += pct
                          return (
                            <circle
                              key={i}
                              cx="18"
                              cy="18"
                              r="15.915"
                              fill="none"
                              stroke={PIE_COLORS[i % PIE_COLORS.length]}
                              strokeWidth="3.5"
                              strokeDasharray={dash}
                              strokeDashoffset={offset}
                            />
                          )
                        })
                      })()}
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {repoContributions.slice(0, 5).map((repo, i) => (
                      <div key={repo.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                        <Text ellipsis style={{ flex: 1, fontSize: 13 }}>{repo.name}</Text>
                        <Text type="secondary" style={{ fontSize: 13, flexShrink: 0 }}>{repo.count}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">暂无数据</Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Card styles={{ body: { height: 78, display: 'flex', alignItems: 'center' } }}>
              <Statistic
                title="日均提交"
                value={trend.values.length > 0 ? (totalCommits / trend.values.length).toFixed(1) : 0}
                precision={1}
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card styles={{ body: { height: 78, display: 'flex', alignItems: 'center' } }}>
              <Statistic
                title="最活跃日"
                value={trend.labels[trend.values.indexOf(Math.max(...trend.values))] || '-'}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card styles={{ body: { height: 78, display: 'flex', alignItems: 'center' } }}>
              <Statistic
                title="主力仓库"
                value={topRepo ? topRepo.name : '-'}
                prefix={<DatabaseOutlined />}
                valueStyle={{ fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Stats
