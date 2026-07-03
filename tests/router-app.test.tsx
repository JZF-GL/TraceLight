import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import App from '../src/App';

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

describe('App with RouterProvider', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
  });

  it('renders Dashboard by default (root route redirects to /dashboard)', () => {
    render(<App />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
  });

  it('uses RouterProvider instead of BrowserRouter', () => {
    const appTsx = fs.readFileSync(
      path.resolve(__dirname, '../src/App.tsx'),
      'utf-8'
    );
    expect(appTsx).toContain('RouterProvider');
    expect(appTsx).not.toContain('BrowserRouter');
  });

  it('imports router from src/router module', () => {
    const appTsx = fs.readFileSync(
      path.resolve(__dirname, '../src/App.tsx'),
      'utf-8'
    );
    expect(appTsx).toContain("from './router'");
  });
});
