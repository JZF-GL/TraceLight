import { Card, Table, Button, Modal, Form, Input, Space, Popconfirm, message, Select } from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SyncOutlined,
  CloudDownloadOutlined,
  BranchesOutlined
} from '@ant-design/icons'
import { useEffect, useState, useCallback } from 'react'
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
        updateRepo: (id: number, repo: Omit<Repo, 'id' | 'created_at'>) => Promise<void>
        removeRepo: (id: number) => Promise<void>
        getRepos: () => Promise<Repo[]>
        getRemoteBranches: (localPath: string) => Promise<string[]>
        syncLocal: (repoId: number, since: string) => Promise<any[]>
        syncRemote: (repoId: number, since: string, auth?: { username?: string; password?: string; token?: string }) => Promise<any[]>
        getCommits: (filters: { repoId?: number; since?: string; until?: string }) => Promise<any[]>
      }
      account: {
        getAccounts: () => Promise<any[]>
      }
    }
  }
}

function Repos() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRepo, setEditingRepo] = useState<Repo | null>(null)
  const [accounts, setAccounts] = useState<any[]>([])
  const [branchLoading, setBranchLoading] = useState(false)
  const [branches, setBranches] = useState<string[]>([])
  const [form] = Form.useForm()

  const loadRepos = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.git.getRepos()
      setRepos(data || [])
    } catch (error) {
      console.error('Failed to load repos:', error)
      setRepos([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAccounts = useCallback(async () => {
    try {
      const data = await window.api.account.getAccounts()
      setAccounts(data || [])
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
  }, [])

  useEffect(() => {
    loadRepos()
    loadAccounts()
  }, [loadRepos, loadAccounts])

  const handleFetchBranches = async () => {
    const localPath = form.getFieldValue('local_path')
    if (!localPath) {
      message.warning('请先输入本地仓库路径')
      return
    }
    setBranchLoading(true)
    try {
      const result = await window.api.git.getRemoteBranches(localPath)
      setBranches(result || [])
      if (result && result.length > 0) {
        form.setFieldsValue({ branch: result[0] })
        message.success(`获取到 ${result.length} 个分支`)
      } else {
        message.info('未找到分支，请检查本地路径是否为 git 仓库')
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error)
      message.error('获取分支失败: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setBranchLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRepo) {
        await window.api.git.updateRepo(editingRepo.id, values)
        message.success('仓库更新成功')
      } else {
        await window.api.git.addRepo(values)
        message.success('仓库添加成功')
      }
      setModalVisible(false)
      setEditingRepo(null)
      form.resetFields()
      loadRepos()
    } catch (error) {
      console.error('Failed to save repo:', error)
      message.error('操作失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleEdit = (repo: Repo) => {
    setEditingRepo(repo)
    setBranches([])
    form.setFieldsValue(repo)
    setModalVisible(true)
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

  const handleSyncLocal = async (repo: Repo) => {
    message.loading({ content: '正在从本地同步...', key: 'sync' })
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      await window.api.git.syncLocal(repo.id, since)
      message.success({ content: '本地同步完成', key: 'sync' })
      loadRepos()
    } catch (error) {
      console.error('Local sync failed:', error)
      message.error({ content: '同步失败: ' + (error instanceof Error ? error.message : String(error)), key: 'sync' })
    }
  }

  const handleSyncRemote = async (repo: Repo) => {
    message.loading({ content: '正在从远程同步...', key: 'sync' })
    try {
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const account = accounts[0]
      const auth = account ? { username: account.username, token: account.token, password: account.password } : undefined
      await window.api.git.syncRemote(repo.id, since, auth)
      message.success({ content: '远程同步完成', key: 'sync' })
      loadRepos()
    } catch (error) {
      console.error('Remote sync failed:', error)
      message.error({ content: '同步失败: ' + (error instanceof Error ? error.message : String(error)), key: 'sync' })
    }
  }

  const columns: ColumnsType<Repo> = [
    {
      title: '仓库名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
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
      key: 'branch',
      width: 100
    },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleSyncLocal(record)}
          >
            本地同步
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CloudDownloadOutlined />}
            onClick={() => handleSyncRemote(record)}
          >
            远程同步
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该仓库？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
            onClick={() => {
              setEditingRepo(null)
              setBranches([])
              form.resetFields()
              setModalVisible(true)
            }}
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
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={editingRepo ? '编辑仓库' : '添加仓库'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false)
          setEditingRepo(null)
          setBranches([])
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
          <Form.Item label="默认分支">
            <Space.Compact style={{ width: '100%' }}>
              {branches.length > 0 ? (
                <Form.Item name="branch" noStyle>
                  <Select
                    placeholder="选择分支"
                    style={{ width: 'calc(100% - 120px)' }}
                    options={branches.map(b => ({ label: b, value: b }))}
                    showSearch
                  />
                </Form.Item>
              ) : (
                <Form.Item name="branch" noStyle initialValue="main">
                  <Input placeholder="点击「获取分支」自动填入" style={{ width: 'calc(100% - 120px)' }} />
                </Form.Item>
              )}
              <Button
                icon={<BranchesOutlined />}
                loading={branchLoading}
                onClick={handleFetchBranches}
              >
                获取分支
              </Button>
            </Space.Compact>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Repos
