import { Card, Table, Select, DatePicker, Tag, Typography, Space, Button, Tooltip, Pagination } from 'antd'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { useAppStore } from '../../stores/app'

const { RangePicker } = DatePicker
const { Text } = Typography

const messageLineStyle: React.CSSProperties = {
  display: '-webkit-box',
  WebkitLineClamp: 3,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  wordBreak: 'break-all'
}

type QuickRange = 'today' | 'week' | 'month' | null

interface Commit {
  id: number
  hash: string
  message: string
  author: string
  date: string
  additions: number
  deletions: number
  files_changed: number
  repo_name: string
}

interface Repo {
  id: number
  name: string
}

declare global {
  interface Window {
    api: {
      git: {
        getCommits: (filters: { repoId?: number; since?: string; until?: string }) => Promise<Commit[]>
        getRepos: () => Promise<Repo[]>
      }
    }
  }
}

function Commits() {
  const { commitsPage, setCommitsPage } = useAppStore()
  const { dateRange, selectedRepo, quickRange, commits } = commitsPage
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    loadRepos()
  }, [])

  useEffect(() => {
    setPage(1)
    loadCommits()
  }, [dateRange, selectedRepo])

  const loadRepos = async () => {
    try {
      const data = await window.api.git.getRepos()
      setRepos(data || [])
    } catch (error) {
      console.error('Failed to load repos:', error)
      setRepos([])
    }
  }

  const loadCommits = async () => {
    setLoading(true)
    try {
      const filters: { repoId?: number; since?: string; until?: string } = {}

      if (selectedRepo) {
        filters.repoId = selectedRepo
      }
      if (dateRange[0]) {
        filters.since = dateRange[0].startOf('day').format('YYYY-MM-DD')
      }
      if (dateRange[1]) {
        filters.until = dateRange[1].endOf('day').format('YYYY-MM-DD')
      }

      const data = await window.api.git.getCommits(filters)
      setCommitsPage({ commits: data })
    } catch (error) {
      console.error('Failed to load commits:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickRange = (range: QuickRange) => {
    const now = dayjs()
    let newRange: [dayjs.Dayjs, dayjs.Dayjs]
    switch (range) {
      case 'today':
        newRange = [now.startOf('day'), now.endOf('day')]
        break
      case 'week':
        newRange = [now.startOf('week'), now.endOf('day')]
        break
      case 'month':
        newRange = [now.startOf('month'), now.endOf('day')]
        break
      default:
        return
    }
    setCommitsPage({ quickRange: range, dateRange: newRange })
  }

  const columns: ColumnsType<Commit> = [
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 100,
      render: (hash) => (
        <Text code style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
          {hash?.substring(0, 7)}
        </Text>
      )
    },
    {
      title: '提交信息',
      dataIndex: 'message',
      key: 'message',
      width: 200,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          <div style={messageLineStyle}>{text}</div>
        </Tooltip>
      )
    },
    {
      title: '仓库',
      dataIndex: 'repo_name',
      key: 'repo_name',
      width: 100,
      render: (name) => <Tag>{name}</Tag>
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      width: 100,
    },
    {
      title: '变更',
      key: 'changes',
      width: 200,
      render: (_, record) => (
        <Space style={{ whiteSpace: 'nowrap' }}>
          <Tag color="green">+{record.additions}</Tag>
          <Tag color="red">-{record.deletions}</Tag>
          <Text type="secondary">{record.files_changed} 文件</Text>
        </Space>
      )
    },
    {
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      render: (date) => <span style={{ whiteSpace: 'nowrap' }}>{dayjs(date).format('MM-DD HH:mm')}</span>
    }
  ]

  return (
    <div style={{ height: 'calc(100vh - 96px)', display: 'flex', flexDirection: 'column' }}>
      <Card
        title="提交记录"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' } }}
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="选择仓库"
            style={{ width: 200 }}
            allowClear
            value={selectedRepo}
            onChange={(value) => setCommitsPage({ selectedRepo: value })}
          >
            {repos.map(repo => (
              <Select.Option key={repo.id} value={repo.id}>
                {repo.name}
              </Select.Option>
            ))}
          </Select>
          <Button.Group>
            <Button
              type={quickRange === 'today' ? 'primary' : 'default'}
              onClick={() => handleQuickRange('today')}
            >
              今天
            </Button>
            <Button
              type={quickRange === 'week' ? 'primary' : 'default'}
              onClick={() => handleQuickRange('week')}
            >
              本周
            </Button>
            <Button
              type={quickRange === 'month' ? 'primary' : 'default'}
              onClick={() => handleQuickRange('month')}
            >
              本月
            </Button>
          </Button.Group>
          <RangePicker
            value={dateRange as [dayjs.Dayjs, dayjs.Dayjs]}
            onChange={(dates) => {
              setCommitsPage({
                dateRange: dates as [dayjs.Dayjs | null, dayjs.Dayjs | null],
                quickRange: null
              })
            }}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={commits.slice((page - 1) * pageSize, page * pageSize)}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 800, y: 'calc(100vh - 350px)' }}
          style={{ flex: 1, minHeight: 0 }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, flexShrink: 0 }}>
          <Pagination
            current={page}
            pageSize={pageSize}
            total={commits.length}
            showSizeChanger={false}
            onChange={setPage}
          />
        </div>
      </Card>
    </div>
  )
}

export default Commits
