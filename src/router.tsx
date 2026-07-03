import { createHashRouter, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Repos from './pages/Repos';
import Commits from './pages/Commits';
import Daily from './pages/Daily';
import Weekly from './pages/Weekly';
import Stats from './pages/Stats';
import Settings from './pages/Settings';

function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  return (
    <MainLayout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode}>
      <Outlet />
    </MainLayout>
  );
}

export const router = createHashRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'repos', element: <Repos /> },
      { path: 'commits', element: <Commits /> },
      { path: 'daily', element: <Daily /> },
      { path: 'weekly', element: <Weekly /> },
      { path: 'stats', element: <Stats /> },
      { path: 'settings', element: <Settings /> }
    ]
  }
]);
