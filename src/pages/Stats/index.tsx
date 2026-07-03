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

interface OverviewStats {
  totalRepos: number
  totalCommits: number
  todayCommits: number
}

interface TrendData {
  labels: string[]
  values: number[]
}

declare global {
  interface Window {
    api: {
      stats: {
        getOverview: () => Promise<OverviewStats>
        getTrend: (days: number) => Promise<TrendData>
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
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const totalAdditions = trend.values.reduce((sum, v) => sum + v, 0)

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
                title="累计提交"
                value={totalAdditions}
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
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">[饼图区域 - 接入 Recharts/ECharts]</Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="日均提交"
                value={trend.values.length > 0 ? (totalAdditions / trend.values.length).toFixed(1) : 0}
                precision={1}
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="最活跃日"
                value={trend.labels[trend.values.indexOf(Math.max(...trend.values))] || '-'}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="主力仓库"
                value="待统计"
                prefix={<DatabaseOutlined />}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default Stats
