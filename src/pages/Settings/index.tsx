import { Card, Form, Input, Select, TimePicker, Switch, Button, Space, Divider, Typography, message } from 'antd'
import { SaveOutlined, KeyOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useState } from 'react'
import dayjs from 'dayjs'

const { Title, Text } = Typography

function Settings() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      // IPC call: save settings
      setTimeout(() => {
        message.success('设置已保存')
        setLoading(false)
      }, 500)
    } catch (error) {
      // Form validation failed
    }
  }

  return (
    <div>
      <Title level={3}>设置</Title>

      <Card title="Git 账号" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Git 用户名" />
          </Form.Item>
          <Form.Item
            name="token"
            label="Personal Access Token"
          >
            <Input.Password prefix={<KeyOutlined />} placeholder="ghp_xxxx 或 glpat-xxxx" />
          </Form.Item>
          <Form.Item
            name="account_type"
            label="平台类型"
            initialValue="github"
          >
            <Select>
              <Select.Option value="github">GitHub</Select.Option>
              <Select.Option value="gitlab">GitLab</Select.Option>
              <Select.Option value="gitee">Gitee</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="工作时间" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="work_start"
            label="上班时间"
            initialValue={dayjs('09:00', 'HH:mm')}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item
            name="work_end"
            label="下班时间"
            initialValue={dayjs('18:00', 'HH:mm')}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item
            name="timezone"
            label="时区"
            initialValue="Asia/Shanghai"
          >
            <Select>
              <Select.Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Select.Option>
              <Select.Option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</Select.Option>
              <Select.Option value="America/New_York">America/New_York (UTC-5)</Select.Option>
              <Select.Option value="Europe/London">Europe/London (UTC+0)</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="AI 配置" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="ai_provider"
            label="AI 提供商"
            initialValue="openai"
          >
            <Select>
              <Select.Option value="openai">OpenAI</Select.Option>
              <Select.Option value="ollama">Ollama (本地)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="ai_api_key"
            label="API Key"
          >
            <Input.Password placeholder="sk-xxxx" />
          </Form.Item>
          <Form.Item
            name="ai_model"
            label="模型"
            initialValue="gpt-4o-mini"
          >
            <Select>
              <Select.Option value="gpt-4o-mini">GPT-4o Mini</Select.Option>
              <Select.Option value="gpt-4o">GPT-4o</Select.Option>
              <Select.Option value="gpt-3.5-turbo">GPT-3.5 Turbo</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="通知偏好" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical">
          <Form.Item
            name="daily_reminder"
            label="日报提醒"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="daily_reminder_time"
            label="提醒时间"
            initialValue={dayjs('17:30', 'HH:mm')}
          >
            <TimePicker format="HH:mm" />
          </Form.Item>
          <Form.Item
            name="weekly_reminder"
            label="周报提醒"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="weekly_reminder_day"
            label="提醒日"
            initialValue="friday"
          >
            <Select>
              <Select.Option value="thursday">周四</Select.Option>
              <Select.Option value="friday">周五</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Card title="外观">
        <Form form={form} layout="vertical">
          <Form.Item
            name="auto_sync_interval"
            label="自动同步间隔（分钟）"
            initialValue={30}
          >
            <Select>
              <Select.Option value={15}>15 分钟</Select.Option>
              <Select.Option value={30}>30 分钟</Select.Option>
              <Select.Option value={60}>1 小时</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>

      <Divider />

      <Space>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={loading}
        >
          保存设置
        </Button>
        <Button onClick={() => form.resetFields()}>
          重置
        </Button>
      </Space>
    </div>
  )
}

export default Settings
