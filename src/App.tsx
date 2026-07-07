import { RouterProvider } from 'react-router-dom';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import { router } from './router';
import { useAppStore } from './stores/app';

function App() {
  const isDarkMode = useAppStore((s) => s.theme === 'dark');

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
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
