import { Card, Form, Input, Select, TimePicker, Switch, Button, Space, Divider, message, Tabs, List, Popconfirm, Modal, Statistic, Row, Col } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, ClearOutlined, DatabaseOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { useAppStore } from '../../stores/app'

interface Account {
  id: number
  username: string
  password?: string
  token?: string
  ssh_key?: string
  type: string
  method: string
}

interface Settings {
  workStartTime: dayjs.Dayjs
  workEndTime: dayjs.Dayjs
  timezone: string
  dailyReminder: boolean
  dailyReminderTime: dayjs.Dayjs
  weeklyReminder: boolean
  weeklyReminderTime: dayjs.Dayjs
}

interface AIConfig {
  provider: 'local' | 'openai' | 'ollama'
  apiKey?: string
  model?: string
  baseUrl?: string
}

function Settings() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accountForm] = Form.useForm()
  const [settingsForm] = Form.useForm()
  const [aiForm] = Form.useForm()
  const [settings, setSettings] = useState<Settings>({
    workStartTime: dayjs('09:00', 'HH:mm'),
    workEndTime: dayjs('18:00', 'HH:mm'),
    timezone: 'Asia/Shanghai',
    dailyReminder: true,
    dailyReminderTime: dayjs('17:30', 'HH:mm'),
    weeklyReminder: true,
    weeklyReminderTime: dayjs('17:00', 'HH:mm')
  })
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'local'
  })
  const [storageInfo, setStorageInfo] = useState({ database: 0, cache: 0, localStorage: 0, total: 0 })
  const [clearing, setClearing] = useState(false)
  const isDarkMode = useAppStore((s) => s.theme === 'dark')
  const setTheme = useAppStore((s) => s.setTheme)

  useEffect(() => {
    loadAccounts()
    loadSettings()
    loadAIConfig()
    loadStorageInfo()
  }, [])

  const loadStorageInfo = async () => {
    try {
      const info = await window.api.settings.getStorageInfo()
      setStorageInfo(info)
    } catch (error) {
      console.error('Failed to load storage info:', error)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleClearAllData = async () => {
    setClearing(true)
    try {
      const result = await window.api.settings.clearAllData()
      if (result.success) {
        message.success('所有数据已清除，页面将刷新')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else if (!result.cancelled) {
        message.error('清除失败: ' + (result.error || '未知错误'))
      }
    } catch (error) {
      message.error('清除失败')
    } finally {
      setClearing(false)
    }
  }

  const handleClearCache = async () => {
    setClearing(true)
    try {
      const result = await window.api.settings.clearCache()
      if (result.success) {
        message.success('缓存已清除')
        loadStorageInfo()
      } else {
        message.error('清除失败: ' + (result.error || '未知错误'))
      }
    } catch (error) {
      message.error('清除失败')
    } finally {
      setClearing(false)
    }
  }

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
        const parsed = JSON.parse(saved)
        setSettings({
          ...parsed,
          workStartTime: dayjs(parsed.workStartTime, 'HH:mm'),
          workEndTime: dayjs(parsed.workEndTime, 'HH:mm'),
          dailyReminderTime: dayjs(parsed.dailyReminderTime, 'HH:mm'),
          weeklyReminderTime: dayjs(parsed.weeklyReminderTime, 'HH:mm')
        })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  const loadAIConfig = async () => {
    try {
      const config = await window.api.ai.getConfig()
      const aiConf: AIConfig = {
        provider: (config.provider as AIConfig['provider']) || 'local',
        apiKey: config.apiKey,
        model: config.model,
        baseUrl: config.baseUrl
      }
      setAiConfig(aiConf)
      aiForm.setFieldsValue(aiConf)
    } catch (error) {
      console.error('Failed to load AI config:', error)
    }
  }

  const handleAddAccount = async () => {
    try {
      const values = await accountForm.validateFields()
      if (editingAccount) {
        await window.api.account.updateAccount(editingAccount.id, values)
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
      localStorage.setItem('settings', JSON.stringify({
        ...newSettings,
        workStartTime: newSettings.workStartTime?.format('HH:mm'),
        workEndTime: newSettings.workEndTime?.format('HH:mm'),
        dailyReminderTime: newSettings.dailyReminderTime?.format('HH:mm'),
        weeklyReminderTime: newSettings.weeklyReminderTime?.format('HH:mm')
      }))
      message.success('设置已保存')
    } catch {
      message.error('保存失败')
    }
  }

  const handleSaveAIConfig = async () => {
    try {
      const values = await aiForm.validateFields()
      await window.api.ai.configure(values)
      const aiConf: AIConfig = {
        provider: values.provider as AIConfig['provider'],
        apiKey: values.apiKey,
        model: values.model,
        baseUrl: values.baseUrl
      }
      setAiConfig(aiConf)
      message.success('AI 配置已保存')
    } catch {
      message.error('保存失败')
    }
  }

  const tabItems = [
    {
      key: 'system',
      label: '系统设置',
      children: (
        <Card title="系统设置">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 400 }}>
            <Space>
              {isDarkMode ? <MoonOutlined /> : <SunOutlined />}
              <span>外观模式</span>
            </Space>
            <Space>
              <span style={{ color: isDarkMode ? '#999' : '#333' }}>{isDarkMode ? '深色' : '浅色'}</span>
              <Switch
                checked={isDarkMode}
                onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                checkedChildren={<MoonOutlined />}
                unCheckedChildren={<SunOutlined />}
              />
            </Space>
          </div>
          <Divider />
          <p style={{ color: '#999', marginBottom: 0 }}>后续将在这里添加更多系统级配置项。</p>
        </Card>
      )
    },
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
      key: 'ai',
      label: 'AI 配置',
      children: (
        <Card title="AI 大模型配置">
          <Form
            form={aiForm}
            layout="vertical"
            initialValues={aiConfig}
            onFinish={handleSaveAIConfig}
          >
            <Form.Item
              label="模型提供商"
              name="provider"
              rules={[{ required: true, message: '请选择模型提供商' }]}
            >
              <Select style={{ width: 300 }}>
                <Select.Option value="local">本地生成（无需 API）</Select.Option>
                <Select.Option value="openai">OpenAI</Select.Option>
                <Select.Option value="ollama">Ollama（本地部署）</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.provider !== cur.provider}>
              {({ getFieldValue }) => {
                const provider = getFieldValue('provider')
                if (provider === 'local') {
                  return (
                    <div style={{ color: '#666', marginBottom: 16 }}>
                      使用本地模板生成日报/周报，无需配置 API。如需更智能的总结，请选择 OpenAI 或 Ollama。
                    </div>
                  )
                }
                return null
              }}
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.provider !== cur.provider}>
              {({ getFieldValue }) => {
                const provider = getFieldValue('provider')
                if (provider !== 'local') {
                  return (
                    <>
                      <Form.Item
                        label="API 地址"
                        name="baseUrl"
                        extra={provider === 'openai' ? '默认: https://api.openai.com' : '例如: http://localhost:11434'}
                      >
                        <Input
                          placeholder={provider === 'openai' ? 'https://api.openai.com' : 'http://localhost:11434'}
                          style={{ width: 400 }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="API Key"
                        name="apiKey"
                        rules={[{ required: true, message: '请输入 API Key' }]}
                      >
                        <Input.Password
                          placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                          style={{ width: 400 }}
                        />
                      </Form.Item>

                      <Form.Item
                        label="模型名称"
                        name="model"
                      >
                        <Input
                          placeholder={provider === 'openai' ? 'gpt-3.5-turbo' : 'llama2'}
                          style={{ width: 300 }}
                        />
                      </Form.Item>
                    </>
                  )
                }
                return null
              }}
            </Form.Item>

            <Form.Item>
              <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                保存配置
              </Button>
            </Form.Item>
          </Form>
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
          <Divider />
          <p><strong>开发者：</strong>江卓峰</p>
          <p><strong>技术交流：</strong>微信号 XXJiangZF</p>
        </Card>
      )
    },
    {
      key: 'data',
      label: '数据管理',
      children: (
        <Card title="数据与存储">
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Statistic title="数据库" value={formatSize(storageInfo.database)} />
            </Col>
            <Col span={6}>
              <Statistic title="缓存" value={formatSize(storageInfo.cache)} />
            </Col>
            <Col span={6}>
              <Statistic title="本地存储" value={formatSize(storageInfo.localStorage)} />
            </Col>
            <Col span={6}>
              <Statistic title="总计" value={formatSize(storageInfo.total)} />
            </Col>
          </Row>

          <Divider />

          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Card type="inner" title="清除缓存" extra={<Button icon={<ClearOutlined />} onClick={handleClearCache} loading={clearing}>清除缓存</Button>}>
              <p>清除应用缓存数据，不会影响仓库、账号和提交记录。</p>
            </Card>

            <Card
              type="inner"
              title="清除所有数据"
              extra={
                <Popconfirm
                  title="确定要清除所有数据吗？"
                  description="此操作将删除所有仓库、账号、提交记录和报告，且无法恢复！"
                  onConfirm={handleClearAllData}
                  okText="确认清除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />} loading={clearing}>清除所有数据</Button>
                </Popconfirm>
              }
            >
              <p>删除所有应用数据，包括：仓库配置、Git 账号、提交记录、生成的报告等。此操作不可恢复。</p>
            </Card>
          </Space>
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
