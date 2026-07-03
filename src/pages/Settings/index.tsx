import { Card, Form, Input, Select, TimePicker, Switch, Button, Space, Divider, message, Tabs, List, Popconfirm, Modal } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'

interface Account {
  id: number
  username: string
  password?: string
  token?: string
  ssh_key?: string
  type: 'github' | 'gitlab' | 'gitee'
  method: 'token' | 'ssh' | 'password'
}

interface Settings {
  workStartTime: string
  workEndTime: string
  timezone: string
  dailyReminder: boolean
  dailyReminderTime: string
  weeklyReminder: boolean
  weeklyReminderTime: string
}

declare global {
  interface Window {
    api: {
      account: {
        addAccount: (account: Omit<Account, 'id'>) => Promise<Account>
        removeAccount: (id: number) => Promise<void>
        getAccounts: () => Promise<Account[]>
      }
    }
  }
}

function Settings() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm] = Form.useForm()
  const [settingsForm] = Form.useForm()
  const [settings, setSettings] = useState<Settings>({
    workStartTime: '09:00',
    workEndTime: '18:00',
    timezone: 'Asia/Shanghai',
    dailyReminder: true,
    dailyReminderTime: '17:30',
    weeklyReminder: true,
    weeklyReminderTime: '17:00'
  })

  useEffect(() => {
    loadAccounts()
    loadSettings()
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await window.api.account.getAccounts()
      setAccounts(data || [])
    } catch (error) {
      console.error('Failed to load accounts:', error)
      setAccounts([])
    }
  }

  const loadSettings = async () => {
    try {
      const saved = localStorage.getItem('settings')
      if (saved) {
        setSettings(JSON.parse(saved))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const handleAddAccount = async () => {
    try {
      const values = await accountForm.validateFields()
      if (editingAccount) {
        message.success('账号更新成功')
      } else {
        await window.api.account.addAccount(values)
        message.success('账号添加成功')
      }
      setModalVisible(false)
      setEditingAccount(null)
      accountForm.resetFields()
      loadAccounts()
    } catch (error) {
      console.error('Failed to add account:', error)
      if (error instanceof Error && error.message.includes('Validation')) return
      message.error('操作失败: ' + (error instanceof Error ? error.message : String(error)))
    }
  }

  const handleDeleteAccount = async (id: number) => {
    try {
      await window.api.account.removeAccount(id)
      message.success('账号已删除')
      loadAccounts()
    } catch {
      message.error('加载账号失败')
    }
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    accountForm.setFieldsValue(account)
    setModalVisible(true)
  }

  const handleSaveSettings = async () => {
    try {
      const values = await settingsForm.validateFields()
      const newSettings = { ...settings, ...values }
      setSettings(newSettings)
      localStorage.setItem('settings', JSON.stringify(newSettings))
      message.success('设置已保存')
    } catch {
      message.error('删除失败')
    }
  }

  const tabItems = [
    {
      key: 'accounts',
      label: 'Git 账号',
      children: (
        <Card
          title="Git 账号管理"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingAccount(null)
                accountForm.resetFields()
                setModalVisible(true)
              }}
            >
              添加账号
            </Button>
          }
        >
          <List
            dataSource={accounts}
            renderItem={(account) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEditAccount(account)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    title="确定删除该账号？"
                    onConfirm={() => handleDeleteAccount(account.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="link" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta
                  title={account.username}
                  description={
                    <Space>
                      <span>平台: {account.type}</span>
                      <span>认证: {account.method === 'token' ? 'Token' : account.method === 'ssh' ? 'SSH Key' : '账号密码'}</span>
                      {account.token && <span>Token: ****</span>}
                      {account.ssh_key && <span>SSH Key: 已配置</span>}
                      {account.password && <span>密码: ****</span>}
                    </Space>
                  }
                />
              </List.Item>
            )}
            locale={{ emptyText: '暂无账号，请添加' }}
          />
        </Card>
      )
    },
    {
      key: 'worktime',
      label: '工作时间',
      children: (
        <Card title="工作时间设置">
          <Form
            form={settingsForm}
            layout="vertical"
            initialValues={settings}
            onFinish={handleSaveSettings}
          >
            <Form.Item label="上班时间" name="workStartTime">
              <TimePicker
                format="HH:mm"
                style={{ width: 200 }}
              />
            </Form.Item>

            <Form.Item label="下班时间" name="workEndTime">
              <TimePicker
                format="HH:mm"
                style={{ width: 200 }}
              />
            </Form.Item>

            <Form.Item label="时区" name="timezone">
              <Select style={{ width: 200 }}>
                <Select.Option value="Asia/Shanghai">中国标准时间 (UTC+8)</Select.Option>
                <Select.Option value="Asia/Tokyo">日本标准时间 (UTC+9)</Select.Option>
                <Select.Option value="America/New_York">美国东部时间 (UTC-5)</Select.Option>
                <Select.Option value="America/Los_Angeles">美国太平洋时间 (UTC-8)</Select.Option>
                <Select.Option value="Europe/London">格林威治标准时间 (UTC+0)</Select.Option>
              </Select>
            </Form.Item>

            <Divider />

            <Form.Item
              label="日报提醒"
              name="dailyReminder"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item label="提醒时间" name="dailyReminderTime">
              <TimePicker
                format="HH:mm"
                style={{ width: 200 }}
              />
            </Form.Item>

            <Divider />

            <Form.Item
              label="周报提醒"
              name="weeklyReminder"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item label="提醒时间" name="weeklyReminderTime">
              <TimePicker
                format="HH:mm"
                style={{ width: 200 }}
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                保存设置
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      key: 'about',
      label: '关于',
      children: (
        <Card title="关于 TraceLight">
          <p>TraceLight 是一款 Git 提交日报/周报生成器，帮助开发者快速生成工作汇报。</p>
          <p>版本: 0.1.0</p>
          <p>技术栈: Electron + React + TypeScript + Ant Design</p>
        </Card>
      )
    }
  ]

  return (
    <div>
      <Tabs items={tabItems} />

      <Modal
        title={editingAccount ? '编辑账号' : '添加账号'}
        open={modalVisible}
        onOk={handleAddAccount}
        onCancel={() => {
          setModalVisible(false)
          setEditingAccount(null)
          accountForm.resetFields()
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form form={accountForm} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="GitHub / GitLab / Gitee 用户名" />
          </Form.Item>

          <Form.Item
            name="type"
            label="平台类型"
            rules={[{ required: true, message: '请选择平台类型' }]}
          >
            <Select>
              <Select.Option value="github">GitHub</Select.Option>
              <Select.Option value="gitlab">GitLab</Select.Option>
              <Select.Option value="gitee">Gitee</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="method"
            label="认证方式"
            rules={[{ required: true, message: '请选择认证方式' }]}
            initialValue="token"
          >
            <Select>
              <Select.Option value="token">Personal Access Token</Select.Option>
              <Select.Option value="ssh">SSH Key</Select.Option>
              <Select.Option value="password">账号密码</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.method !== cur.method}>
            {({ getFieldValue }) => {
              const method = getFieldValue('method')
              if (method === 'token') {
                return (
                  <Form.Item
                    name="token"
                    label="Personal Access Token"
                    extra="用于 HTTPS 认证，可在平台设置中生成"
                  >
                    <Input.Password placeholder="ghp_xxxxxxxxxxxx" />
                  </Form.Item>
                )
              }
              if (method === 'ssh') {
                return (
                  <Form.Item
                    name="ssh_key"
                    label="SSH 私钥路径"
                    extra="用于 SSH 认证，填写本地私钥文件路径"
                  >
                    <Input placeholder="~/.ssh/id_rsa" />
                  </Form.Item>
                )
              }
              if (method === 'password') {
                return (
                  <Form.Item
                    name="password"
                    label="密码"
                    extra="部分平台可能已禁用密码认证，请优先使用 Token"
                  >
                    <Input.Password placeholder="输入账号密码" />
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Settings
