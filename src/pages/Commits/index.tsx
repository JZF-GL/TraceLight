import { Card, Table, Select, DatePicker, Tag, Typography, Space } from 'antd'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { RangePicker } = DatePicker
const { Text } = Typography

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
  const [commits, setCommits] = useState<Commit[]>([])
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().startOf('day'),
    dayjs().endOf('day')
  ])
  const [selectedRepo, setSelectedRepo] = useState<number | null>(null)

  useEffect(() => {
    loadRepos()
  }, [])

  useEffect(() => {
    loadCommits()
  }, [dateRange, selectedRepo])

  const loadRepos = async () => {
    try {
      const data = await window.api.git.getRepos()
      setRepos(data)
    } catch (error) {
      console.error('Failed to load repos:', error)
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
        filters.since = dateRange[0].startOf('day').toISOString()
      }
      if (dateRange[1]) {
        filters.until = dateRange[1].endOf('day').toISOString()
      }

      const data = await window.api.git.getCommits(filters)
      setCommits(data)
    } catch (error) {
      console.error('Failed to load commits:', error)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<Commit> = [
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      width: 100,
      render: (hash) => (
        <Text code style={{ fontSize: 12 }}>
          {hash?.substring(0, 7)}
        </Text>
      )
    },
    {
      title: '提交信息',
      dataIndex: 'message',
      key: 'message',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '仓库',
      dataIndex: 'repo_name',
      key: 'repo_name',
      render: (name) => <Tag>{name}</Tag>
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author'
    },
    {
      title: '变更',
      key: 'changes',
      render: (_, record) => (
        <Space>
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
      render: (date) => dayjs(date).format('MM-DD HH:mm')
    }
  ]

  return (
    <div>
      <Card title="提交记录">
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="选择仓库"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setSelectedRepo(value)}
          >
            {repos.map(repo => (
              <Select.Option key={repo.id} value={repo.id}>
                {repo.name}
              </Select.Option>
            ))}
          </Select>
          <RangePicker
            value={dateRange as [dayjs.Dayjs, dayjs.Dayjs]}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={commits}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  )
}

export default Commits
