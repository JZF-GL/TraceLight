import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import { useState, useEffect } from 'react'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Repos from './pages/Repos'
import Commits from './pages/Commits'
import Daily from './pages/Daily'
import Weekly from './pages/Weekly'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const savedMode = localStorage.getItem('theme')
    if (savedMode === 'dark') {
      setIsDarkMode(true)
    }
  }, [])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#4F46E5',
          borderRadius: 8
        }
      }}
    >
      <Router>
        <MainLayout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/repos" element={<Repos />} />
            <Route path="/commits" element={<Commits />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/weekly" element={<Weekly />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  )
}

export default App
