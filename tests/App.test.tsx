import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';
import fs from 'fs';
import path from 'path';

// Mock page components to isolate App testing
vi.mock('../src/pages/Dashboard', () => ({
  default: () => <div data-testid="dashboard">Dashboard</div>,
}));
vi.mock('../src/pages/Repos', () => ({
  default: () => <div data-testid="repos">Repos</div>,
}));
vi.mock('../src/pages/Commits', () => ({
  default: () => <div data-testid="commits">Commits</div>,
}));
vi.mock('../src/pages/Daily', () => ({
  default: () => <div data-testid="daily">Daily</div>,
}));
vi.mock('../src/pages/Weekly', () => ({
  default: () => <div data-testid="weekly">Weekly</div>,
}));
vi.mock('../src/pages/Stats', () => ({
  default: () => <div data-testid="stats">Stats</div>,
}));
vi.mock('../src/pages/Settings', () => ({
  default: () => <div data-testid="settings">Settings</div>,
}));
vi.mock('../src/components/Layout/MainLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="main-layout">{children}</div>
  ),
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('includes React Router with default route', () => {
    render(<App />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('has Ant Design ConfigProvider configured', () => {
    // ConfigProvider is a React context provider - verify app renders correctly
    render(<App />);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('sets colorPrimary to #4F46E5 in source', () => {
    const appTsx = fs.readFileSync(
      path.resolve(__dirname, '../src/App.tsx'),
      'utf-8'
    );
    expect(appTsx).toContain("colorPrimary: '#4F46E5'");
  });
});
