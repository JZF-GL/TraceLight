import { Card, Row, Col, Statistic, Typography, DatePicker, Space } from 'antd'
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DatabaseOutlined,
  CommitOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

function Stats() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week')
  ])

  // Mock data for charts (in real app, use a chart library like Recharts or ECharts)
  const mockStats = {
    totalCommits: 67,
    totalAdditions: 2850,
    totalDeletions: 420,
    activeRepos: 5,
    avgCommitsPerDay: 9.5,
    mostActiveDay: '周三',
    topRepo: 'TraceLight'
  }

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
                value={mockStats.totalCommits}
                prefix={<CommitOutlined />}
                valueStyle={{ color: '#4F46E5' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="新增代码"
                value={mockStats.totalAdditions}
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: '#3f8600' }}
                suffix="行"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="删除代码"
                value={mockStats.totalDeletions}
                prefix={<ArrowDownOutlined />}
                valueStyle={{ color: '#cf1322' }}
                suffix="行"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="活跃仓库"
                value={mockStats.activeRepos}
                prefix={<DatabaseOutlined />}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Card title="提交趋势">
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">[图表区域 - 接入 Recharts/ECharts]</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="代码变更热力图">
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">[热力图区域]</Text>
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card title="仓库贡献分布">
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">[饼图区域]</Text>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="日均提交"
                value={mockStats.avgCommitsPerDay}
                precision={1}
                suffix="次"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="最活跃日"
                value={mockStats.mostActiveDay}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="主力仓库"
                value={mockStats.topRepo}
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
