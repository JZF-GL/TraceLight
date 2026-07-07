import { Layout, Menu, Typography, Space } from 'antd'
import {
  DashboardOutlined,
  DatabaseOutlined,
  CodeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAppStore } from '../../stores/app'
import logo from '../../assets/logo.svg'

const { Sider, Content } = Layout
const { Title } = Typography

interface MainLayoutProps {
  children: ReactNode
}

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/repos', icon: <DatabaseOutlined />, label: '仓库管理' },
  { key: '/commits', icon: <CodeOutlined />, label: '提交记录' },
  { key: '/daily', icon: <FileTextOutlined />, label: '日报' },
  { key: '/weekly', icon: <CalendarOutlined />, label: '周报' },
  { key: '/stats', icon: <BarChartOutlined />, label: '统计' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' }
]

function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const isDarkMode = useAppStore((s) => s.theme === 'dark')

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme={isDarkMode ? 'dark' : 'light'}
        width={200}
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          borderRight: '1px solid #f0f0f0',
          background: isDarkMode ? '#141414' : '#fff',
          overflowY: 'auto'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Space>
            <img src={logo} alt="TraceLight" style={{ width: 32, height: 32 }} />
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
      <Layout style={{ marginLeft: 200 }}>
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
