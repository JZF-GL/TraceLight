import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { useState, useEffect } from 'react';
import { router } from './router';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('theme');
    if (savedMode === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

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
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
