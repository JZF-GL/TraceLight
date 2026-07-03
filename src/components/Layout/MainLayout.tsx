import { Layout, Menu, Switch, Typography, Space } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  CommitOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

const { Sider, Content, Header } = Layout
const { Title } = Typography

interface MainLayoutProps {
  children: ReactNode
  isDarkMode: boolean
  setIsDarkMode: (value: boolean) => void
}

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/repos', icon: <DatabaseOutlined />, label: '仓库管理' },
  { key: '/commits', icon: <CommitOutlined />, label: '提交记录' },
  { key: '/daily', icon: <FileTextOutlined />, label: '日报' },
  { key: '/weekly', icon: <CalendarOutlined />, label: '周报' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' }
]

function MainLayout({ children, isDarkMode, setIsDarkMode }: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme={isDarkMode ? 'dark' : 'light'}
        width={200}
        style={{
          borderRight: '1px solid #f0f0f0',
          background: isDarkMode ? '#141414' : '#fff'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <Title level={4} style={{ margin: 0, color: '#4F46E5' }}>
              TraceLight
            </Title>
          </Space>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: isDarkMode ? '#141414' : '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <Space>
            <SunOutlined />
            <Switch
              checked={isDarkMode}
              onChange={(checked) => {
                setIsDarkMode(checked)
                localStorage.setItem('theme', checked ? 'dark' : 'light')
              }}
            />
            <MoonOutlined />
          </Space>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: '24px',
            background: isDarkMode ? '#1f1f1f' : '#fff',
            borderRadius: 8,
            minHeight: 280
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
