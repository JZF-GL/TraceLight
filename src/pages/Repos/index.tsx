import { Card, Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SyncOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import type { ColumnsType } from 'antd/es/table'

interface Repo {
  id: number
  name: string
  remote_url: string
  local_path: string
  branch: string
  created_at: string
}

declare global {
  interface Window {
    api: {
      git: {
        addRepo: (repo: Omit<Repo, 'id' | 'created_at'>) => Promise<Repo>
        removeRepo: (id: number) => Promise<void>
        getRepos: () => Promise<Repo[]>
        syncCommits: (repoId: number, since: string) => Promise<any[]>
      }
    }
  }
}

function Repos() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadRepos()
  }, [])

  const loadRepos = async () => {
    setLoading(true)
    try {
      const data = await window.api.git.getRepos()
      setRepos(data)
    } catch {
      message.error('加载仓库失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    try {
      const values = await form.validateFields()
      await window.api.git.addRepo(values)
      message.success('仓库添加成功')
      setModalVisible(false)
      form.resetFields()
      loadRepos()
    } catch {
      // Form validation failed
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await window.api.git.removeRepo(id)
      message.success('仓库已删除')
      loadRepos()
    } catch {
      message.error('删除失败')
    }
  }

  const handleSync = async (repo: Repo) => {
    message.loading({ content: '正在同步...', key: 'sync' })
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      await window.api.git.syncCommits(repo.id, since)
      message.success({ content: '同步完成', key: 'sync' })
    } catch {
      message.error({ content: '同步失败', key: 'sync' })
    }
  }

  const columns: ColumnsType<Repo> = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: '远程地址',
      dataIndex: 'remote_url',
      key: 'remote_url',
      ellipsis: true
    },
    {
      title: '本地路径',
      dataIndex: 'local_path',
      key: 'local_path',
      ellipsis: true
    },
    {
      title: '分支',
      dataIndex: 'branch',
      key: 'branch'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<SyncOutlined />}
            onClick={() => handleSync(record)}
          >
            同步
          </Button>
          <Button type="link" icon={<EditOutlined />}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该仓库？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card
        title="仓库管理"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            添加仓库
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={repos}
          rowKey="id"
          loading={loading}
        />
      </Card>

      <Modal
        title="添加仓库"
        open={modalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="仓库名称"
            rules={[{ required: true, message: '请输入仓库名称' }]}
          >
            <Input placeholder="例如：my-project" />
          </Form.Item>
          <Form.Item
            name="remote_url"
            label="远程仓库地址"
            rules={[{ required: true, message: '请输入远程仓库地址' }]}
          >
            <Input placeholder="https://github.com/user/repo.git" />
          </Form.Item>
          <Form.Item
            name="local_path"
            label="本地路径"
            rules={[{ required: true, message: '请输入本地路径' }]}
          >
            <Input placeholder="C:/Users/user/projects/my-project" />
          </Form.Item>
          <Form.Item
            name="branch"
            label="默认分支"
            initialValue="main"
          >
            <Select>
              <Select.Option value="main">main</Select.Option>
              <Select.Option value="master">master</Select.Option>
              <Select.Option value="develop">develop</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Repos
